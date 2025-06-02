// app/settings/layout.tsx
'use client'

import { TabContext } from "@/context";
import { useContext, useEffect } from "react";
import TopTabs from "./controltabs";

export default function ControlsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k22");
  }, []);

  return (
    <div>
      {/* Heading at top */}
      <div className="py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Controls</h1>
        <h1 className="mt-1 mb-2 text-sm text-gray-500 dark:text-gray-400">
          Controls
        </h1>
      </div>

      {/* Mobile menu above content */}
      <div className="block sm:hidden mb-4">
        <TopTabs />
      </div>

      {/* Main content area with sidebar */}
      <div className="flex gap-5 dark:bg-[#0E1725]">
        {/* Desktop menu on the side */}
        <div className="hidden sm:block space-y-5">
          <TopTabs />
        </div>
        <main
          className="min-h-[calc(83dvh)] w-full h-[100%] font-[500] text-[20px] space-y-5 rounded-md"
        >
          <main>{children}</main>
        </main>
      </div>
    </div>
  );
}