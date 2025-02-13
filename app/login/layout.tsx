"use client";

import { useEffect, useState } from "react";
import { Darklogo, Lightlogo } from "@/assets/images";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen flex ${resolvedTheme === "dark" ? "dark" : ""}`}
    >
      <div
        className={`w-1/2 p-3 ${
          resolvedTheme === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        {resolvedTheme === "dark" ? (
          <Image src={Lightlogo} alt="Logo" className="w-48 opacity-90" />
        ) : (
          <Image src={Darklogo} alt="Logo" className="w-48 opacity-90" />
        )}
      </div>

      <div
        className={`w-1/2 relative ${
          resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-200"
        }`}
      >
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="absolute top-4 right-4 p-2 rounded-full bg-white text-black dark:bg-black dark:text-white hover:bg-gray-700 transition"
        >
          {resolvedTheme === "dark" ? <Moon /> : <Sun />}
        </button>

        <div className="h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
