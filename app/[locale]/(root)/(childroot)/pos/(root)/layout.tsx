"use client";

import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface PosLayoutProps {
  children: ReactNode;
}

/** POS window: title, caption, hairline, then the segmented control over the content. */
const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  const { t } = useTranslation(translationConstant.POSSALES);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 px-2 pt-2">
        <div>
          <h1 className="text-title2 text-label">{t("POS-Sales_k26")}</h1>
          <p className="mt-1 text-body text-label-2">{t("POS-Sales_k27")}</p>
        </div>
        <div className="h-px w-full bg-separator" />
        <div className="flex justify-start">
          <TopTabs />
        </div>
      </div>
      <main className="w-full">{children}</main>
    </div>
  );
};

export default PosLayout;
