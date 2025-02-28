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
        <nav className="flex items-center justify-between" >
            <ul className="flex gap-6 sm:flex-col md:flex-row lg:flex-row" >
                {PosTopMenu.map((menuItem, index) => (
                    <li className="text-text_primary_color me-4" key={index}>
                        <Link
                            className={`flex gap-2 items-center ${pathname === `/inventory/manage/${menuItem.url}` || (pathname === "/inventory/manage" && menuItem.url === "/") ? 'text-text_primary_color underline underline-offset-8' : 'text-gray-500'}`}
                            href={`/inventory/manage/${menuItem.url}`}>
                            <span> {<GoDotFill size={15} />}</span>
                            <span className="text-lg font-bold" > {t(menuItem.title)}</span>
                        </Link>

                    </li>
                ))}


            </ul>
        </nav>
    );
}


export default TopTabs
