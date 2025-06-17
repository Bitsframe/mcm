"use client";
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { Home, Info, Star, Globe, CircleHelp, BriefcaseBusiness } from "lucide-react";
import { useState, useRef, useEffect } from "react";


const TopTabs = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
      title: "WebCont_k1",
      url: "/",
      icon: <Home/>
    },
    {
      title: "WebCont_k2",
      url: "about",
      icon: <Info /> 
    },
    {
      title: "WebCont_k3",
      url: "testimonials",
      icon: <Star />
    },
    {
      title: "WebCont_k4",
      url: "career",
      icon: <BriefcaseBusiness />
    },
    // {
    //     title: "Blogs",
    //     url: "blogs"
    // },
    {
      title: "WebCont_k5",
      url: "locations",
      icon: <Globe />
    },
    // {
    //     title: "Specials",
    //     url: "specials"
    // },
    {
      title: "WebCont_k6",
      url: "faqs",
      icon: <CircleHelp />
    },
    {
      title: "Services",
      url: "services",
      icon: <BriefcaseBusiness />
    }
  ];

  const { t } = useTranslation(translationConstant.WEBCONT);

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="w-48 hidden sm:block">
        <ul className="flex flex-col gap-1">
          {WebsiteContentMenu.map((menuItem, index) => {
            const isActive =
              pathname === `/tools/websitecontent/${menuItem.url}` ||
              (pathname === "/tools/websitecontent" && menuItem.url === "/");

            return (
              <li key={index}>
                <Link
                  href={`/tools/websitecontent/${menuItem.url}`}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all
    ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
    }`}
                >
                  <span className="text-lg">{menuItem.icon}</span>
                  <span className="text-base font-medium">
                    {t(menuItem.title)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile dropdown menu */}
      <div className="block sm:hidden relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg w-full text-left border border-gray-300 dark:border-gray-700"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="font-medium">Menu</span>
          <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {menuOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <ul className="flex flex-col gap-1 py-2">
              {WebsiteContentMenu.map((menuItem, index) => {
                const isActive =
                  pathname === `/tools/websitecontent/${menuItem.url}` ||
                  (pathname === "/tools/websitecontent" && menuItem.url === "/");
                return (
                  <li key={index}>
                    <Link
                      href={`/tools/websitecontent/${menuItem.url}`}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all w-full
                        ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="text-lg">{menuItem.icon}</span>
                      <span className="text-base font-medium">
                        {t(menuItem.title)}
                      </span>
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
