'use client'
import { memo, useState } from "react";
import moment from "moment";
import { Spinner } from "flowbite-react";
import { cronitorSampleData, render_arr } from "@/data";
import { CronitorRequest, DNS, Monitor, SSL } from "@/types/dashboard.interface";

const InfoCard = memo(({ label, value, type = 'text' }: { label: string; value: any; type?: 'text' | 'image' }) => (
  <div className="bg-gray-100/75 p-4 rounded-md space-y-3">
    <h1 className="text-lg font-bold">{label}</h1>
    {type === 'image' ? (
      <img src={value} alt={label} className="text-green-500 font-bold" />
    ) : (
      <h1 className="break-words">{value}</h1>
    )}
  </div>
));

const DataField = memo(({ label, value }: { label: string; value: React.ReactNode }) => (
  <dl>
    <dt className="font-bold text-sm md:text-base">{label}</dt>
    <dd className="break-words">{value}</dd>
  </dl>
));

const SSLSection = memo(({ ssl }: { ssl: SSL }) => (
  <div className="bg-gray-100/75 p-4 rounded-md">
    <h1 className="mb-3 text-xl md:text-2xl">SSL</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DataField label="Issued to" value={ssl.issued_to} />
      <DataField label="Issued By" value={ssl.issued_by} />
      <DataField 
        label="Issued at" 
        value={moment(ssl.issued_at).format('DD/MM/YYYY, h:mm A')} 
      />
      <DataField 
        label="Expires at" 
        value={moment(ssl.expires_at).format('DD/MM/YYYY, h:mm A')} 
      />
    </div>
  </div>
));

const DNSSection = memo(({ dns }: { dns: DNS }) => (
  <div className="bg-gray-100/75 p-4 rounded-md">
    <h1 className="mb-3 text-xl md:text-2xl">DNS</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DataField label="Name" value={dns.name} />
      <DataField 
        label="Expires at" 
        value={moment(dns.expires_at).format('DD/MM/YYYY, h:mm A')} 
      />
      <DataField label="Registrar" value={dns.registrar} />
      <DataField 
        label="Server Name" 
        value={dns.name_servers.map((name, ind) => (
          <p key={ind}>{name}</p>
        ))} 
      />
    </div>
  </div>
));

const MonitorDetails = memo(({ request, schedule, platform }: { 
  request: CronitorRequest; 
  schedule: string; 
  platform: string; 
}) => (
  <div className="col-span-1 md:col-span-2 bg-gray-100/75 rounded-lg p-4">
    <h1 className="mb-3 text-xl md:text-2xl">Monitor Details</h1>
    <div className="space-y-6">
      <DataField 
        label="Request" 
        value={
          <>
            <span className="rounded-md bg-slate-700 px-3 py-1 text-white text-xs">GET</span>
            <span className="ml-2 break-words">{request.url}</span>
          </>
        } 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DataField label="Interval" value={schedule} />
        <DataField label="Protocol" value={platform} />
        <DataField label="Request Timeout" value={`${request.timeout_seconds} seconds`} />
        <DataField label="Headers" value={Object.keys(request.headers).length || 'none'} />
      </div>
      <DataField 
          label="Locations" 
          value={
            <div className="flex  space-x-2 flex-wrap w-[100%]">
              {request.regions?.map((region, index) => (
                <span key={index} className="rounded-md bg-slate-700 px-3 py-1 text-white text-sm">
                  {region}
                </span>
              ))}
            </div>
          } 
        />
    </div>
  </div>
));

const RenderData = memo(({ data }: { data: Monitor }) => {
  const { 
    attributes: { site: { ssl, dns } }, 
    request, 
    platform, 
    schedule 
  } = data;

  return (
    <div className="mt-12 text-slate-700 p-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="col-span-1 md:col-span-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {render_arr.map(({ label, key, type, render_value }, ind) => (
              <InfoCard
                key={ind}
                label={label}
                value={render_value ? render_value(data) : (data as any)[key]}
                type={type}
              />
            ))}
          </div>
          <SSLSection ssl={ssl} />
          <DNSSection dns={dns} />
        </div>
        <MonitorDetails 
          request={request} 
          schedule={schedule} 
          platform={platform} 
        />
      </div>
    </div>
  );
});

const Page = () => {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Spinner color="info" aria-label="Loading" size="lg" />
      </div>
    );
  }

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
