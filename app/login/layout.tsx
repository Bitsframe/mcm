"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Logo } from "@/assets/images";
import Image from "next/image";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen flex ${resolvedTheme === "dark" ? "dark" : ""}`}>
      {/* Left Section (50%) - Container with Logo */}
      <div
        className={`w-1/2 p-3 ${
          resolvedTheme === "dark" ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <Image src={Logo} alt="Logo" className="w-40 opacity-90" />
      </div>

      {/* Right Section (50%) - Login Section with Toggle Button */}
      <div
        className={`w-1/2 relative ${
          resolvedTheme === "dark" ? "bg-gray-800" : "bg-gray-200"
        }`}
      >
        {/* Theme Toggle Button positioned at the top-right of the login section */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="absolute top-4 right-4 p-2 rounded-full bg-white text-black dark:bg-black dark:text-white hover:bg-gray-700 transition"
        >
          {resolvedTheme === "dark" ? "🌞" : "🌙"}
        </button>

        {/* Login Form taking full width of the right section */}
        <div className="h-full flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
