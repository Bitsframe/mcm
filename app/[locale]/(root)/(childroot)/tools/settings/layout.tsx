// app/settings/layout.tsx
'use client'

import { TabContext } from "@/context";
import { useContext, useEffect } from "react";
import TopTabs from "./settingstabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k22");
  }, []);

  return (
    <div className="dark:bg-[#0E1725]">
      <div className="p-1 sm:p-3">
        <h1 className="text-xl font-bold dark:text-white">Settings</h1>
        <h1 className="mt-1 mb-2 text-sm text-gray-500 dark:text-gray-400">
          Tools / Settings
        </h1>
      </div>

      <div className="block sm:hidden mb-4">
        <TopTabs />
      </div>
      <div className="flex justify-center gap-5 px-2 dark:bg-[#0E1725]">
        <div className="hidden sm:block space-y-5">
          <TopTabs />
        </div>
        <main
          className=" w-full font-[500] text-[20px] space-y-5 rounded-md"
        >
          <main>{children}</main>
        </main>
      </div>
    </div>
  );
}