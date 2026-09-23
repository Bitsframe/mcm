"use client"

import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface WarehouseLayoutProps {
  children: ReactNode;
}

/** Warehouse window: title row with the segmented Categories / Products control, then the content. */
const WarehouseLayout: React.FC<WarehouseLayoutProps> = ({ children }) => {
  const { t } = useTranslation(translationConstant.INVENTORY);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title2 text-label">{t("Inventory_k24")}</h1>
        <TopTabs />
      </div>
      <main className="w-full">{children}</main>
    </div>
  );
};

export default WarehouseLayout;
