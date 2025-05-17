"use client";

import { HiOutlineBell } from "react-icons/hi";
import { useContext, useEffect } from "react";
import { AuthContext, TabContext } from "@/context";
import MenuWithAvatar from "./MenuWithAvatar";
import LanguageChanger from "../LanguageChanger";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { translationConstant } from "@/utils/translationConstants";
import ThemeToggleButton from "../Themetoggle";

export const Navbar = ({ width }: { width: string }) => {
  const { activeTitle } = useContext(TabContext);
  const { userProfile } = useContext(AuthContext);

  const locale = useLocale();
  const { t } = useTranslation(translationConstant.SIDEBAR);

  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  return (
    <header
      className={`h-[70px] flex justify-between items-center fixed bg-[#F1F4F9] dark:bg-[#080E16] text-black dark:text-white pt-[6px] z-50`}
      style={{ width: `calc(100% - ${width})` }}
    >
      <div className="text-[16px] font-[700]">
        <div>
          <span className="text-[#79808B] dark:text-gray-400">
            Welcome Back,
          </span>{" "}
          {userProfile?.full_name}
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
    </header>
  );
};
