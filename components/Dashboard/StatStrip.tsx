"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  DollarSign,
  Layers,
  MapPin,
  Package,
  PackageX,
  Receipt,
  UserPlus,
  Users,
} from "lucide-react";
import { StatTile, StatTileSkeleton, type Tone } from "./StatTile";

export type StatsPage = "patients" | "appointments" | "sales" | "inventory" | "warehouse";

type Numbers = Record<string, number>;

const num = (n: number) => (n ?? 0).toLocaleString("en-US");
const money = (n: number) =>
  (n ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

type Tile = {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  tone?: Tone;
};

/** Each page's tiles, built from the numbers page_stats returns for it. */
function tilesFor(page: StatsPage, d: Numbers): Tile[] {
  switch (page) {
    case "patients":
      return [
        { label: "Total patients", value: num(d.total), sub: `${num(d.month)} new this month`, icon: <Users size={16} className="text-violet-700" />, accent: "bg-violet-50" },
        { label: "Seen this month", value: num(d.seen_this_month), sub: "with a visit recorded", icon: <CalendarCheck2 size={16} className="text-blue-700" />, accent: "bg-blue-50" },
        { label: "Onsite", value: num(d.onsite), sub: "registered at a clinic", icon: <MapPin size={16} className="text-emerald-700" />, accent: "bg-emerald-50" },
        { label: "Offsite", value: num(d.offsite), sub: "registered remotely", icon: <UserPlus size={16} className="text-slate-700" />, accent: "bg-slate-100" },
      ];
    case "appointments":
      return [
        { label: "Today", value: num(d.today), sub: "scheduled for today", icon: <CalendarCheck2 size={16} className="text-blue-700" />, accent: "bg-blue-50" },
        { label: "Upcoming", value: num(d.upcoming), sub: "today and later", icon: <CalendarClock size={16} className="text-violet-700" />, accent: "bg-violet-50" },
        {
          label: "Awaiting approval",
          value: num(d.pending),
          sub: d.pending > 0 ? "needs attention" : "all approved",
          icon: d.pending > 0 ? <AlertTriangle size={16} className="text-amber-700" /> : <ClipboardList size={16} className="text-emerald-700" />,
          accent: d.pending > 0 ? "bg-amber-50" : "bg-emerald-50",
          tone: d.pending > 0 ? "warn" : "default",
        },
        { label: "Booked this month", value: num(d.month), sub: `${num(d.new_patients_month)} from new patients`, icon: <UserPlus size={16} className="text-slate-700" />, accent: "bg-slate-100" },
      ];
    case "sales":
      return [
        { label: "Revenue today", value: money(d.revenue_today), sub: "so far today", icon: <DollarSign size={16} className="text-emerald-700" />, accent: "bg-emerald-50" },
        { label: "Revenue this month", value: money(d.revenue_month), sub: `${num(d.orders_month)} items sold`, icon: <Receipt size={16} className="text-blue-700" />, accent: "bg-blue-50" },
        { label: "Average sale", value: money(d.avg_sale_month), sub: "this month", icon: <DollarSign size={16} className="text-violet-700" />, accent: "bg-violet-50" },
        { label: "Items sold", value: num(d.orders_month), sub: "this month", icon: <Package size={16} className="text-slate-700" />, accent: "bg-slate-100" },
      ];
    case "inventory":
      return [
        { label: "Items stocked", value: num(d.stocked_items), sub: `across ${num(d.locations)} locations`, icon: <Package size={16} className="text-blue-700" />, accent: "bg-blue-50" },
        {
          label: "Out of stock",
          value: num(d.out_of_stock),
          sub: d.out_of_stock > 0 ? "at zero quantity" : "none",
          icon: <PackageX size={16} className="text-amber-700" />,
          accent: "bg-amber-50",
          tone: d.out_of_stock > 0 ? "warn" : "default",
        },
        {
          label: "Low stock",
          value: num(d.low_stock),
          sub: d.low_stock > 0 ? "fewer than 10 left" : "none",
          icon: <AlertTriangle size={16} className="text-amber-700" />,
          accent: "bg-amber-50",
          tone: d.low_stock > 0 ? "warn" : "default",
        },
        { label: "Locations", value: num(d.locations), sub: "holding stock", icon: <MapPin size={16} className="text-slate-700" />, accent: "bg-slate-100" },
      ];
    case "warehouse":
      return [
        { label: "Products", value: num(d.products), sub: "in the catalogue", icon: <Package size={16} className="text-blue-700" />, accent: "bg-blue-50" },
        { label: "Categories", value: num(d.categories), sub: "product groups", icon: <Layers size={16} className="text-violet-700" />, accent: "bg-violet-50" },
        { label: "Items stocked", value: num(d.stocked_items), sub: "across your locations", icon: <Package size={16} className="text-emerald-700" />, accent: "bg-emerald-50" },
        {
          label: "Out of stock",
          value: num(d.out_of_stock),
          sub: d.out_of_stock > 0 ? "at zero quantity" : "none",
          icon: <PackageX size={16} className="text-amber-700" />,
          accent: "bg-amber-50",
          tone: d.out_of_stock > 0 ? "warn" : "default",
        },
      ];
  }
}

/**
 * The stat strip that sits above a page's table.
 *
 * Figures cover every location the signed-in user is granted; the server decides
 * which those are, so this component never has to know about permissions.
 */
export default function StatStrip({ page }: { page: StatsPage }) {
  const [data, setData] = useState<Numbers | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats?page=${page}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.error) setFailed(true);
        else setData(json.data as Numbers);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [page]);

  // A stat strip is a convenience above the real content; if it cannot load,
  // stay out of the way rather than pushing an error banner over the table.
  if (failed) return null;

  return (
    <section className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {!data
        ? [0, 1, 2, 3].map((i) => <StatTileSkeleton key={i} />)
        : tilesFor(page, data).map((t) => (
            <StatTile
              key={t.label}
              label={t.label}
              value={t.value}
              sub={t.sub}
              icon={t.icon}
              accent={t.accent}
              tone={t.tone}
            />
          ))}
    </section>
  );
}
