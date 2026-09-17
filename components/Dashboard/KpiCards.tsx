"use client";

import { useContext, useEffect, useState } from "react";
import { LocationContext } from "@/context";
import {
  AlertTriangle,
  CalendarCheck2,
  DollarSign,
  Package,
  Users,
} from "lucide-react";

type Stats = {
  sales: { revenue_month: number; revenue_total: number; orders_month: number };
  appointments: { total: number; month: number; upcoming: number };
  patients: { total: number; month: number };
  warehouse: { products: number; stocked_items: number; out_of_stock: number };
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = (n: number) => n.toLocaleString("en-US");

function Card({
  label,
  value,
  sub,
  icon,
  accent,
  warn = false,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold leading-none text-slate-900">{value}</p>
      <p className={`mt-1.5 text-xs ${warn ? "font-medium text-amber-700" : "text-slate-500"}`}>
        {sub}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

/**
 * The four figures the clinic opens this page for: sales, appointments, patients
 * and warehouse. Scoped to the location chosen in the sidebar so the numbers
 * agree with the rest of the app.
 */
export default function KpiCards() {
  const { selectedLocation } = useContext(LocationContext) ?? {};
  const locationId = selectedLocation?.id ?? null;
  const locationTitle = selectedLocation?.title ?? null;

  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError(null);

    const url = locationId
      ? `/api/dashboard/stats?location_id=${locationId}`
      : "/api/dashboard/stats";

    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.error) setError(json.error);
        else setStats(json.data as Stats);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  if (error) {
    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Could not load dashboard figures: {error}
      </div>
    );
  }

  return (
    <section className="mb-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">Overview</h2>
        <span className="truncate text-xs text-slate-500">
          {locationTitle ?? "All locations"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {!stats ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : (
          <>
            <Card
              label="Sales this month"
              value={money(stats.sales.revenue_month)}
              sub={`${num(stats.sales.orders_month)} sold · ${money(stats.sales.revenue_total)} all time`}
              icon={<DollarSign size={16} className="text-emerald-700" />}
              accent="bg-emerald-50"
            />
            <Card
              label="Appointments"
              value={num(stats.appointments.month)}
              sub={`this month · ${num(stats.appointments.upcoming)} upcoming · ${num(stats.appointments.total)} all time`}
              icon={<CalendarCheck2 size={16} className="text-blue-700" />}
              accent="bg-blue-50"
            />
            <Card
              label="Total patients"
              value={num(stats.patients.total)}
              sub={`${num(stats.patients.month)} new this month`}
              icon={<Users size={16} className="text-violet-700" />}
              accent="bg-violet-50"
            />
            <Card
              label="Warehouse"
              value={num(stats.warehouse.stocked_items)}
              sub={
                stats.warehouse.out_of_stock > 0
                  ? `items stocked · ${num(stats.warehouse.out_of_stock)} out of stock`
                  : `items stocked · ${num(stats.warehouse.products)} in catalogue`
              }
              icon={
                stats.warehouse.out_of_stock > 0 ? (
                  <AlertTriangle size={16} className="text-amber-700" />
                ) : (
                  <Package size={16} className="text-amber-700" />
                )
              }
              accent="bg-amber-50"
              warn={stats.warehouse.out_of_stock > 0}
            />
          </>
        )}
      </div>
    </section>
  );
}
