"use client";
import { memo, useEffect } from "react";
import moment from "moment";
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
    customBgClass = "bg-gray-100 dark:bg-slate-700", // Changed default to gray
    bgImage,
    isFirstCard = false // Added new prop to identify first card
  }: {
    label: string;
    value: any;
    type?: "text" | "image";
    icon?: string
    customBgClass?: string;
    bgImage?: string;
    isFirstCard?: boolean; // Added new prop
  }) => {
    const { t } = useTranslation();
    // Determine background class based on isFirstCard
    const backgroundClass = isFirstCard 
      ? "bg-[#0066ff] text-white" 
      : customBgClass;
      
    return (
      <div
        className={`w-full h-full ${backgroundClass} rounded-[16px] p-3 flex flex-col bg-no-repeat bg-cover bg-center text-slate-800 dark:text-slate-200`}
        style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: '80% auto', // Smaller background image
        backgroundPosition: 'right center', } : {}}
      >
        <div className="mb-2">
          {icon && (
            <div className="flex justify-start mb-1.5">
              <div className={`w-8 h-8 rounded-md ${
                isFirstCard ? 'bg-white/20' : 'bg-white'
              } flex items-center justify-center`}>
                <img src={icon} alt="icon" className="w-4 h-4 object-contain" />
              </div>
            </div>
          )}

          <h1 className={`text-sm text-left  ${
            isFirstCard ? 'text-white' : 'text-[#79808B] dark:text-slate-200'
          }`}>{t(label)}</h1>
        </div>
        <div className="mt-auto">
          {type === "image" ? (
            <div className="flex justify-start">
              <img src={value} alt={label} className="w-24 h-4" />
            </div>
          ) : (
            <div className="text-left">
              <p className={`break-words text-base font-bold ${
                isFirstCard ? 'text-white' : 'text-slate-800 dark:text-slate-200'
              }`}>{value}</p>
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
    <dl className="bg-white dark:bg-slate-800 h-[68px] p-2 rounded-[11px] flex items-start gap-2 text-xs">
      {icon && (
        <div className="p-1.5 rounded-md text-[#0066ff] bg-[#f1f4f9] dark:bg-slate-700">
          {icon}
        </div>
      )}
      <div className="flex flex-col justify-end">
        <dt className="font-bold text-sm">{label}</dt>
        <dd className="break-words text-xs">{value}</dd>
      </div>
    </dl>
  )
);

DataField.displayName = "DataField"

const SSLSection = memo(({ ssl }: { ssl: SSL }) => {
  const { t } = useTranslation();
  const issuedAt = moment(ssl.issued_at);
  const expiresAt = moment(ssl.expires_at);
  const now = moment();
  const progress = Math.min(
    Math.max(((now.diff(issuedAt) / expiresAt.diff(issuedAt)) * 100, 0), 100
  ));
  const daysLeft = expiresAt.diff(now, "days");

  return (
    <div className="text-slate-800 dark:text-slate-200 text-sm">
      <h1 className="mb-2 text-base font-bold">{t("SSL Certificate")}</h1>
      <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-2.5 rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <DataField
            icon={<PanelsTopLeft size={15} />}
            label={t("Issued to")}
            value={ssl.issued_to}
          />
          <DataField
            icon={<ShieldCheck size={15} />}
            label={t("Issued By")}
            value={ssl.issued_by}
          />
          <DataField
            icon={<CalendarCheck2 size={15} />}
            label={t("Issued at")}
            value={issuedAt.format("DD/MM/YYYY, h:mm A")}
          />
          <DataField
            icon={<CalendarX2 size={15} />}
            label={t("Expires at")}
            value={expiresAt.format("DD/MM/YYYY, h:mm A")}
          />
        </div>
        <div className="mt-2.5">
          <div className="relative w-full h-[6px] bg-gray-300 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right mt-1 text-xs text-gray-600 dark:text-gray-400">
            {daysLeft > 0
              ? `${daysLeft} ${t("days remaining")}`
              : t("Certificate expired")}
          </div>
        </div>
      </div>
    </div>
  );
});

SSLSection.displayName = "SSLSection"

const DNSSection = memo(({ dns }: { dns: DNS }) => {
  const { t } = useTranslation(translationConstant.DASHBOARD);
  return (
    <div className="text-slate-800 dark:text-slate-200 text-sm">
      <h1 className="mb-2 text-base font-bold">{t("Dashboard_k21")}</h1>
      <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-2.5 rounded-md h-[200px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <DataField
            icon={<Globe size={15} />}
            label={t("Dashboard_k19")}
            value={dns.name}
          />
          <DataField
            icon={<CalendarX2 size={15} />}
            label={t("Dashboard_k8")}
            value={moment(dns.expires_at).format("DD/MM/YYYY, h:mm A")}
          />
          <DataField
            icon={<Building size={15} />}
            label={t("Dashboard_k9")}
            value={dns.registrar}
          />
          <DataField
            icon={<Server size={15} />}
            label={t("Dashboard_k10")}
            value={
              <div className="text-xs">
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

DNSSection.displayName = "DNSSection"

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
      if (locale && i18n.language !== locale) i18n.changeLanguage(locale);
    }, [params.locale, i18n]);

    return (
      <div className="col-span-1 md:col-span-2 text-slate-800 dark:text-slate-200 text-sm">
        <h1 className="mb-2 text-base font-bold">{t("Dashboard_k11")}</h1>
        <div className="bg-[#F1F4F9] dark:bg-[#080E16] rounded-md p-2.5">
          <div className="space-y-3">
            <DataField
              icon={<GitPullRequestArrow size={15} />}
              label={
                <div className="flex items-center text-sm gap-1.5">
                  <span>{t("Dashboard_k12")}</span>
                  <span className="rounded-md bg-[#0066ff] px-2 py-0.5 text-white text-xs">
                    {t("Dashboard_k4")}
                  </span>
                </div>
              }
              value={<span className="break-words text-xs">{request.url}</span>}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <DataField
                icon={<RefreshCcw size={15} />}
                label={t("Dashboard_k13")}
                value={schedule}
              />
              <DataField
                icon={<Network size={15} />}
                label={t("Dashboard_k14")}
                value={platform}
              />
              <DataField
                icon={<Layers size={15} />}
                label={t("Dashboard_k16")}
                value={Object.keys(request.headers).length || "none"}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <DataField
                icon={<Timer size={15} />}
                label={t("Dashboard_k15")}
                value={`${request.timeout_seconds} seconds`}
              />
              <DataField
                label={
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md text-[#0066ff] bg-[#f1f4f9] dark:bg-slate-700">
                      <Server size={15} />
                    </div>
                    <span>{t("Dashboard_k17")}</span>
                  </div>
                }
                value={
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {request.regions?.map((region, index) => (
                      <span
                        key={index}
                        className="rounded-md bg-[#0066ff] px-1.5 py-0.5 text-white text-[10px]"
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

MonitorDetails.displayName = "MonitorDetails"

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
    <div className="text-slate-700 dark:text-slate-200 p-2.5 pb-7">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <h1 className="mt-1 mb-2 text-sm text-gray-500 dark:text-gray-400">
          Home / Dashboard
        </h1>
      </div>
      <div className="space-y-3 mt-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2.5">
          <div className="col-span-1 md:col-span-3">
            <h2 className="text-base font-bold">Quick Stats</h2>
            <div className="pt-2 rounded-md mt-1.5">
              <div className="grid grid-cols-2 gap-2.5">
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
                      isFirstCard={ind === 0} // Pass isFirstCard prop
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <SSLSection ssl={ssl} />
          <DNSSection dns={dns} />
        </div>
      </div>
    </div>
  );
});

RenderData.displayName = "RenderData"

const Page = () => {
  if (!cronitorSampleData) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <h1 className="text-red-500 text-xs">Something went wrong!</h1>
      </div>
    );
  }
  return <RenderData data={cronitorSampleData.monitors[0]} />;
};
export default Page;