"use client";

import { useEffect, useState } from "react";
import { LocationPicker } from "@/components/ui/location-picker";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import {
  CalendarCheck2,
  DollarSign,
  Package,
  Users,
} from "lucide-react";

type Stats = {
  // null unless the signed-in account is a super admin. The server decides;
  // these are simply absent from the response for everyone else.
  sales: { revenue_month: number; revenue_total: number; orders_month: number } | null;
  appointments: { total: number; month: number; upcoming: number } | null;
  patients: { total: number; month: number };
  warehouse: { products: number; stocked_items: number; out_of_stock: number } | null;
  locations_counted: number;
  restricted?: boolean;
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
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-separator bg-white p-4 shadow-mac-sm transition-shadow hover:shadow-mac">
      <div className="flex items-start justify-between gap-3">
        <span className="text-caption font-semibold uppercase tracking-wide text-label-3">{label}</span>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-title1 leading-none text-label">{value}</p>
      {sub && (
        <p className={`mt-1.5 text-footnote ${warn ? "font-medium text-destructive" : "text-label-2"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-xl border border-separator bg-white p-4 shadow-mac-sm">
      <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-7 w-24 animate-pulse rounded bg-surface-2" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-surface" />
    </div>
  );
}

/**
 * The four figures the clinic opens this page for: sales, appointments, patients
 * and warehouse.
 *
 * Deliberately not tied to the location picked in the sidebar: that one follows
 * the user around the app, while this page opens on every location the signed-in
 * user is granted in user_locations and is narrowed by its own control.
 *
 * `locationId` is owned by the page, because the panels below these tiles answer
 * for the same set of clinics. "" is every granted location.
 */
export default function KpiCards({
  locationId,
  onLocationChange,
}: {
  locationId: string;
  onLocationChange: (id: string) => void;
}) {
  const { locations } = useLocationClinica();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    setError(null);
    setDenied(false);

    const qs = locationId ? `?location_id=${encodeURIComponent(locationId)}` : "";
    fetch(`/api/dashboard/stats${qs}`, { cache: "no-store" })
      .then(async (r) => ({ status: r.status, json: await r.json() }))
      .then(({ status, json }) => {
        if (cancelled) return;
        // A 403 with no location chosen means the account has no locations at
        // all. With one chosen it means that location is not theirs, which is
        // recoverable — keep the picker on screen so they can switch back.
        if (status === 403 && !locationId) setDenied(true);
        else if (json?.error) setError(json.error);
        else setStats(json.data as Stats);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
    };
  }, [locationId]);

  const noGrants = denied || (stats && stats.locations_counted === 0 && !locationId);

  // The header, and with it the picker, stays on screen whatever the figures do.
  // An error that hid the control would strand whoever hit it on the selection
  // that caused it.
  const header = (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-headline text-label">Overview</h2>
      {locations.length > 0 && (
        <LocationPicker
          id="dashboard-location"
          locations={locations}
          value={locationId}
          onChange={onLocationChange}
          allLabel={`All locations (${locations.length})`}
          searchPlaceholder="Search locations…"
        />
      )}
    </div>
  );

  if (noGrants) {
    return (
      <section className="mb-5">
        {header}
        <div className="rounded-xl border border-separator bg-surface p-4 text-body text-label-2">
          No locations are assigned to your account yet, so there are no figures to show. Ask an
          administrator to grant you access.
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-5">
        {header}
        <div className="rounded-xl border border-destructive/20 bg-destructive/[0.06] p-4 text-body text-destructive">
          Could not load dashboard figures: {error}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5">
      {header}

      <div className={`grid gap-3 ${stats?.restricted ? "grid-cols-1 sm:max-w-xs" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"}`}>
        {!stats ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : (
          <>
            {stats.sales && (
              <Card
                label="Sales this month"
                value={money(stats.sales.revenue_month)}
                sub={`${num(stats.sales.orders_month)} sold · ${money(stats.sales.revenue_total)} all time`}
                icon={<DollarSign size={16} className="text-brand-700" />}
                accent="bg-brand-50"
              />
            )}
            {stats.appointments && (
              <Card
                label="Appointments"
                value={num(stats.appointments.month)}
                sub={`this month · ${num(stats.appointments.upcoming)} upcoming · ${num(stats.appointments.total)} all time`}
                icon={<CalendarCheck2 size={16} className="text-brand-700" />}
                accent="bg-brand-50"
              />
            )}
            <Card
              label="Total patients"
              value={num(stats.patients.total)}
              sub={`${num(stats.patients.month)} new this month`}
              icon={<Users size={16} className="text-brand-700" />}
              accent="bg-brand-50"
            />
            {stats.warehouse && (
              <Card
                label="Warehouse"
                value={num(stats.warehouse.products)}
                icon={<Package size={16} className="text-brand-700" />}
                accent="bg-brand-50"
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
