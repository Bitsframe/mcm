"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { FolderClosed, Package } from "lucide-react";

/** macOS segmented control switching between the two Warehouse views. */
const TopTabs = () => {
  const pathname = usePathname();
  const basePath = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const { t } = useTranslation(translationConstant.INVENTORY);

  const tabs = [
    { title: "Inventory_k1", url: "/", icon: FolderClosed },
    { title: "Inventory_k2", url: "products", icon: Package },
  ];

  return (
    <nav
      aria-label="Warehouse views"
      className="inline-flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5 shadow-mac-inset"
    >
      {tabs.map((tab) => {
        const isActive =
          basePath === `/warehouse/manage/${tab.url}` ||
          (basePath === "/warehouse/manage" && tab.url === "/");
        const Icon = tab.icon;
        return (
          <Link
            key={tab.url}
            href={`/warehouse/manage/${tab.url}`}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-body font-medium transition-colors ${
              isActive ? "bg-white text-label shadow-mac-sm" : "text-label-2 hover:text-label"
            }`}
          >
            <Icon size={14} className={isActive ? "text-brand-700" : "text-label-3"} />
            {t(tab.title)}
          </Link>
        );
      })}
    </nav>
  );
};

export default TopTabs;
