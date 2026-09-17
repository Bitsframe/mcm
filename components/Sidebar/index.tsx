"use client";

import Image from "next/image";
import { useContext } from "react";
import { useTheme } from "next-themes";
import { Darklogo, Lightlogo } from "@/assets/images";
import { SidebarCollapseContext } from "@/context";

import { Clinic } from "./Clinic";
import { SidebarPanel } from "./SidebarPanel";

export const SidebarSection = () => {
  const { theme } = useTheme();
  const collapsed = useContext(SidebarCollapseContext);

  return (
    <div
      className={`w-full h-full flex flex-col gap-5 items-start py-5 bg-[#F1F4F9] dark:bg-[#080E16] ${
        collapsed ? "pr-0 px-2" : "pr-5"
      }`}
    >
      {/* The logo is a wordmark, so it has no square form to shrink to; the rail
          gives the space to the collapse handle instead. */}
      {!collapsed && (
        <div className="flex justify-center w-full overflow-hidden">
          <Image
            src={theme === "dark" ? Lightlogo : Darklogo}
            alt="logo"
            className="w-[155px] aspect-auto object-contain"
          />
        </div>
      )}
      {collapsed && <div className="h-[34px] w-full" aria-hidden />}

      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden text-[#79808B] dark:text-gray-300">
        <SidebarPanel />
      </div>

      <Clinic />
    </div>
  );
};
