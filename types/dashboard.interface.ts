// Common types
type Nullable<T> = T | null;
type ISO8601DateTime = string;
type UnixTimestamp = number;

// Render types
interface RenderDataProps {
  data: Monitor;
}

interface RenderArrInterface {
  icon: string;
  label: string;
  key: keyof Monitor | string;
  type?: 'text' | 'image';
  render_value?: (data: Monitor) => string | number;
  bgImage?: string;
}

// DNS and SSL types
interface SSL {
  issued_to: string;
  issued_by: string;
  issued_at: ISO8601DateTime;
  expires_at: ISO8601DateTime;
}

interface DNS {
  name: string;
  expires_at: ISO8601DateTime;
  registrar: string;
  name_servers: string[];
}

interface Site {
  ssl: SSL;
  dns: DNS;
}

// Request related types
interface Metrics {
  duration: number;
}

interface LatestEvent {
  stamp: UnixTimestamp;
  msg: string;
  event: string;
  metrics: Metrics;
  client: Nullable<string>;
  host: string;
  ip: string;
}

interface CronitorRequest {
  url: string;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  body: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  timeout_seconds: number;
  regions: string[];
  follow_redirects: boolean;
  verify_ssl: boolean;
}

// Monitor and attributes types
interface Attributes {
  group_name: Nullable<string>;
  site: Site;
  key: string;
  code: string;
}

interface Monitor {
  // Required fields
  attributes: Attributes;
  created: ISO8601DateTime;
  disabled: boolean;
  grace_seconds: number;
  consecutive_alert_threshold: number;
  initialized: boolean;
  key: string;
  latest_event: LatestEvent;
  name: string;
  notify: string[];
  passing: boolean;
  paused: boolean;
  platform: string;
  realert_interval: string;
  request: CronitorRequest;
  running: boolean;
  schedule: string;
  type: string;
  environments: string[];
  public_badge_url: string;

  // Optional fields
  assertions: any[];
  failure_tolerance: Nullable<number>;
  group: Nullable<string>;
  latest_events: Nullable<any>;
  latest_issue: Nullable<any>;
  latest_invocations: Nullable<any>;
  metadata: Nullable<any>;
  next_expected_at: Nullable<ISO8601DateTime>;
  note: Nullable<string>;
  schedule_tolerance: Nullable<any>;
  tags: any[];
  timezone: Nullable<string>;
  statuspages: any[];
  site: Nullable<any>;
}

// Main data structure
interface CronitorData {
  monitors: Monitor[];
  page_size: number;
  page: number;
  total_monitor_count: number;
  version: string;
}

export type {
  CronitorData,
  Monitor,
  RenderDataProps,
  RenderArrInterface,
  Site,
  SSL,
  DNS,
  LatestEvent,
  CronitorRequest,
  Attributes,
  Metrics
};