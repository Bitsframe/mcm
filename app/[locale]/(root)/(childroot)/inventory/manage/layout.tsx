import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface PosLayoutProps {
  children: ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  return (
    <div className="">
      <div className="space-y-5 p-4 ">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="h-[1px] w-full bg-gray-400 my-2"></div> 
        <TopTabs />
      </div>
      <main
        style={{ zIndex: 9999999 }}
        className="min-h-[calc(83dvh)] w-full h-[100%] bg-white dark:bg-[#0E1725] font-[500] text-[20px] space-y-5 p-2 rounded-md"
      >
        <main className="">{children}</main>
      </main>
    </div>
  );
};

export default PosLayout;
