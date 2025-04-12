"use client"
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from 'next/navigation'

const TopTabs = () => {
    const pathname = usePathname()

    const PosTopMenu = [
        {
            title: "Orders",
            url: "/"
        },
        {
            title: "Patients",
            url: "patients"
        },

    ];


    return (
        <nav className="mt-5">
    <div className="max-w-7xl mx-auto">
        <ul className="flex gap-1 w-fit p-1 rounded-lg  bg-[#f1f4f9]">
            {PosTopMenu.map((menuItem, index) => (
                <li key={index}>
                    <Link
                        href={`/pos/sales/${menuItem.url}`}
                        className={`inline-flex items-center px-2 py-1 text-sm rounded-lg font-medium ${pathname === `/pos/sales/${menuItem.url}` || (pathname === "/pos/sales" && menuItem.url === "/") 
                            ? 'bg-[#0066ff] text-gray-900' 
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        {menuItem.title}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
</nav>
    );
}


export default TopTabs
