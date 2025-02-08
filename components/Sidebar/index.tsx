"use client";

import Image from "next/image";
import { Logo } from "@/assets/images";
import { SidebarPanel } from "./SidebarPanel";
import { SidebarProvider } from "../ui/sidebar";
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Clinic } from "./Clinic";


export const SidebarSection = () => {
  return (

<SidebarProvider>
    <Sidebar collapsible="icon">
    <div className="w-full h-full flex flex-col gap-5 items-center py-5 bg-white">
      <SidebarHeader>
      <div className="flex justify-center w-full">
        <Image
          src={Logo}
          alt={"logo"}
          className="w-[155px] aspect-auto object-contain"
        />
      </div>
      </SidebarHeader>
      <SidebarContent>
      <div className="flex-1 overflow-y-auto">
      <SidebarPanel />
      </div>
      </SidebarContent>
      <SidebarFooter>
      <Clinic/>
      </SidebarFooter>
      
    </div>
    </Sidebar>
    
    </SidebarProvider>
  );
};


