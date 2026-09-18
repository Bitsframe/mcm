"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import KpiCards from "@/components/Dashboard/KpiCards";
import DashboardPanels from "@/components/Dashboard/DashboardPanels";

/**
 * Dashboard.
 *
 * This used to render cronitorSampleData — a hardcoded website-uptime sample,
 * down to an SSL certificate permanently reported as expired. It is now just the
 * clinic's own figures, which is all this page was ever asked for.
 */
const Page = () => {
  const params = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    const locale = params.locale as string;
    if (locale && i18n && i18n.language !== locale && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(locale);
    }
  }, [params.locale, i18n]);

  return (
    <div className="h-full w-full overflow-y-auto p-1">
      <KpiCards />
      <DashboardPanels />
    </div>
  );
};

export default Page;
