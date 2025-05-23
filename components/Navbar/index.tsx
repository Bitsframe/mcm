"use client";

import { HiOutlineBell } from "react-icons/hi";
import { useContext, useEffect, useState } from "react";
import { AuthContext, TabContext } from "@/context";
import MenuWithAvatar from "./MenuWithAvatar";
import LanguageChanger from "../LanguageChanger";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { translationConstant } from "@/utils/translationConstants";
import ThemeToggleButton from "../Themetoggle";
import { Menu } from "lucide-react";
import { SidebarSection } from "@/components/Sidebar";

export const Navbar = ({ width }: { width: string }) => {
  const { activeTitle } = useContext(TabContext);
  const { userProfile } = useContext(AuthContext);

  const locale = useLocale();
  const { t } = useTranslation(translationConstant.SIDEBAR);

  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  // Sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header
      className={`h-[70px] flex justify-between items-center fixed bg-[#F1F4F9] dark:bg-[#080E16] text-black dark:text-white pt-[6px] z-50`}
      style={{ width: `calc(100% - ${width})` }}
    >
      {/* Hamburger for small screens */}
      <div className="flex items-center gap-2">
        <button
          className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={28} />
        </button>
        <div className="text-[16px] font-[700]">
          <div>
            <span className="text-[#79808B] dark:text-gray-400">
              Welcome Back,
            </span>{" "}
            {userProfile?.full_name}
          </div>
        </div>
      </div>
      <div className="flex gap-4 items-center pr-4">
        <LanguageChanger locale={locale} />
        <ThemeToggleButton />
        <div className="text-[#000000] dark:text-white text-[16px] bg-white dark:bg-[#1A1F27] p-4 rounded-full border border-[#E0E0E0] dark:border-[#2F3640] cursor-not-allowed">
          <HiOutlineBell size={25} />
        </div>
        <MenuWithAvatar />
      </div>

      {/* Sidebar Drawer for small screens */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative w-64 h-full bg-[#F1F4F9] dark:bg-[#080E16] shadow-lg animate-slideInLeft">
            <button
              className="absolute top-4 right-4 text-gray-600 dark:text-gray-300"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
            <SidebarSection />
          </div>
        </div>
      )}
    </header>
  );
};
