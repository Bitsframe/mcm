"use client";

import { HiOutlineBell } from "react-icons/hi";

import { useContext } from "react";
import { TabContext } from "@/context";
import MenuWithAvatar from "./MenuWithAvatar";
import LanguageChanger from "../LanguageChanger";
import { useLocale } from "next-intl";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

export const Navbar = ({ width }: { width: string }) => {
  const { activeTitle } = useContext(TabContext);
  const locale = useLocale();
  const {t} = useTranslation(translationConstant.SIDEBAR);

  return (
    <header
      className={` h-[70px] px-5 flex justify-between items-center fixed bg-[#B8C8E1]`}
      style={{ width: `calc(100% - ${width})` }}
    >
      <div className="text-[#121111] text-[16px] font-[700]">{t(activeTitle)}</div>
      <div className="flex gap-4 items-center pr-5">
        <div className="z-50">
          <LanguageChanger locale={locale} />
        </div>
        <div className="text-[#000000] text-[16px]">
          <HiOutlineBell />
        </div>
        <MenuWithAvatar />
      </div>
    </header>
  );
};
