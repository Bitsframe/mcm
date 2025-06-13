import React, { ReactNode } from "react";
import TopTabs from "./Toptabs";
import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

interface WebsiteContentLayoutProps {
  children: ReactNode;
}

const WebsiteContentLayout: React.FC<WebsiteContentLayoutProps> = ({
  children,
}) => {
  const { t } = useTranslation(translationConstant.WEBCONT);
  return (
    <div>
      <Toaster richColors position="top-right" />
      <div className="dark:bg-[#0e1725] pl-2">
        <h1 className="text-xl font-bold">{t("WebCont_k30")}</h1>
        <h1 className="mt-1 pb-5 text-sm text-gray-500 dark:text-gray-400">
          {t("WebCont_k29")}
        </h1>
      </div>
      
      <div className="block md:hidden dark:bg-[#0E1725] p-2">
        <div className="w-full mb-4">
          <TopTabs />
        </div>
        <main className="min-h-[calc(83dvh)] w-full h-[100%] font-[500] text-[20px] rounded-md">
          {children}
        </main>
      </div>
      
      <div className="hidden md:flex justify-center gap-5 dark:bg-[#0E1725] p-2">
        <div className="space-y-5">
          <TopTabs />
        </div>
        <main className=" w-full font-[500] text-[20px] space-y-5 rounded-md">
          {children}
        </main>
      </div>
    </div>
  );
};

export default WebsiteContentLayout;