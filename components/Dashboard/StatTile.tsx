"use client";

import type { ReactNode } from "react";

/**
 * A stat tile: one number, its name, and a line of context.
 *
 * Deliberately plain. These sit above dense tables, so anything with a plot or a
 * strong fill competes with the rows underneath — the number is the whole point.
 * `tone` is reserved for a genuine warning (out of stock, awaiting approval) and
 * always ships with an icon, never colour alone.
 */
export type Tone = "default" | "warn";

export function StatTile({
  label,
  value,
  sub,
  icon,
  accent = "bg-slate-50",
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold leading-none text-slate-900">{value}</p>
      {sub && (
        <p className={`mt-1.5 text-xs ${tone === "warn" ? "font-medium text-amber-700" : "text-slate-500"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />
    </div>
  );
}
