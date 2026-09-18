"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  PackageX,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import SalesTrendChart, { type TrendPoint } from "./SalesTrendChart";

type Activity = {
  sales_trend: TrendPoint[];
  upcoming: {
    id: number;
    date: string | null;
    time: string | null;
    patient: string | null;
    service: string | null;
    location: string | null;
    approved: boolean;
  }[];
  stock_by_location: { location: string; stocked: number; out_of_stock: number; low_stock: number }[];
  returns: {
    total: number;
    quantity: number;
    this_month: number;
    latest: string | null;
    by_reason: { reason: string; count: number; quantity: number }[];
  };
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
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelSkeleton({ h = "h-[220px]" }: { h?: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
      <div className={`mt-4 w-full animate-pulse rounded bg-slate-100 ${h}`} />
    </section>
  );
}

const linkClass = "text-xs font-semibold text-[#0066ff] hover:underline";

export default function DashboardPanels() {
  const [d, setD] = useState<Activity | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/activity", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.error || !json?.data) setFailed(true);
        else setD(json.data as Activity);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;

  if (!d) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><PanelSkeleton /></div>
        <PanelSkeleton />
        <PanelSkeleton h="h-[160px]" />
        <PanelSkeleton h="h-[160px]" />
        <PanelSkeleton h="h-[160px]" />
      </div>
    );
  }

  const { attention, returns } = d;
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
          <p className="py-8 text-center text-sm text-slate-500">Nothing outstanding.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {attentionItems.map((i) => (
              <li key={i.label}>
                <Link
                  href={i.href}
                  className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-[#0066ff]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                      {i.icon}
                    </span>
                    <span className="truncate text-xs text-slate-600">{i.label}</span>
                  </span>
                  <span className="shrink-0 text-lg font-bold text-slate-900">{num(i.value)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Next appointments"
        subtitle="Today and after"
        action={<Link href="/appointments" className={linkClass}>All</Link>}
      >
        {d.upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Nothing booked.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {d.upcoming.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {a.patient || "Unnamed patient"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {[a.service, a.location].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-slate-700">
                    {a.date} {a.time ?? ""}
                  </p>
                  {!a.approved && (
                    <p className="text-[11px] font-medium text-amber-700">Awaiting approval</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Stock by location"
        subtitle="Worst shortfall first"
        action={<Link href="/inventory/manage" className={linkClass}>Inventory</Link>}
      >
        {d.stock_by_location.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No stock recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-semibold">Location</th>
                  <th className="pb-2 text-right font-semibold">Stocked</th>
                  <th className="pb-2 text-right font-semibold">Out</th>
                  <th className="pb-2 text-right font-semibold">Low</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {d.stock_by_location.slice(0, 6).map((r) => (
                  <tr key={r.location}>
                    <td className="max-w-[160px] truncate py-2 text-slate-700" title={r.location}>
                      {r.location}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-700">{num(r.stocked)}</td>
                    <td className="py-2 text-right font-semibold tabular-nums text-amber-700">
                      {num(r.out_of_stock)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-700">{num(r.low_stock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Returns"
        subtitle={
          returns.total === 0
            ? "None recorded"
            : returns.this_month > 0
              ? `${num(returns.this_month)} this month · ${num(returns.total)} all time`
              : `None this month · ${num(returns.total)} all time${
                  returns.latest ? `, last on ${new Date(returns.latest).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""
                }`
        }
        action={<Link href="/pos/return" className={linkClass}><RotateCcw size={13} className="mr-1 inline" />Returns</Link>}
      >
        {returns.by_reason.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No returns recorded.</p>
        ) : (
          <ul className="space-y-2.5">
            {returns.by_reason.map((r) => {
              const max = Math.max(...returns.by_reason.map((x) => x.count), 1);
              return (
                <li key={r.reason}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-slate-700">{r.reason}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {num(r.count)} · {num(r.quantity)} units
                    </span>
                  </div>
                  {/* Proportion bar: one hue, magnitude only — the count beside it
                      carries the value, so the bar never has to be read precisely. */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-[#2a78d6]"
                      style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
