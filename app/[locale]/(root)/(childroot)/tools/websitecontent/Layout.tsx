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
      <div className="px-2 pb-4 pt-2">
        <h1 className="text-title2 text-label">{t("WebCont_k29")}</h1>
        <p className="mt-1 text-body text-label-2">{t("WebCont_k30")}</p>
      </div>
      
      <div className="block md:hidden p-2">
        <div className="w-full mb-4">
          <TopTabs />
        </div>
        <main className="min-h-[calc(83dvh)] h-full w-full">{children}</main>
      </div>
      
      <div className="hidden md:flex justify-center gap-5 p-2">
        <div className="space-y-5">
          <TopTabs />
        </div>
        <main className="w-full space-y-5">{children}</main>
      </div>
    </div>
  );
};

export default WebsiteContentLayout;