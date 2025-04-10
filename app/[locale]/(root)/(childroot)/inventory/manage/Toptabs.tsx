"use client"
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from 'next/navigation'
import EditIcon from "@/assets/svg_icons/Edit_Icon";
import Location_Component from "@/components/Location_Component";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const TopTabs = () => {
    const pathname = usePathname()

    const PosTopMenu = [
        {
            title: "Inventory_k1",
            url: "/"
        },
        {
            title: "Inventory_k2",
            url: "products"
        },
        {
            title: "Inventory_k3",
            url: "inventory"
        },

    ];

    const {t} = useTranslation(translationConstant.INVENTORY)

    return (
        <nav className="flex items-center justify-center rounded-lg bg-gray-100 p-1 w-fit">
        <ul className="flex gap-2">
          {PosTopMenu.map((menuItem, index) => {
            const isActive =
              pathname === `/inventory/manage/${menuItem.url}` ||
              (pathname === "/inventory/manage" && menuItem.url === "/");
      
            return (
              <li key={index}>
                <Link
                  href={`/inventory/manage/${menuItem.url}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {/* <span className="text-xl">{menuItem.icon}</span> */}
                  <span className="text-sm font-medium">{t(menuItem.title)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
    );
}


export default TopTabs
