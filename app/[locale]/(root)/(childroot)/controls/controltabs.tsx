"use client";
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const TopTabs = () => {
  const pathname = usePathname();

  const WebsiteContentMenu = [
    {
      title: "Reporting Time",
      url: "/",
    },
    {
      title: "Email Templates",
      url: "emailtemplates",
    },
    {
      title: "Inventory Settings",
      url: "inventorysettings",
    },
  ];

  const { t } = useTranslation(translationConstant.WEBCONT);

  return (
    <nav className="w-48">
      <ul className="flex flex-col gap-1">
        {WebsiteContentMenu.map((menuItem, index) => {
          const isActive =
            pathname === `/controls/${menuItem.url}` ||
            (pathname === "/controls" && menuItem.url === "/");

          return (
            <li key={index}>
              <Link
                href={`/controls/${menuItem.url}`}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all
              ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
              >
                {/* <span>
                  <GoDotFill size={18} /> for icon
                </span> */}
                <span className="text-base font-medium">{t(menuItem.title)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TopTabs;