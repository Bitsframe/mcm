"use client";

import { useRouter, usePathname } from "@/navigation";

export default function LanguageChanger({ locale }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e) => {
    router.push(pathname, { locale: e.target.value });
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={handleChange}
        className="cursor-pointer appearance-none bg-transparent flex justify-between gap-3 items-center"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
}
