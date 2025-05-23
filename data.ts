import {
  CronitorData,
  LatestEvent,
  RenderArrInterface,
} from "./types/dashboard.interface";
import { Group47, Group44, Group52, Globe, Group53, Ellipse, blueshade } from "@/assets/images";
import { AlertOctagon } from "lucide-react";


export const render_arr: RenderArrInterface[] = [
  {
    label: "Dashboard_k1",
    key: "public_badge_url",
    type: "image",
    icon: Group44.src,
    bgImage: Globe.src
  },
  {
    label: "Dashboard_k2",
    key: "latest_event",
    render_value: (val: { latest_event: LatestEvent }) =>
      val.latest_event.metrics.duration,
    icon: Group47.src,
    bgImage: blueshade.src,

  },
  {
    label: "Dashboard_k3",
    key: "schedule",
    type: "text",
    icon: Group52.src,
    bgImage: Ellipse.src,
  },
  {
    label: "Dashboard_k5",
    key: "realert_interval",
    icon: Group52.src,
    bgImage: Group53.src,
  },
];

export const cronitorSampleData: CronitorData = {
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

export const render_detail_keys: RenderDetailFields[] = [
  {
    label: "First Name",
    key: "first_name",
    can_sort: true,
  },
  {
    label: "Last Name",
    key: "last_name",
    can_sort: true,
  },
  {
    label: "Email Address",
    key: "email_address",
    can_sort: true,
  },
  {
    label: "D.O.B",
    key: "dob",
    can_sort: true,
  },
  {
    label: "Sex",
    key: "sex",
    can_sort: true,
  },
  {
    label: "Service",
    key: "service",
    can_sort: true,
  },
  {
    label: "Location",
    key: "location",
    can_sort: true,
  },
  {
    label: "Phone",
    key: "phone",
  },
  {
    label: "Address",
    key: "address",
    can_sort: true,
  },
  {
    label: "Date slot",
    key: "date_and_time",
    type: "date_slot",
    can_sort: true,
  },
  {
    label: "Time slot",
    key: "date_and_time",
    type: "time_slot",
    can_sort: true,
  },
  {
    label: "Created at",
    key: "created_at",
    date_format: true,
  },
];
