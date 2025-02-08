"use client";
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from "next/navigation";

const TopTabs = () => {
  const pathname = usePathname();

  const PosTopMenu = [
    {
      title: "Orders",
      url: "/",
    },
    {
      title: "Patients",
      url: "patients",
    },
  ];

  return (
    <nav className="flex items-center justify-between">
      <ul className="flex gap-6 sm:flex-col md:flex-row lg:flex-row">
        {PosTopMenu.map((menuItem, index) => (
          <li className="text-text_primary_color me-4" key={index}>
            <Link
              className={`flex gap-2 items-center ${
                pathname === `/pos/sales/${menuItem.url}` ||
                (pathname === "/pos/sales" && menuItem.url === "/")
                  ? "text-text_primary_color underline underline-offset-8"
                  : "text-gray-500"
              }`}
              href={`/pos/sales/${menuItem.url}`}
            >
              <span> {<GoDotFill size={15} />}</span>
              <span className="text-lg font-bold"> {menuItem.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TopTabs;
