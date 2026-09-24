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
  }, [setActiveTitle]);

  return (
    <div>
      <div className="px-2 py-3">
        <h1 className="text-title2 text-label">{t("CT_k27")}</h1>
      </div>

      <div className="block sm:hidden mb-4">
        <TopTabs />
      </div>

      <div className="flex gap-5">
        <div className="hidden sm:block space-y-5">
          <TopTabs />
        </div>
        <main className="w-full space-y-5">{children}</main>
      </div>
    </div>
  );
}