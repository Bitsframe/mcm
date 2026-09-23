// app/settings/layout.tsx
'use client'

import { TabContext } from "@/context";
import { useContext, useEffect } from "react";
import TopTabs from "./settingstabs";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setActiveTitle } = useContext(TabContext);
  const { t } = useTranslation(translationConstant.SETTINGS);
  useEffect(() => {
    setActiveTitle("Sidebar_k22");
  }, [setActiveTitle]);

  return (
    <div className="">
      <div className="px-2 py-3 sm:px-3">
        <h1 className="text-title2 text-label">{t("Settings_k3")}</h1>
        <p className="mt-1 text-body text-label-2">{t("Settings_k2")}</p>
      </div>

      <div className="block sm:hidden mb-4">
        <TopTabs />
      </div>
      <div className="flex justify-center gap-5 px-2">
        <div className="hidden sm:block space-y-5">
          <TopTabs />
        </div>
        <main className="w-full space-y-5">{children}</main>
      </div>
    </div>
  );
}