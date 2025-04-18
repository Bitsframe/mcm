import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface PosLayoutProps {
  children: ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  return (
    <div className="">
      <div className="space-y-5 p-3 ">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <h1 className="mt-1 mb-2 text-gray-500">POS  /  Sales</h1>
        </div>
        <div className="h-[1px] w-full bg-gray-400"></div>
        <TopTabs />
      </div>
      <main
        style={{ zIndex: 9999999 }}
        className="h-[calc(80dvh)] w-full bg-white dark:bg-[#0e1725]   font-[500] text-[20px] space-y-5 p-2 rounded-md"
      >
        <main className="">{children}</main>
      </main>
    </div>
  );
};

export default PosLayout;
