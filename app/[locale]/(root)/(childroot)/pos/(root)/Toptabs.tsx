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
        <ul className="flex gap-1 w-fit p-1 rounded-lg bg-[#f1f4f9]">
          {PosTopMenu.map((menuItem, index) => {
            const isActive =
              pathname === `/pos/sales/${menuItem.url}` ||
              (pathname === "/pos/sales" && menuItem.url === "/");

            const Icon = menuItem.icon;

            return (
              <li key={index}>
                <Link
                  href={`/pos/sales/${menuItem.url}`}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-[#0066ff] text-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-gray-500"
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
