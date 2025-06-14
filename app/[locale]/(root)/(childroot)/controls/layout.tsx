// app/settings/layout.tsx
'use client'

import { TabContext } from "@/context";
import { useContext, useEffect } from "react";
import TopTabs from "./controltabs";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
export default function ControlsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setActiveTitle } = useContext(TabContext);
  const { t } = useTranslation(translationConstant.CONTROLS);
  useEffect(() => {
    setActiveTitle("Sidebar_k22");
  }, []);

  return (
    <div>
      <div className="py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white pl-4">{t("CT_k27")}</h1>
      </div>

      <div className="block sm:hidden mb-4">
        <TopTabs />
      </div>

      <div className="flex gap-5 dark:bg-[#0E1725]">
        <div className="hidden sm:block space-y-5">
          <TopTabs />
        </div>
        <main
          className=" w-full font-[500] text-[20px] space-y-5 rounded-md"
        >
          <main>{children}</main>
        </main>
      </div>
    </div>
  );
}