"use client";
import { useRouter, usePathname } from "@/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Eng, Esp } from "@/assets/images";
import { Check, ChevronDown } from "lucide-react";

const languages = [
  { code: "en", label: "English", flag: Eng.src },
  { code: "es", label: "Español", flag: Esp.src },
];

/** Toolbar language pop-up button. */
export default function LanguageChanger({ locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLang, setSelectedLang] = useState(
    languages.find((lang) => lang.code === locale) || languages[0]
  );
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const handleChange = (lang) => {
    setSelectedLang(lang);
    setIsOpen(false);
    router.push(pathname, { locale: lang.code });
  };

  return (
    <div ref={rootRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-8 items-center gap-2 rounded-full border border-border bg-white pl-2.5 pr-2 text-body text-label shadow-mac-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Image src={selectedLang.flag} alt="" width={18} height={13} className="h-[13px] w-[18px] rounded-[2px] object-cover" />
        <span className="hidden sm:inline">{selectedLang.label}</span>
        <ChevronDown size={13} className={`text-label-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="bg-vibrant-white absolute right-0 top-full mt-2 w-40 rounded-lg border border-border p-1 shadow-mac-lg"
        >
          {languages.map((lang) => {
            const selected = lang.code === selectedLang.code;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={selected}
                onClick={() => handleChange(lang)}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-body text-label hover:bg-brand-600 hover:text-white"
              >
                <Image src={lang.flag} alt="" width={18} height={13} className="h-[13px] w-[18px] rounded-[2px] object-cover" />
                <span className="flex-1">{lang.label}</span>
                {selected && <Check size={14} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
