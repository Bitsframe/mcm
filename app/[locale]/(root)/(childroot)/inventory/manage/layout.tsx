"use client";
import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface PosLayoutProps {
  children: ReactNode;
}

/** Inventory window: title row, then the content. */
const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  const { t } = useTranslation(translationConstant.INVENTORY);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2">
        <h1 className="text-title2 text-label">{t("Inventory_k3")}</h1>
      </div>
      <main className="w-full">{children}</main>
    </div>
  );
};

export default PosLayout;
