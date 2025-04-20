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
import {
  GitPullRequestArrow,
  RefreshCcw,
  Network,
  Layers,
  Timer,
  Server,
  PanelsTopLeft,
  ShieldCheck,
  CalendarCheck2,
  CalendarX2,
  Globe,
  Building,
} from "lucide-react";

const InfoCard = memo(
  ({
    label,
    value,
    type = "text",
    icon,
    customBgClass = "bg-white dark:bg-slate-800",
    bgImage,
  }: {
    label: string;
    value: any;
    type?: "text" | "image";
    icon?: string;
    customBgClass?: string;
    bgImage?: string;
  }) => {
    const { t } = useTranslation();

    return (
      <div
        className={`w-full h-full ${customBgClass} rounded-[20px] p-4 flex flex-col bg-no-repeat bg-cover bg-center text-slate-800 dark:text-slate-200`}
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
      >
        <div className="mb-2">
          {icon && (
            <div className="flex justify-start mb-2">
              <img src={icon} alt="icon" className="w-8 h-8 object-contain" />
            </div>
          )}
          <h1 className="text-base font-bold text-left">{t(label)}</h1>
        </div>

        <div className="mt-auto">
          {type === "image" ? (
            <div className="flex justify-start">
              <img src={value} alt={label} className="w-28 h-4" />
            </div>
          ) : (
            <div className="text-left">
              <p className="break-words text-lg font-bold">{value}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

InfoCard.displayName = "InfoCard";

const DataField = memo(
  ({
    label,
    value,
    icon,
  }: {
    label: React.ReactNode;
    value: React.ReactNode;
    icon?: React.ReactNode;
  }) => (
    <dl className="bg-white dark:bg-slate-800 h-[77px] p-2 rounded-[10px] flex items-start gap-3">
      {icon && (
        <div className="p-2 rounded-lg text-[#0066ff] bg-[#f1f4f9] dark:bg-slate-700 ">
          {icon}
        </div>
      )}
      <div className="flex flex-col justify-end">
        <dt className="font-bold text-sm md:text-base">{label}</dt>
        <dd className="break-words text-sm">{value}</dd>
      </div>
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
    <div className="text-slate-800 dark:text-slate-200">
      <h1 className="mb-3 text-xl md:text-2xl">{t("SSL Certificate")}</h1>
      <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-4 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField
            icon={<PanelsTopLeft size={18} />}
            label={t("Issued to")}
            value={ssl.issued_to}
          />
          <DataField
            icon={<ShieldCheck size={18} />}
            label={t("Issued By")}
            value={ssl.issued_by}
          />
          <DataField
            icon={<CalendarCheck2 size={18} />}
            label={t("Issued at")}
            value={issuedAt.format("DD/MM/YYYY, h:mm A")}
          />
          <DataField
            icon={<CalendarX2 size={18} />}
            label={t("Expires at")}
            value={expiresAt.format("DD/MM/YYYY, h:mm A")}
          />
        </div>

        <div className="mt-4">
          <div className="relative w-full h-2 bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right mt-1 text-sm text-gray-600 dark:text-gray-400">
            {daysLeft > 0
              ? `${daysLeft} ${t("days remaining")}`
              : t("Certificate expired")}
          </div>
        </div>
      </div>
    </div>
  );
});

SSLSection.displayName = "SSLSection";

const DNSSection = memo(({ dns }: { dns: DNS }) => {
  const { t } = useTranslation(translationConstant.DASHBOARD);

  return (
    <div className="text-slate-800 dark:text-slate-200">
      <h1 className="mb-3 text-xl md:text-2xl">{t("Dashboard_k21")}</h1>
      <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-4 rounded-md h-[250px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataField
            icon={<Globe size={18} />}
            label={t("Dashboard_k19")}
            value={dns.name}
          />
          <DataField
            icon={<CalendarX2 size={18} />}
            label={t("Dashboard_k8")}
            value={moment(dns.expires_at).format("DD/MM/YYYY, h:mm A")}
          />
          <DataField
            icon={<Building size={18} />}
            label={t("Dashboard_k9")}
            value={dns.registrar}
          />
          <DataField
            icon={<Server size={18} />}
            label={t("Dashboard_k10")}
            value={
              <div>
                {dns.name_servers.map((name, ind) => (
                  <p key={ind}>{name}</p>
                ))}
              </div>
            }
          />
        </div>
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

    useEffect(() => {
      const locale = params.locale as string;
      if (locale && i18n.language !== locale) {
        i18n.changeLanguage(locale);
      }
    }, [params.locale, i18n]);

    return (
      <div className="col-span-1 md:col-span-2 text-slate-800 dark:text-slate-200">
        <h1 className="mb-3 text-xl md:text-2xl">{t("Dashboard_k11")}</h1>
        <div className="bg-[#F1F4F9] dark:bg-[#080E16] rounded-lg p-4">
          <div className="space-y-6">
            <DataField
              icon={<GitPullRequestArrow size={18} />}
              label={
                <div className="flex items-center gap-2">
                  <span>{t("Dashboard_k12")}</span>
                  <span className="rounded-md bg-[#0066ff] px-3 py-1 text-white text-xs">
                    {t("Dashboard_k4")}
                  </span>
                </div>
              }
              value={<span className="break-words">{request.url}</span>}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DataField
                icon={<RefreshCcw size={18} />}
                label={t("Dashboard_k13")}
                value={schedule}
              />
              <DataField
                icon={<Network size={18} />}
                label={t("Dashboard_k14")}
                value={platform}
              />
              <DataField
                icon={<Layers size={18} />}
                label={t("Dashboard_k16")}
                value={Object.keys(request.headers).length || "none"}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataField
                icon={<Timer size={18} />}
                label={t("Dashboard_k15")}
                value={`${request.timeout_seconds} seconds`}
              />
              <DataField
                label={
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg text-[#0066ff] bg-[#f1f4f9] dark:bg-slate-700">
                      <Server size={18} />
                    </div>
                    <span>{t("Dashboard_k17")}</span>
                  </div>
                }
                value={
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.regions?.map((region, index) => (
                      <span
                        key={index}
                        className="rounded-md bg-[#0066ff] px-[6px] py-1 text-white text-[10px]"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                }
              />
            </div>
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
    <div className="text-slate-700 dark:text-slate-200 p-4 pb-11">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <h1 className="mt-1 mb-2 text-gray-500 dark:text-gray-400">
          Home / Dashboard
        </h1>
      </div>
      <div className="space-y-3 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="col-span-1 md:col-span-3">
            <h2 className="text-xl md:text-2xl">Quick Stats</h2>
            <div className="pt-4 rounded-lg mt-3">
              <div className="grid grid-cols-2 gap-4">
                {render_arr.map(
                  ({ icon, label, key, type, render_value, bgImage }, ind) => (
                    <InfoCard
                      key={ind}
                      icon={icon}
                      label={label}
                      value={
                        render_value ? render_value(data) : (data as any)[key]
                      }
                      type={type}
                      customBgClass={
                        ind === 0
                          ? "bg-[#0066ff] text-white"
                          : "bg-white dark:bg-slate-800"
                      }
                      bgImage={bgImage}
                    />
                  )
                )}
              </div>
            </div>
          </div>
          <div className="col-span-1 md:col-span-3">
            <MonitorDetails
              request={request}
              schedule={schedule}
              platform={platform}
            />
          </div>
        </div>
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