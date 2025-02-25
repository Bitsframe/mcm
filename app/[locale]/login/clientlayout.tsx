"use client";

import { useEffect, useState } from "react";
import { Darklogo, Lightlogo } from "@/assets/images";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageChanger from "@/components/LanguageChanger";
import { useLocale } from "next-intl";

interface LayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: LayoutProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
    const { t, i18n } = useTranslation();
    const locale = useLocale()
  

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`min-h-screen flex ${theme === "dark" ? "dark" : ""}`}>
      <div
        className={`w-1/2 p-3 ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        {theme === "dark" ? (
          <Image src={Lightlogo} alt="Logo" className="w-48 opacity-90" />
        ) : (
          <Image src={Darklogo} alt="Logo" className="w-48 opacity-90" />
        )}

        <div className="text-3xl font-semibold mt-28 dark:text-white px-10">
          {t("Login_k4")} <span className="text-[#58646b]"><b>{t("Login_k5")}</b></span>
        </div>
      </div>

      <div
        className={`w-1/2 relative ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-200"
        }`}
      >
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <LanguageChanger locale={locale} />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white text-black dark:bg-black dark:text-white hover:bg-gray-700 transition"
          >
            {theme === "dark" ? <Moon /> : <Sun />}
          </button>
        </div>

        <div className="h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
