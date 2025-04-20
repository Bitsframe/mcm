"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { Darklogo, Lightlogo } from "@/assets/images";

import { Clinic } from "./Clinic";
import { SidebarPanel } from "./SidebarPanel";

export const SidebarSection = () => {
  const { theme } = useTheme();

  return (
    <div className="w-full h-full flex flex-col gap-5 items-center py-5 pr-5 bg-[#F1F4F9] dark:bg-[#080E16]">
      <div className="flex justify-center w-full">
        <Image
          src={theme === "dark" ? Lightlogo : Darklogo }
          alt="logo"
          className="w-[155px] aspect-auto object-contain"
        />
      </div>

      <div className="flex-1 overflow-y-auto text-[#79808B] dark:text-gray-300">
        <SidebarPanel />
      </div>

      <Clinic />
    </div>
  );
};
