"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const TopTabs = () => {
  const pathname = usePathname();

  const WebsiteContentMenu = [
    {
      title: "Profile",
      url: "/",
    },
    {
      title: "Security",
      url: "security",
    },
  ];

  const { t } = useTranslation(translationConstant.WEBCONT);

  return (
    <>
      <nav className="w-48 hidden sm:block">
        <ul className="flex flex-col gap-1">
          {WebsiteContentMenu.map((menuItem, index) => {
            const isActive =
              pathname === `/tools/settings/${menuItem.url}` ||
              (pathname === "/tools/settings" && menuItem.url === "/");

            return (
              <li key={index}>
                <Link
                  href={`/tools/settings/${menuItem.url}`}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all
                    ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                >
                  <span className="text-base font-medium">
                    {t(menuItem.title)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="w-full sm:hidden mb-4">
        <ul className="flex gap-4 px-2 overflow-x-auto">
          {WebsiteContentMenu.map((menuItem, index) => {
            const isActive =
              pathname === `/tools/settings/${menuItem.url}` ||
              (pathname === "/tools/settings" && menuItem.url === "/");

            return (
              <li key={index}>
                <Link
                  href={`/tools/settings/${menuItem.url}`}
                  className={`inline-block px-4 py-2 rounded-t-lg transition-all font-medium text-sm
                    ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                >
                  {t(menuItem.title)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default TopTabs;
