"use client";
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { Home, Info, Star, Globe, CircleHelp, BriefcaseBusiness } from "lucide-react";


const TopTabs = () => {
  const pathname = usePathname();

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
  ];

  const { t } = useTranslation(translationConstant.WEBCONT);

  return (
    <nav className="w-48">
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
  );
};

export default TopTabs;
