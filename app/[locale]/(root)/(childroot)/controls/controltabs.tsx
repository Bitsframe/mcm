"use client";
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { useState, useRef, useEffect } from "react";

const TopTabs = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const WebsiteContentMenu = [
    {
      title: "CT_k29",
      url: "/",
    },
    {
      title: "CT_k8",
      url: "emailtemplates",
    },
    // {
    //   title: "Inventory Settings",
    //   url: "inventorysettings",
    // },
  ];

  const { t } = useTranslation(translationConstant.CONTROLS);

  return (
    <>
      <nav className="w-48 hidden sm:block">
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
                  ? "bg-brand-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
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

      <div className="block sm:hidden relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg w-full text-left border border-gray-300"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="font-medium">Menu</span>
          <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {menuOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200">
            <ul className="flex flex-col gap-1 py-2">
              {WebsiteContentMenu.map((menuItem, index) => {
                const isActive =
                  pathname === `/controls/${menuItem.url}` ||
                  (pathname === "/controls" && menuItem.url === "/");
                return (
                  <li key={index}>
                    <Link
                      href={`/controls/${menuItem.url}`}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all w-full
                        ${
                          isActive
                            ? "bg-brand-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="text-base font-medium">{t(menuItem.title)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};

export default TopTabs;