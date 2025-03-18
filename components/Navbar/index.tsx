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

export const Navbar = ({ width }: { width: string }) => {
  const { activeTitle } = useContext(TabContext);
  const { userProfile, userRole } = useContext(AuthContext);
  
  const locale = useLocale();
  const { t } = useTranslation(translationConstant.SIDEBAR); // Direct namespace use kiya

  // ✅ Sync i18n language on locale change
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  // Logs for debugging
  console.log("Current Locale:", locale);
  console.log("Active Title Key:", activeTitle);
  console.log("Translated Text:", t(activeTitle));

  return (
    <header
      className={`h-[70px] flex justify-between items-center fixed bg-[#F1F4F9] pt-[6px]`}
      style={{ width: `calc(100% - ${width})` }}
    >
      <div className="text-[#121111] text-[16px] font-[700]">
        {/* {t(activeTitle)} */}
       <div> <span className="text-[#79808B]">Welcome Back,</span>{userProfile?.full_name} </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="z-50 ">
          <LanguageChanger locale={locale} />
        </div>
        <div className="text-[#000000] text-[16px] bg-white p-4 rounded-full border-[1px] border-[#E0E0E0]">
          <HiOutlineBell size={25}/>
        </div>
        <MenuWithAvatar />
      </div>
    </header>
  );
};