"use client"
import Link from "next/link";
import { GoDotFill } from "react-icons/go";
import { usePathname } from 'next/navigation'

const TopTabs = () => {
    const pathname = usePathname()

    const WebsiteContentMenu = [
        {
            title: "Home",
            url: "/"
        },
        {
            title: "About",
            url: "about"
        },
        {
            title: "Testimonials",
            url: "testimonials"
        },
        {
            title: "Career",
            url: "career"
        },
        // {
        //     title: "Blogs",
        //     url: "blogs"
        // },
        {
            title: "Locations",
            url: "locations"
        },
        // {
        //     title: "Specials",
        //     url: "specials"
        // },
        {
            title: "FAQs",
            url: "faqs"
        }
    ];


    return (
        <nav className="" >
            <ul className="flex sm:flex-col md:flex-row lg:flex-row justify-around" >
                {WebsiteContentMenu.map((menuItem, index) => (
                    <li className="text-text_primary_color" key={index}>
                        <Link
                            className={`flex gap-2 items-center ${pathname === `/tools/websitecontent/${menuItem.url}` || (pathname === "/tools/websitecontent" && menuItem.url === "/") ? 'text-text_primary_color underline underline-offset-8' : 'text-gray-500'}`}
                            href={`/tools/websitecontent/${menuItem.url}`}>
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
