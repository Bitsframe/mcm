"use client"
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from 'next/navigation'
import EditIcon from "@/assets/svg_icons/Edit_Icon";
import Location_Component from "@/components/Location_Component";

const TopTabs = () => {
    const pathname = usePathname()

    const PosTopMenu = [
        {
            title: "Categories",
            url: "/"
        },
        {
            title: "Products",
            url: "products"
        },
        {
            title: "Inventory",
            url: "inventory"
        },

    ];


    return (
        <nav className="flex items-center justify-between" >
            <ul className="flex gap-6 sm:flex-col md:flex-row lg:flex-row" >
                {PosTopMenu.map((menuItem, index) => (
                    <li className="text-text_primary_color me-4" key={index}>
                        <Link
                            className={`flex gap-2 items-center ${pathname === `/inventory/manage/${menuItem.url}` || (pathname === "/inventory/manage" && menuItem.url === "/") ? 'text-text_primary_color underline underline-offset-8' : 'text-gray-500'}`}
                            href={`/inventory/manage/${menuItem.url}`}>
                            <span> {<GoDotFill size={15} />}</span>
                            <span className="text-lg font-bold" > {menuItem.title}</span>
                        </Link>

                    </li>
                ))}


            </ul>
        </nav>
    );
}


export default TopTabs
