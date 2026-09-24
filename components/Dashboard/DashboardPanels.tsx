"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  PackageX,
  TrendingUp,
} from "lucide-react";
import SalesTrendChart, { type TrendPoint } from "./SalesTrendChart";

/**
 * Only what these panels read. /api/dashboard/activity still returns `upcoming`,
 * `stock_by_location` and `returns` — the panels that showed them were removed
 * on request (2026-09-23), so the SQL still computes three result sets nobody
 * renders. Worth trimming in dashboard_activity if the panels do not come back.
 */
type Activity = {
  sales_trend: TrendPoint[];
  attention: { pending_approvals: number; out_of_stock: number; low_stock: number };
};

const num = (n: number) => (n ?? 0).toLocaleString("en-US");

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-separator bg-white p-4 shadow-mac-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-body font-bold text-label">{title}</h3>
          {subtitle && <p className="mt-0.5 text-footnote text-label-2">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelSkeleton({ h = "h-[220px]" }: { h?: string }) {
  return (
    <section className="rounded-xl border border-separator bg-white p-4 shadow-mac-sm">
      <div className="h-3 w-28 animate-pulse rounded bg-surface-2" />
      <div className={`mt-4 w-full animate-pulse rounded bg-surface-2 ${h}`} />
    </section>
  );
}

const linkClass = "text-footnote font-semibold text-brand-600 hover:underline";

/** `locationId` comes from the dashboard page; "" is every granted location. */
export default function DashboardPanels({ locationId = "" }: { locationId?: string }) {
  const [d, setD] = useState<Activity | null>(null);
  const [failed, setFailed] = useState(false);
  // Everything below the tiles is a company figure. The server withholds it
  // from anyone who is not a super admin, and the section simply does not render.
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setD(null);
    setFailed(false);
    setRestricted(false);
    const qs = locationId ? `?location_id=${encodeURIComponent(locationId)}` : "";
    fetch(`/api/dashboard/activity${qs}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.restricted) setRestricted(true);
        else if (json?.error || !json?.data) setFailed(true);
        else setD(json.data as Activity);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  if (restricted || failed) return null;

  if (!d) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><PanelSkeleton /></div>
        <PanelSkeleton />
      </div>
    );
  }

  const { attention } = d;
  const attentionItems = [
    {
      label: "Appointments awaiting approval",
      value: attention.pending_approvals,
      href: "/appointments",
      icon: <CalendarClock size={15} className="text-amber-700" />,
    },
    {
      label: "Items out of stock",
      value: attention.out_of_stock,
      href: "/inventory/manage",
      icon: <PackageX size={15} className="text-amber-700" />,
    },
    {
      label: "Items low on stock",
      value: attention.low_stock,
      href: "/inventory/manage",
      icon: <AlertTriangle size={15} className="text-amber-700" />,
    },
  ].filter((i) => i.value > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel
        title="Sales, last 14 days"
        subtitle="Daily takings across your locations — today is still in progress"
        className="lg:col-span-2"
        action={
          <Link href="/pos/history" className={linkClass}>
            <TrendingUp size={13} className="mr-1 inline" />
            History
          </Link>
        }
      >
        <SalesTrendChart data={d.sales_trend} />
      </Panel>

      <Panel title="Needs attention" subtitle="Things waiting on someone">
        {attentionItems.length === 0 ? (
          <p className="py-8 text-center text-body text-label-2">Nothing outstanding.</p>
        ) : (
          <ul className="divide-y divide-separator">
            {attentionItems.map((i) => (
              <li key={i.label}>
                <Link
                  href={i.href}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-brand-600"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                      {i.icon}
                    </span>
                    <span className="truncate text-footnote text-label-2">{i.label}</span>
                  </span>
                  <span className="shrink-0 text-title3 text-label">{num(i.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

    </div>
  );
}
