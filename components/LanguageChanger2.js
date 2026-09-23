"use client";

import { useRouter, usePathname } from "@/navigation";
import { useState } from "react";
import Image from "next/image";
import { Eng, Esp } from "@/assets/images";
import { FaChevronDown } from "react-icons/fa";

const languages = [
  { code: "en", label: "English", flag: Eng.src },
  { code: "es", label: "Español", flag: Esp.src },
];

export default function LanguageChanger({ locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLang, setSelectedLang] = useState(
    languages.find((lang) => lang.code === locale) || languages[0]
  );

  const handleChange = (lang) => {
    setSelectedLang(lang);
    router.push(pathname, { locale: lang.code });
  };

  return (
    <div className="relative w-44 z-50">
      {/* Language Options - Visible directly */}
      <div className="flex flex-col gap-2 bg-white overflow-hidden">
        {languages.map((lang) => (
          <div
            key={lang.code}
            onClick={() => handleChange(lang)}
            className={`flex items-center gap-2 p-4 cursor-pointer ${
              selectedLang.code === lang.code
                ? "bg-gray-100"
                : "hover:bg-gray-100"
            }`}
          >
            <Image src={lang.flag} alt={lang.label} width={20} height={15} className="h-[15px] w-[20px] rounded-[2px] object-cover" />
            <span className="">{lang.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}