"use client"
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from 'next/navigation'
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const TopTabs = () => {
    const pathname = usePathname()

    const WebsiteContentMenu = [
        {
            title: "WebCont_k1",
            url: "/"
        },
        {
            title: "WebCont_k2",
            url: "about"
        },
        {
            title: "WebCont_k3",
            url: "testimonials"
        },
        {
            title: "WebCont_k4",
            url: "career"
        },
        // {
        //     title: "Blogs",
        //     url: "blogs"
        // },
        {
            title: "WebCont_k5",
            url: "locations"
        },
        // {
        //     title: "Specials",
        //     url: "specials"
        // },
        {
            title: "WebCont_k6",
            url: "faqs"
        }
    ];

    const {t} = useTranslation(translationConstant.WEBCONT)

    return (
        <nav className="" >
            <ul className="flex sm:flex-col md:flex-row lg:flex-row justify-around" >
                {WebsiteContentMenu.map((menuItem, index) => (
                    <li className="text-text_primary_color" key={index}>
                        <Link
                            className={`flex gap-2 items-center ${pathname === `/tools/websitecontent/${menuItem.url}` || (pathname === "/tools/websitecontent" && menuItem.url === "/") ? 'text-text_primary_color underline underline-offset-8' : 'text-gray-500'}`}
                            href={`/tools/websitecontent/${menuItem.url}`}>
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
