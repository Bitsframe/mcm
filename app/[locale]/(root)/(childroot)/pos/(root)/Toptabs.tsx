// TopTabs.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBasket, UsersIcon } from "lucide-react";

const TopTabs = () => {
  const pathname = usePathname();

  const PosTopMenu = [
    {
      title: "Orders",
      url: "/",
      icon: ShoppingBasket,
    },
    {
      title: "Patients",
      url: "patients",
      icon: UsersIcon,
    },
  ];

  return (
    <nav className="mt-5">
      <div className="max-w-7xl mx-auto">
        <ul className="flex gap-1 w-fit p-1 rounded-xl bg-gray-100 dark:bg-[#080E16]">
          {PosTopMenu.map((menuItem, index) => {
            const isActive =
              pathname === `/pos/sales/${menuItem.url}` ||
              (pathname === "/pos/sales" && menuItem.url === "/");

            const Icon = menuItem.icon;

            return (
              <li key={index}>
                <Link
                  href={`/pos/sales/${menuItem.url}`}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                  {menuItem.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default TopTabs;
