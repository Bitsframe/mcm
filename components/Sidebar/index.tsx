"use client";

import Image from "next/image";
import { useContext } from "react";
import { Darklogo } from "@/assets/images";
import { SidebarCollapseContext } from "@/context";

import { Clinic } from "./Clinic";
import { SidebarPanel } from "./SidebarPanel";

/**
 * The window's source-list column: translucent over whatever scrolls under it,
 * separated from the content by a hairline, with the clinic switcher pinned at
 * the bottom like an account row.
 */
export const SidebarSection = () => {
  const collapsed = useContext(SidebarCollapseContext);

  return (
    <div className="bg-vibrant flex h-full w-full flex-col border-r border-border">
      {/* The logo is a wordmark with no square form to shrink to; the rail
          leaves the space to the toolbar's sidebar toggle instead. */}
      <div className="flex h-16 shrink-0 items-center px-4">
        {!collapsed && (
          <Image src={Darklogo} alt="MyClinic MD" className="h-12 w-auto max-w-[200px] object-contain" priority />
        )}
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-1 ${collapsed ? "px-3.5" : ""}`}>
        <SidebarPanel />
      </div>

      <Clinic />
    </div>
  );
};
