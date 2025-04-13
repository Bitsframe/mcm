"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { FolderClosed, ShoppingCart, Warehouse } from "lucide-react";

const TopTabs = () => {
  const pathname = usePathname();

  const PosTopMenu = [
    {
      title: "Inventory_k1",
      url: "/",
      icon: FolderClosed,
    },
    {
      title: "Inventory_k2",
      url: "products",
      icon: ShoppingCart,
    },
    {
      title: "Inventory_k3",
      url: "inventory",
      icon: Warehouse,
    },
  ];

  const { t } = useTranslation(translationConstant.INVENTORY);

  return (
    <nav className="flex items-center justify-center rounded-lg bg-gray-100 p-1 w-fit">
      <ul className="flex gap-2">
        {PosTopMenu.map((menuItem, index) => {
          const isActive =
            pathname === `/inventory/manage/${menuItem.url}` ||
            (pathname === "/inventory/manage" && menuItem.url === "/");

          const Icon = menuItem.icon;

          return (
            <li key={index}>
              <Link
                href={`/inventory/manage/${menuItem.url}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-gray-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  {t(menuItem.title)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TopTabs;
