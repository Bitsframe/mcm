"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

const ThemeToggleButton = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="flex items-center justify-between bg-white dark:bg-[#0e1725] rounded-full px-1 py-7 w-24 h-10 relative">
      {/* Light mode button */}
      <button
        onClick={() => setTheme("light")}
        aria-label="Switch to light mode"
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ease-in-out absolute ${
          !isDark
            ? "bg-blue-500 text-white shadow-md left-1"
            : "bg-transparent text-gray-500 hover:text-gray-700 left-1"
        }`}
      >
        <Sun size={25} strokeWidth={2} />
      </button>

      {/* Dark mode button */}
      <button
        onClick={() => setTheme("dark")}
        aria-label="Switch to dark mode"
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ease-in-out absolute ${
          isDark
            ? "bg-blue-500 text-white shadow-md right-1"
            : "bg-transparent text-gray-500 hover:text-gray-700 right-1"
        }`}
      >
        <Moon size={25} strokeWidth={2} />
      </button>
    </div>
  )
}

export default ThemeToggleButton