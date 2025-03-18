"use client";
import { memo, useEffect, useState } from "react";
import moment from "moment";
import { Spinner } from "flowbite-react";
import { cronitorSampleData, render_arr } from "@/data";
import {
  CronitorRequest,
  DNS,
  Monitor,
  SSL,
} from "@/types/dashboard.interface";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { translationConstant } from "@/utils/translationConstants";

// @ts-ignore
const InfoCard = memo(
  ({ label, value, type = "text", icon }: { 
    label: string; 
    value: any; 
    type?: "text" | "image"; 
    icon?: string; 
  }) => {
    const { t } = useTranslation();
    return (
      <div className="w-full h-full bg-white rounded-[20px] p-4 flex flex-col">
        {/* Top Section - Icon + Label */}
        <div className="mb-2">
          {icon && (
            <div className="flex justify-start mb-2"> {/* Left-align icon */}
              <img 
                src={icon} 
                alt="icon" 
                className="w-8 h-8 object-contain" 
              />
            </div>
          )}
          <h1 className="text-lg font-bold text-left">{t(label)}</h1> {/* Label left */}
        </div>

        {/* Bottom Section - Value/Image */}
        <div className="mt-auto">
          {type === "image" ? (
            <div className="flex justify-start"> {/* Image ko left-align */}
              <img 
                src={value} 
                alt={label} 
                className="w-28 h-4" 
              />
            </div>
          ) : (
            <div className="text-left"> {/* Text left */}
              <p className="break-words">{value}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

InfoCard.displayName = "InfoCard";

const DataField = memo(
  ({ label, value }: { label: string; value: React.ReactNode }) => (
    <dl className="bg-white h-[77px] p-2 rounded-[10px] flex flex-col justify-end">
  <dt className="font-bold text-sm md:text-base">{label}</dt>
  <dd className="break-words">{value}</dd>
</dl>
  )
);

DataField.displayName = "DataField";

const SSLSection = memo(({ ssl }: { ssl: SSL }) => {
  const { t } = useTranslation();

  const issuedAt = moment(ssl.issued_at);
  const expiresAt = moment(ssl.expires_at);
  const now = moment();

  const totalDuration = expiresAt.diff(issuedAt);
  const elapsedDuration = now.diff(issuedAt);

  const progress = Math.min(
    Math.max((elapsedDuration / totalDuration) * 100, 0),
    100
  );

  const daysLeft = expiresAt.diff(now, "days");

  return (
    <div className="bg-[#F1F4F9] p-4 rounded-md">
      <h1 className="mb-3 text-xl md:text-2xl">{t("SSL Certificate")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataField label={t("Issued to")} value={ssl.issued_to} />
        <DataField label={t("Issued By")} value={ssl.issued_by} />

        <DataField
          label={t("Issued at")}
          value={issuedAt.format("DD/MM/YYYY, h:mm A")}
        />
        <DataField
          label={t("Expires at")}
          value={expiresAt.format("DD/MM/YYYY, h:mm A")}
        />
      </div>

      <div className="mt-4">
        <div className="relative w-full h-2 bg-gray-300 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right mt-1 text-sm text-gray-600">
          {daysLeft > 0
            ? `${daysLeft} ${t("days remaining")}`
            : t("Certificate expired")}
        </div>
      </div>
    </div>
  );
});

SSLSection.displayName = "SSLSection";

const DNSSection = memo(({ dns }: { dns: DNS }) => {
  const { t } = useTranslation(translationConstant.DASHBOARD);

  return (
    <div className="bg-[#F1F4F9] p-4 rounded-md">
      <h1 className="mb-3 text-xl md:text-2xl">{t("Dashboard_k21")}</h1>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pehli Row - 2 Columns */}
        <DataField label={t("Dashboard_k19")} value={dns.name} />
        <DataField
          label={t("Dashboard_k8")}
          value={moment(dns.expires_at).format("DD/MM/YYYY, h:mm A")}
        />

        {/* Doosri Row - 2 Columns */}
        <DataField label={t("Dashboard_k9")} value={dns.registrar} />
        <DataField
          label={t("Dashboard_k10")}
          value={
            <div className="space-y-2">
              {dns.name_servers.map((name, ind) => (
                <p key={ind}>{name}</p>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
});

DNSSection.displayName = "DNSSection";

const MonitorDetails = memo(
  ({
    request,
    schedule,
    platform,
  }: {
    request: CronitorRequest;
    schedule: string;
    platform: string;
  }) => {
    const params = useParams();
    const { t, i18n } = useTranslation();

    // Language change effect (same)
    useEffect(() => {
      const locale = params.locale as string;
      if (locale && i18n.language !== locale) {
        i18n.changeLanguage(locale);
      }
    }, [params.locale, i18n]);

    return (
      <div className="col-span-1 md:col-span-2 bg-[#F1F4F9] rounded-lg p-4">
        <h1 className="mb-3 text-xl md:text-2xl">{t("Dashboard_k11")}</h1>

        <div className="space-y-6">
          {/* 1. Request URL (Full Width) */}
          <DataField
            label={t("Dashboard_k12")}
            value={
              <div className="flex items-center">
                <span className="rounded-md bg-slate-700 px-3 py-1 text-white text-xs">
                  {t("Dashboard_k4")}
                </span>
                <span className="ml-2 break-words">{request.url}</span>
              </div>
            }
          />

          {/* 2. Interval + Protocol + Headers (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataField label={t("Dashboard_k13")} value={schedule} />{" "}
            {/* Interval */}
            <DataField label={t("Dashboard_k14")} value={platform} />{" "}
            {/* Protocol */}
            <DataField
              label={t("Dashboard_k16")}
              value={Object.keys(request.headers).length || "none"}
            />
          </div>

          {/* 3. Timeout + Locations (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataField
              label={t("Dashboard_k15")}
              value={`${request.timeout_seconds} seconds`}
            />
            <DataField
              label={t("Dashboard_k17")}
              value={
                <div className="flex flex-wrap gap-1">
                  {request.regions?.map((region, index) => (
                    <span
                      key={index}
                      className="rounded-md bg-slate-700 px-[6px] py-1 text-white text-[10px]"
                    >
                      {region} {/* Locations */}
                    </span>
                  ))}
                </div>
              }
            />
          </div>
        </div>
      </div>
    );
  }
);

MonitorDetails.displayName = "MonitorDetails";

const RenderData = memo(({ data }: { data: Monitor }) => {
  const {
    attributes: {
      site: { ssl, dns },
    },
    request,
    platform,
    schedule,
  } = data;

  return (
    <div className="text-slate-700 p-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="col-span-1 md:col-span-3 p-4 rounded-lg bg-[#F1F4F9]">
            <h2 className="mb-3 text-xl md:text-2xl">Quick Stats</h2>

            <div className="grid grid-cols-2 gap-4">
              {render_arr.map(
                ({ icon, label, key, type, render_value }, ind) => (
                  <InfoCard
                    icon={icon}
                    key={ind}
                    label={label}
                    value={
                      render_value ? render_value(data) : (data as any)[key]
                    }
                    type={type}
                  />
                )
              )}
            </div>
          </div>

          {/* Right Side - MonitorDetails (2/6 width) */}
          <div className="col-span-1 md:col-span-3">
            {" "}
            {/* 2 ki jagah 3 kiya */}
            <MonitorDetails
              request={request}
              schedule={schedule}
              platform={platform}
            />
          </div>
        </div>

        {/* Doosri Row - SSL + DNS (Same) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SSLSection ssl={ssl} />
          <DNSSection dns={dns} />
        </div>
      </div>
    </div>
  );
});

RenderData.displayName = "RenderData";

const Page = () => {
  if (!cronitorSampleData) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <h1 className="text-red-500 text-xl">Something went wrong!</h1>
      </div>
    );
  }

  return <RenderData data={cronitorSampleData.monitors[0]} />;
};

export default Page;
