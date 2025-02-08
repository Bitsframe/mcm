"use client";
import moment from "moment";
import { useState } from "react";
import { Spinner } from "flowbite-react";

interface CronitorData {
  monitors: Monitor[];
  page_size: number;
  page: number;
  total_monitor_count: number;
  version: string;
}

interface Monitor {
  attributes: Attributes;
  assertions: any[];
  created: string;
  disabled: boolean;
  failure_tolerance: number | null;
  grace_seconds: number;
  consecutive_alert_threshold: number;
  group: string | null;
  initialized: boolean;
  key: string;
  latest_event: LatestEvent;
  latest_events: any | null;
  latest_issue: any | null;
  latest_invocations: any | null;
  public_badge_url: string;
  metadata: any | null;
  name: string;
  next_expected_at: string | null;
  note: string | null;
  notify: string[];
  passing: boolean;
  paused: boolean;
  platform: string;
  realert_interval: string;
  request: Request;
  running: boolean;
  schedule: string;
  schedule_tolerance: any | null;
  tags: any[];
  timezone: string | null;
  type: string;
  environments: string[];
  statuspages: any[];
  site: any | null;
}

interface Attributes {
  group_name: string | null;
  site: Site;
  key: string;
  code: string;
}

interface Site {
  ssl: SSL;
  dns: DNS;
}

interface SSL {
  issued_to: string;
  issued_by: string;
  issued_at: string;
  expires_at: string;
}

interface DNS {
  name: string;
  expires_at: string;
  registrar: string;
  name_servers: string[];
}

interface LatestEvent {
  stamp: number;
  msg: string;
  event: string;
  metrics: Metrics;
  client: string | null;
  host: string;
  ip: string;
}

interface Metrics {
  duration: number;
}

interface Request {
  url: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body: string;
  method: string;
  timeout_seconds: number;
  regions: string[];
  follow_redirects: boolean;
  verify_ssl: boolean;
}

const cronitorSampleData: CronitorData = {
  monitors: [
    {
      attributes: {
        group_name: null,
        site: {
          ssl: {
            issued_to: "new.clinicsanmiguel.com",
            issued_by: "R11",
            issued_at: "2024-08-03T20:26:54Z",
            expires_at: "2024-11-01T20:26:53Z",
          },
          dns: {
            name: "CLINICSANMIGUEL.COM",
            expires_at: "2025-11-01T03:52:13Z",
            registrar: "GoDaddy.com, LLC",
            name_servers: ["NS75.DOMAINCONTROL.COM", "NS76.DOMAINCONTROL.COM"],
          },
        },
        key: "YnJGeQ",
        code: "YnJGeQ",
      },
      assertions: [],
      created: "2024-05-25T15:58:55+00:00",
      disabled: false,
      failure_tolerance: null,
      grace_seconds: 0,
      consecutive_alert_threshold: 10,
      group: null,
      initialized: true,
      key: "YnJGeQ",
      latest_event: {
        stamp: 1723976628.427,
        msg: "",
        event: "req-ok",
        metrics: {
          duration: 0.408,
        },
        client: null,
        host: "eu-west-1",
        ip: "",
      },
      latest_events: null,
      latest_issue: null,
      latest_invocations: null,
      public_badge_url:
        "https://cronitor.io/badges/YnJGeQ/production/l6f36-66KxKxAAA2zSrrK-d_TFs.svg",
      metadata: null,
      name: "clinca check1",
      next_expected_at: null,
      note: null,
      notify: ["default"],
      passing: true,
      paused: false,
      platform: "http",
      realert_interval: "every 8 hours",
      request: {
        url: "https://new.clinicsanmiguel.com/",
        headers: {},
        cookies: {},
        body: "",
        method: "GET",
        timeout_seconds: 10,
        regions: ["eu-central-1", "us-east-1", "eu-west-1", "us-west-1"],
        follow_redirects: true,
        verify_ssl: true,
      },
      running: false,
      schedule: "every 5 minutes",
      schedule_tolerance: null,
      tags: [],
      timezone: null,
      type: "check",
      environments: ["production"],
      statuspages: [],
      site: null,
    },
  ],
  page_size: 50,
  page: 1,
  total_monitor_count: 1,
  version: "2020-10-01",
};

interface RenderArrInterface {
  label: string;
  key: string;
  type?: string;
  render_value?: (val: any) => string | number;
}

const render_arr: RenderArrInterface[] = [
  {
    label: "Status",
    key: "public_badge_url",
    type: "image",
  },
  {
    label: "Response Time",
    key: "latest_event",
    render_value: (val: { latest_event: LatestEvent }) =>
      val.latest_event.metrics.duration,
  },
  {
    label: "Checks",
    key: "schedule",
    type: "text",
  },
  {
    label: "Alerts",
    key: "realert_interval",
  },
];

interface RenderDataProps {
  data: Monitor;
}

const Render_Data = ({ data }: RenderDataProps) => {
  const {
    attributes: {
      site: { ssl, dns },
    },
    request,
    platform,
    schedule,
    public_badge_url,
  } = data;
  console.log(data);
  return (
    <div className="mt-24 text-slate-700 ">
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-4 space-y-4">
          <div className="grid grid-cols-4 gap-4 ">
            {render_arr.map(({ label, key, type, render_value }, ind) => {
              const extractedVal = render_value
                ? render_value(data)
                : (data as any)[key];

              return (
                <div
                  key={ind}
                  className="bg-gray-100/75 py-2 px-3 rounded-md space-y-3"
                >
                  <h1 className="text-lg font-bold">{label}</h1>
                  {type === "image" ? (
                    <h1 className="text-green-500 font-bold">
                      <img src={extractedVal} />
                    </h1>
                  ) : (
                    <h1>{extractedVal}</h1>
                  )}
                  {/* <h1 className="text-sm text-gray-600">
                  Just Now
                </h1> */}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-100/75 py-2 px-3 rounded-md">
            <h1 className="mb-3  text-2xl">SSL</h1>

            <div className="grid grid-cols-4 gap-4">
              <dl>
                <dt className="font-bold">Issued to</dt>
                <dd>{ssl.issued_to}</dd>
              </dl>
              <dl>
                <dt className="font-bold">Issued By</dt>
                <dd>{ssl.issued_by}</dd>
              </dl>
              <dl>
                <dt className="font-bold">Issued at</dt>
                <dd>{moment(ssl.issued_at).format("DD/MM/YYYY, h:mm A")}</dd>
              </dl>
              <dl>
                <dt className="font-bold">Expires at</dt>
                <dd>{moment(ssl.expires_at).format("DD/MM/YYYY, h:mm A")}</dd>
              </dl>
            </div>
          </div>

          <div className="bg-gray-100/75 py-2 px-3 rounded-md">
            <h1 className="mb-3  text-2xl">DNS</h1>

            <div className="grid grid-cols-4 gap-4">
              <dl>
                <dt className="font-bold">Name</dt>
                <dd>{dns.name}</dd>
              </dl>
              <dl>
                <dt className="font-bold">Expires at</dt>
                <dd>{moment(dns.expires_at).format("DD/MM/YYYY, h:mm A")}</dd>
              </dl>
              <dl>
                <dt className="font-bold">Registrar</dt>
                <dd>{dns.registrar}</dd>
              </dl>
              <dl className="col-span-4">
                <dt className="font-bold">Server Name</dt>
                <dd>
                  {dns.name_servers.map((name: string, ind: number) => (
                    <p key={ind}>{name}</p>
                  ))}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-gray-100/75 rounded-lg px-3 py-5">
          <h1 className="mb-3  text-2xl">Monitor Details</h1>

          <div className="space-y-6">
            <dl>
              <dt className="font-bold">Request</dt>
              <dd>
                {" "}
                <span className="rounded-md bg-slate-700 px-3 py-1 text-white text-xs ">
                  GET
                </span>{" "}
                <span>{request?.url}</span>
              </dd>
            </dl>

            <div className="grid grid-cols-2 gap-4">
              <dl>
                <dt className="font-bold">Interval</dt>
                <dd>
                  {" "}
                  <span>{schedule}</span>
                </dd>
              </dl>
              <dl>
                <dt className="font-bold">Protocol</dt>
                <dd>
                  {" "}
                  <span>{platform}</span>
                </dd>
              </dl>
              <dl>
                <dt className="font-bold">Request Timeout</dt>
                <dd>
                  {" "}
                  <span>{request.timeout_seconds} seconds</span>
                </dd>
              </dl>
              <dl>
                <dt className="font-bold">Headers</dt>
                <dd>
                  {" "}
                  <span>{Object.keys(request.headers).length || "none"}</span>
                </dd>
              </dl>

              <dl className="col-span-2">
                <dt className="font-bold">Locations</dt>

                <div className="flex items-center space-x-3 flex-wrap">
                  {request?.regions?.map((region: string, index: number) => (
                    <dd key={index}>
                      {" "}
                      <span className="rounded-md bg-slate-700 px-3 py-1 text-white text-sm ">
                        {region}
                      </span>
                    </dd>
                  ))}
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  // const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await fetch('https://cronitor.io/api/monitors/YnJGeQ?env=production&format=api&sort=-created&time=24h', {
  //         method: 'GET',
  //         headers: {
  //           'Authorization': 'Basic ' + btoa('key:d58be4b77cb54e2abd02e5940d030016'), // Replace '' with your password if needed
  //           'Content-Type': 'application/json'
  //         }
  //       });

  //       if (!response.ok) {
  //         throw new Error('Network response was not ok');
  //       }

  //       const result = await response.json();
  //       setData(result);
  //     } catch (error) {
  //       console.error('Fetch error:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, []);

  // console.log(data)

  return (
    <>
      {loading ? (
        <div className="grid place-items-center h-screen w-full">
          <Spinner color="info" aria-label="Info spinner example" size="lg" />{" "}
        </div>
      ) : cronitorSampleData ? (
        <Render_Data data={cronitorSampleData.monitors[0]} />
      ) : (
        <div className="grid place-items-center h-screen w-full">
          <h1 className="text-red-500 text-xl">Somethig Went wrong!</h1>
        </div>
      )}
    </>
  );
};

export default Page;
