"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Daily takings for the last fortnight.
 *
 * Bars, not a line: each day is a discrete total, and a line between them would
 * imply a reading in between. One series, so one hue and no legend — the panel
 * title says what is plotted.
 *
 * Today's bar is short because the day is unfinished, not because trade
 * collapsed. That is said in the panel subtitle rather than by painting today a
 * different colour: a de-emphasis step light enough to read as "partial" fails
 * both the lightness band and 3:1 contrast against this surface, and a second
 * hue would imply a second series.
 *
 * Quiet days arrive as explicit zeros from the query; dropping them would tilt
 * the trend.
 */
export type TrendPoint = { day: string; label: string; revenue: number; items: number };

const SERIES = "#2a78d6";
const GRID = "#e8e8e6";
const AXIS_TEXT = "#52514e";

const money0 = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{p.label}</p>
      <p className="mt-0.5 text-slate-600">
        {money0(p.revenue)} · {p.items.toLocaleString("en-US")} item
        {p.items === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  const allZero = data.every((d) => !d.revenue);

  if (!data.length || allZero) {
    return (
      <p className="flex h-[220px] items-center justify-center text-sm text-slate-500">
        No sales recorded in the last 14 days.
      </p>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            tick={{ fill: AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
          />
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(42,120,214,0.06)" }} />
          <Bar dataKey="revenue" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
