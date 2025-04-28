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
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (lang) => {
    setSelectedLang(lang);
    setIsOpen(false);
    router.push(pathname, { locale: lang.code });
  };

  return (
    <div className="relative w-44 z-50">
      {/* Selected Language */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between  bg-white dark:bg-[#0e1725] dark:text-white p-4 border border-gray-300 dark:border-blue-950 rounded-full w-full cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Image src={selectedLang.flag} alt={selectedLang.label} width={20} height={15} />
          <span>{selectedLang.label}</span>
        </div>
        <span><FaChevronDown/></span>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-full bg-white dark:bg-[#0e1725] border border-gray-300 dark:border-blue-950 rounded-lg shadow-md z-10">
          {languages.map((lang) => (
            <div
              key={lang.code}
              onClick={() => handleChange(lang)}
              className="flex items-center gap-2 p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
            >
              <Image src={lang.flag} alt={lang.label} width={20} height={15} />
              <span>{lang.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}