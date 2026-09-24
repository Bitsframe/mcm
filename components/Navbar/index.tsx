"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext, TabContext } from "@/context";
import MenuWithAvatar from "./MenuWithAvatar";
import LanguageChanger from "../LanguageChanger";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { translationConstant } from "@/utils/translationConstants";
import { Menu, X } from "lucide-react";
import { SidebarSection } from "@/components/Sidebar";
import { usePathname } from "next/navigation";

/**
 * Window toolbar: 52px, translucent, hairline underneath. Title on the left,
 * account controls on the right. On phones it also owns the sidebar drawer.
 */
export const Navbar = ({ width }: { width: string }) => {
  const { activeTitle } = useContext(TabContext);
  const { userProfile } = useContext(AuthContext);
  const pathname = usePathname();

  const locale = useLocale();
  const { t } = useTranslation(translationConstant.DASHBOARD);

  useEffect(() => {
    if (i18n && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(locale);
    }
  }, [locale]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <header
      className="bg-vibrant fixed top-0 z-50 flex h-[52px] items-center justify-between border-b border-border pl-4 pr-3 md:pl-14"
      style={isMobile ? { width: "100vw", left: 0 } : { width: `calc(100% - ${width})` }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open navigation"
          className="-ml-1 flex h-8 w-8 items-center justify-center rounded-md text-label-2 hover:bg-black/[0.05] md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate text-headline text-label">
          <span className="font-normal text-label-2">{t("Dashboard_k27")} </span>
          {userProfile?.full_name}
        </h1>
        {activeTitle ? <span className="sr-only">{activeTitle}</span> : null}
      </div>

      <div className="flex items-center gap-2">
        {!isMobile && <LanguageChanger locale={locale} />}
        <MenuWithAvatar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="animate-slideInLeft relative h-full w-[260px] bg-surface shadow-mac-lg">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-2 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md text-label-2 hover:bg-black/[0.05]"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarSection />
          </div>
        </div>
      )}
    </header>
  );
};
