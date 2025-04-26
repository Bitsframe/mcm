import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface PosLayoutProps {
  children: ReactNode;
}

const PosLayout: React.FC<PosLayoutProps> = ({ children }) => {
  return (
    <div>
      <div className="space-y-3 p-2">
        <div>
          <h1 className="text-xl font-bold">Sales</h1>
          <p className="mt-0.5 mb-1 text-gray-500 text-sm">POS / Sales</p>
        </div>
        <div className="h-px w-full bg-gray-300"></div>
        <TopTabs />
      </div>
      <main
        style={{ zIndex: 9999999 }}
        className="h-[80dvh] w-full bg-white dark:bg-[#0e1725] font-medium text-base space-y-3 p-1 rounded"
      >
        {children}
      </main>
    </div>
  );
};

export default PosLayout;