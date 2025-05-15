import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";

interface WebsiteContentLayoutProps {
  children: ReactNode;
}

const WebsiteContentLayout: React.FC<WebsiteContentLayoutProps> = ({
  children,
}) => {
  return (
    <div>
      <div className="dark:bg-[#0e1725] pl-2">
        <h1 className="text-xl font-bold">Website Content</h1>
        <h1 className="mt-1 pb-5 text-sm text-gray-500 dark:text-gray-400">
          Tools / Website Content
        </h1>
      </div>
      <div className="flex justify-center gap-5 dark:bg-[#0E1725] ">
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
    </div>
  );
};

export default WebsiteContentLayout;
