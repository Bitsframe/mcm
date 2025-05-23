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
    <div className="flex justify-center gap-5 mt-8 dark:bg-[#0E1725] " >
			<div className="space-y-5 ">
				<TopTabs />
			</div>
			<main
				// style={{ zIndex: 9999999}}
				className="min-h-[calc(83dvh)] w-full h-[100%] font-[500] text-[20px] space-y-5 rounded-md"
			>
				<main>{children}</main>
			</main>
		</div>
  );
}