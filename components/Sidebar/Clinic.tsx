import { clinca_logo } from "@/assets/images";
import Image from "next/image";
import { useContext } from "react";
import ChangeLocationModal from "./ChangeLocationModal";
import { ChevronsUpDown } from "lucide-react";
import { SidebarCollapseContext } from "@/context";

/** Location switcher pinned to the sidebar's foot, styled as an account row. */
export const Clinic = () => {
  const collapsed = useContext(SidebarCollapseContext);

  if (collapsed) {
    return (
      <div className="flex shrink-0 justify-center border-t border-border py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-mac-sm">
          <Image src={clinca_logo} alt="Clinic" className="h-6 w-6 rounded object-contain" />
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-black/[0.05]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-mac-sm">
          <Image src={clinca_logo} alt="" className="h-5 w-5 rounded object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-caption text-label-3">Location</div>
          <ChangeLocationModal />
        </div>
        <ChevronsUpDown size={14} className="shrink-0 text-label-3" />
      </div>
    </div>
  );
};
