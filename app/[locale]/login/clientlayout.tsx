"use client";

import { useEffect, useState } from "react";
import { Darklogo } from "@/assets/images";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import LanguageChanger from "@/components/LanguageChanger";
import { useLocale } from "next-intl";

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Login shell — a macOS-style welcome window: wordmark and headline on the
 * left panel, the sign-in card on a slightly darker grouped surface on the
 * right. Light only; the tokens come from app/globals.css.
 *
 * `mounted` predates the styling pass: it gates the first render and is not
 * something to alter on the login screen as part of a visual change.
 */
export default function ClientLayout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const locale = useLocale();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const headline = (
    <>
      {t("Login_k4")}{" "}
      <span className="font-bold text-brand-700">{t("Login_k5")}</span>
    </>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Phones */}
      <div className="flex min-h-screen flex-col gap-8 p-5 md:hidden">
        <div className="flex items-center justify-between">
          <Image src={Darklogo} alt="MyClinic MD" className="h-7 w-auto" priority />
          <LanguageChanger locale={locale} />
        </div>
        <h1 className="mt-6 text-center text-title2 text-label">{headline}</h1>
        <div className="flex justify-center">{children}</div>
      </div>

      {/* Desktop */}
      <div className="hidden min-h-screen md:flex">
        <div className="flex w-1/2 flex-col p-8">
          <Image src={Darklogo} alt="MyClinic MD" className="h-9 w-auto self-start" priority />
          <div className="my-auto max-w-md px-6">
            <h1 className="text-title1 leading-tight text-label">{headline}</h1>
            <p className="mt-3 text-callout text-label-2">Clinic operations, sales and patient care in one place.</p>
          </div>
        </div>

        <div className="relative w-1/2 border-l border-border bg-surface-2/60">
          <div className="absolute right-5 top-4 z-10">
            <LanguageChanger locale={locale} />
          </div>
          <div className="flex h-full items-center justify-center p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
