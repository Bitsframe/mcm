"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

const normalizeLoginError = (message: string) => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("request rate limit reached") ||
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("rate limit")
  ) {
    return "Too many login attempts. Please wait a minute and try again.";
  }

  // Sometimes server action payload noise leaks into the UI.
  if (message.includes('0:["$@1"')) {
    return "Temporary login issue. Please try again in a moment.";
  }

  return message;
};

const isRateLimitedError = (message: string) => {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("request rate limit reached") ||
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("rate limit")
  );
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Login() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaBypass, setCaptchaBypass] = useState(false);
  const captchaWidgetRef = useRef<string | null>(null);
  const captchaRenderRequestedRef = useRef(false);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const isCaptchaRequired = Boolean(turnstileSiteKey);
  
  useEffect(() => {
    const locale = params.locale as string;
    if (locale && i18n && i18n.language !== locale && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(locale);
    }
  }, [params.locale, i18n]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setCooldownUntil(0);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!turnstileSiteKey) return;

    const scriptId = "cf-turnstile-script";
    const renderWidget = () => {
      if (!window.turnstile || captchaWidgetRef.current || captchaRenderRequestedRef.current) return;
      const container = document.getElementById("turnstile-container");
      if (!container || container.childElementCount > 0) return;
      captchaRenderRequestedRef.current = true;
      try {
        const widgetId = window.turnstile.render("#turnstile-container", {
          sitekey: turnstileSiteKey,
          callback: (token: string) => {
            setCaptchaBypass(false);
            setCaptchaToken(token);
          },
          "expired-callback": () => setCaptchaToken(""),
          "error-callback": () => {
            setCaptchaToken("");
            setCaptchaBypass(true);
          },
          theme: "auto",
        });
        captchaWidgetRef.current = widgetId;
      } catch {
        setCaptchaBypass(true);
      }
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const scriptErrorHandler = () => setCaptchaBypass(true);
    script.addEventListener("error", scriptErrorHandler);
    script.addEventListener("load", renderWidget);
    const renderTimeout = window.setTimeout(() => {
      if (!captchaWidgetRef.current) {
        setCaptchaBypass(true);
      }
    }, 5000);
    return () => {
      window.clearTimeout(renderTimeout);
      script?.removeEventListener("error", scriptErrorHandler);
      script?.removeEventListener("load", renderWidget);
      if (window.turnstile && captchaWidgetRef.current) {
        window.turnstile.remove?.(captchaWidgetRef.current);
        captchaWidgetRef.current = null;
      }
      captchaRenderRequestedRef.current = false;
    };
  }, [turnstileSiteKey]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (loading) return; // Prevent double submission
    if (cooldownUntil && Date.now() < cooldownUntil) {
      toast(`Please wait ${secondsLeft || 1}s before trying again.`);
      return;
    }
    if (isCaptchaRequired && !captchaBypass && !captchaToken) {
      toast("Please complete the CAPTCHA first.");
      return;
    }
    
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = (formData.get("email") as string)?.trim();
      const password = (formData.get("password") as string) || "";
      const loc = (params.locale as string) || "en";

      // Retry once for transient auth/provider failures.
      // Turnstile tokens are single-use, so never retry when CAPTCHA is enabled.
      let authError: any = null;
      const shouldUseCaptcha = isCaptchaRequired && !captchaBypass && Boolean(captchaToken);
      const maxAttempts = shouldUseCaptcha ? 1 : 2;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: shouldUseCaptcha ? { captchaToken } : undefined,
        });
        authError = error;
        if (!error) {
          setTimeout(() => router.push(`/${loc}?toast=login_success`), 500);
          return;
        }

        const isRateLimit = isRateLimitedError(error.message || "");
        if (attempt === 0 && !isRateLimit && maxAttempts > 1) {
          await wait(500);
          continue;
        }
        break;
      }

      if (authError) {
        const message = authError.message || "Login failed";
        let errorMessage = normalizeLoginError(message);

        // Structured safe log for debugging production auth failures.
        console.warn("Login auth failure", {
          status: authError.status,
          code: authError.code,
          message,
          isRateLimited: isRateLimitedError(message),
        });

        if (isRateLimitedError(message)) {
          const retryMs = 60_000;
          setCooldownUntil(Date.now() + retryMs);
          setSecondsLeft(Math.ceil(retryMs / 1000));
        }
        if (
          message.toLowerCase().includes("timeout-or-duplicate") ||
          authError.code === "captcha_failed"
        ) {
          errorMessage = "CAPTCHA expired or already used. Please complete it again.";
        }
        if (isCaptchaRequired && window.turnstile && captchaWidgetRef.current) {
          window.turnstile.reset(captchaWidgetRef.current);
          setCaptchaToken("");
        }

        toast(
          <div className="flex justify-between">
            <p>{errorMessage}</p>
            <button
              onClick={() => toast.dismiss()} 
              className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100"
            >
              <span className="text-sm">&#x2715;</span>
            </button>
          </div>
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      toast("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className=" w-full flex">
      <div className="flex-1 flex items-center justify-center px-4 md:px-0 mt-12">
        <Card className="w-full max-w-[450px] mx-auto">
          <CardHeader className="text-center">
            <h1 className="text-xl font-bold">{t("Login_k1")}</h1>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <input
                type="hidden"
                name="locale"
                value={(params.locale as string) || "en"}
              />
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder={t("Login_k2")}
                className="w-full"
              />

              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t("Login_k3")}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <IoEyeOff size={22} /> : <IoEye size={22} />}
                </button>
              </div>

              {isCaptchaRequired ? (
                <div id="turnstile-container" className="flex justify-center" />
              ) : (
                <p className="text-xs text-amber-700 text-center">
                  CAPTCHA is not configured. Set <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> and redeploy.
                </p>
              )}
              {captchaBypass ? (
                <p className="text-xs text-amber-700 text-center">
                  CAPTCHA service unavailable. Continuing login without CAPTCHA.
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full bg-primary_color text-white disabled:opacity-70 hover:opacity-90 active:opacity-80"
                disabled={loading || (cooldownUntil > Date.now()) || (isCaptchaRequired && !captchaBypass && !captchaToken)}
              >
                {loading ? (
                  <Loader2 className="animate-spin text-white" size={20} />
                ) : cooldownUntil > Date.now() ? (
                  `Try again in ${secondsLeft}s`
                ) : (
                  t("Login_k1")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default Login;