"use client";
import WebsiteContentLayout from "../Layout";
import SpecialsPage from "@/app/[locale]/(root)/(childroot)/tools/specials/page";

/**
 * Specials is managed from the Website Content tabs. The manager itself lives
 * at tools/specials (still routable); this route just frames it in the tabs.
 */
export default function WebsiteSpecials() {
  return (
    <WebsiteContentLayout>
      <SpecialsPage />
    </WebsiteContentLayout>
  );
}
