import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface PosLayoutProps {
  children: ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  return (
    <div className="">
      <div className="space-y-5 px-4 pt-4">
        <h1 className="text-2xl font-bold">Warehouse</h1>
        <div className="h-[1px] w-full bg-gray-400 my-2"></div> 
        <TopTabs />
      </div>
      <main
        style={{ zIndex: 9999999 }}
        className=" w-full bg-white dark:bg-[#0E1725] font-[500] text-[20px] space-y-5 px-2 pt-2 rounded-md"
      >
        <main className="">{children}</main>
      </main>
    </div>
  );
};

export default PosLayout;
