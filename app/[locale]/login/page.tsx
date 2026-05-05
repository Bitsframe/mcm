"use client";
import { useState, useEffect } from "react";
import { login } from "@/actions/supabase_auth/action";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

function Login() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const params = useParams();
  const router = useRouter();
  
  useEffect(() => {
    const locale = params.locale as string;
    if (locale && i18n && i18n.language !== locale && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(locale);
    }
  }, [params.locale, i18n]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await login(formData);
      // @ts-ignore
      if (result?.error) {
        
        toast(
          <div className="flex justify-between">
            <p>{result.error}</p>
            <button
              onClick={() => toast.dismiss()} 
              className="absolute top-0 right-0 p-1 rounded hover:bg-gray-100"
            >
              <span className="text-sm">&#x2715;</span>
            </button>
          </div>
        )        } else {
          const loc = (params.locale as string) || "en";
          setTimeout(() => router.push(`/${loc}?toast=login_success`), 1500);
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

              <Button
                type="submit"
                className="w-full bg-primary_color text-white disabled:opacity-70 hover:opacity-90 active:opacity-80"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin text-white" size={20} />
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