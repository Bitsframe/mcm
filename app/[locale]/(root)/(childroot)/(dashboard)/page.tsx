"use client";

import { useEffect, useState } from "react";
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
 *
 * The location filter lives here rather than in either half, because one control
 * governs both: the KPI tiles and the panels below them always answer for the
 * same set of clinics. "" means every location the signed-in user is granted,
 * which is what the page opens on. It is deliberately NOT the sidebar's location
 * — that one follows the user around the app, while this is a view of the
 * company that happens to be narrowable.
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

  const [locationId, setLocationId] = useState("");

  return (
    <div className="h-full w-full overflow-y-auto p-1">
      <KpiCards locationId={locationId} onLocationChange={setLocationId} />
      <DashboardPanels locationId={locationId} />
    </div>
  );
};

export default Page;
