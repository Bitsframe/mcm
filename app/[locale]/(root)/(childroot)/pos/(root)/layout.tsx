"use client";

import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface PosLayoutProps {
  children: ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  const { t } = useTranslation(translationConstant.POSSALES);
  return (
    <div>
      <div className="space-y-3 p-2">
        <div>
          <h1 className="text-xl font-bold">{t("POS-Sales_k26")}</h1>
          <p className="mt-0.5 mb-1 text-gray-500 text-sm">{t("POS-Sales_k27")}</p>
        </div>
        <div className="h-px w-full bg-gray-300"></div>
        <div className="flex justify-start">
        <TopTabs />
        </div>
      </div>
      <main
        style={{ zIndex: 9999999 }}
        className=" w-full bg-white dark:bg-[#0e1725] font-medium text-base space-y-3 p-1 rounded"
      >
        {children}
      </main>
    </div>
  );
};

export default PosLayout;