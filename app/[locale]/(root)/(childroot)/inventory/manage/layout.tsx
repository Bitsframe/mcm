import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface PosLayoutProps {
  children: ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  return (
    <div className="">
      <div className="space-y-5 px-4 pt-4 ">
        <h1 className="text-2xl font-bold">Inventory</h1>
        
      </div>
      <main
        style={{ zIndex: 9999999 }}
        className=" w-full bg-white dark:bg-[#0E1725] font-[500] text-[20px] space-y-5 p-2 rounded-md"
      >
        <main className="">{children}</main>
      </main>
    </div>
  );
};

export default PosLayout;
