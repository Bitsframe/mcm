"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Filter, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AuthContext } from "@/context";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import { classifyError } from "@/utils/logging/safe-log";

type Row = {
  staff_id: number;
  full_name: string;
  locations: string[];
  location_ids: number[];
  last_paid_date: string | null;
  pending: number;
  paid: number;
  pending_rows: number;
};

const money = (n: number) =>
  Number(n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

const day = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function StaffBonusesPage() {
  const { userRole } = useContext(AuthContext);
  const isSuperAdmin = String(userRole ?? "").trim().toLowerCase() === "super admin";
  const { locations } = useLocationClinica();

  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<number | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  // applied filters
  const [staffIds, setStaffIds] = useState<number[]>([]);
  const [locationIds, setLocationIds] = useState<number[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // the sheet edits a draft, so closing without applying changes nothing
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftStaff, setDraftStaff] = useState<number[]>([]);
  const [draftLocs, setDraftLocs] = useState<number[]>([]);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  // Central-time day, because that is the clinic's business day.
  const centralToday = () =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const centralDaysAgo = (n: number) =>
    new Date(Date.now() - n * 86400000).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

  /**
   * Recalculate before showing the figures, so opening the page is enough to
   * pick up a late sale, a refund or a staff change. The calculation is
   * idempotent, so doing this on every open cannot double-pay anyone: the same
   * day always resolves to the same amounts.
   *
   * With no date filter it covers yesterday and today, the window that
   * realistically still moves; the nightly job owns everything older. A filtered
   * range is recalculated as given, up to the endpoint's 31-day cap.
   */
  const recalculate = useCallback(async () => {
    try {
      setRecalculating(true);
      const res = await fetch("/api/bonuses/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          from: from || centralDaysAgo(1),
          to: to || centralToday(),
          location_ids: locationIds.length ? locationIds : undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        // Not fatal: the stored figures are still shown below.
        console.warn("[bonus/staff] recalculation skipped:", json?.error ?? res.status);
      }
    } catch (e) {
      console.warn("[bonus/staff] recalculation failed", classifyError(e));
    } finally {
      setRecalculating(false);
    }
  }, [from, to, locationIds]);

  const fetchSummary = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (staffIds.length) qs.set("staff_ids", staffIds.join(","));
      if (locationIds.length) qs.set("location_ids", locationIds.join(","));
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);

      const res = await fetch(`/api/bonuses/staff-summary?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Could not load staff bonuses");
        setRows([]);
        return;
      }
      setRows((json?.data ?? []) as Row[]);
    } catch (e) {
      console.error("[bonus/staff] load failed", classifyError(e));
      setError("Could not load staff bonuses");
      setRows([]);
    }
  }, [staffIds, locationIds, from, to]);

  // Show the stored figures straight away, then recalculate and refresh. Doing
  // it the other way round left the table blank behind a long recalculation.
  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    await fetchSummary();
    await recalculate();
    await fetchSummary();
  }, [fetchSummary, recalculate]);

  useEffect(() => {
    load();
  }, [load]);

  // Names are remembered so a chip can still say who is filtered after the
  // table has narrowed to just them.
  const [staffNames, setStaffNames] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!rows?.length) return;
    setStaffNames((prev) => {
      const next = { ...prev };
      rows.forEach((r) => { next[r.staff_id] = r.full_name; });
      return next;
    });
  }, [rows]);

  const locationName = useCallback(
    (id: number) => (locations ?? []).find((l: any) => Number(l.id) === id)?.title ?? `Location ${id}`,
    [locations]
  );

  const rangeLabel =
    from && to ? `${day(from)} – ${day(to)}` : from ? `From ${day(from)}` : to ? `Up to ${day(to)}` : "";

  // The list offered in the filter is whoever currently has bonus rows.
  const staffOptions = useMemo(
    () =>
      (rows ?? [])
        .map((r) => ({ id: r.staff_id, name: r.full_name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows]
  );

  const openSheet = () => {
    setDraftStaff(staffIds);
    setDraftLocs(locationIds);
    setDraftFrom(from);
    setDraftTo(to);
    setSheetOpen(true);
  };

  const applyFilters = () => {
    setStaffIds(draftStaff);
    setLocationIds(draftLocs);
    setFrom(draftFrom);
    setTo(draftTo);
    setSheetOpen(false);
  };

  const clearFilters = () => {
    setDraftStaff([]);
    setDraftLocs([]);
    setDraftFrom("");
    setDraftTo("");
  };

  const activeCount =
    (staffIds.length ? 1 : 0) + (locationIds.length ? 1 : 0) + (from || to ? 1 : 0);

  const pay = async (row: Row) => {
    if (row.pending <= 0) return;
    const scope = from || to ? ` for ${day(from || null)} to ${day(to || null)}` : "";
    if (!window.confirm(`Mark ${money(row.pending)} paid to ${row.full_name}${scope}? This cannot be undone here.`))
      return;

    try {
      setPaying(row.staff_id);
      const res = await fetch("/api/bonuses/staff-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          staff_ids: [row.staff_id],
          location_ids: locationIds.length ? locationIds : undefined,
          from: from || undefined,
          to: to || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(json?.error ?? "Could not record the payment");
        return;
      }
      toast.success(`Paid ${money(json.amount_paid)} to ${row.full_name} across ${json.rows_paid} day(s).`);
      await load();
    } catch (e) {
      console.error("[bonus/staff] pay failed", classifyError(e));
      toast.error("Could not record the payment");
    } finally {
      setPaying(null);
    }
  };

  const totalPending = (rows ?? []).reduce((a, r) => a + Number(r.pending || 0), 0);

  return (
    <main className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title2 text-label">Bonuses</h1>
          <p className="mt-0.5 text-footnote text-label-2">
            {recalculating
              ? "Recalculating…"
              : rows === null
                ? "Loading…"
                : `${rows.length} staff · ${money(totalPending)} outstanding`}
          </p>
        </div>

        <Button type="button" variant="outline" onClick={openSheet} className="gap-2">
          <Filter size={14} className="text-label-3" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 text-caption font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold uppercase tracking-wide text-label-3">Filtered by</span>

          {staffIds.map((id) => (
            <Chip key={`s-${id}`} onClear={() => setStaffIds((p) => p.filter((x) => x !== id))}>
              {staffNames[id] ?? `Staff ${id}`}
            </Chip>
          ))}

          {locationIds.map((id) => (
            <Chip key={`l-${id}`} onClear={() => setLocationIds((p) => p.filter((x) => x !== id))}>
              {locationName(id)}
            </Chip>
          ))}

          {rangeLabel && (
            <Chip onClear={() => { setFrom(""); setTo(""); }}>{rangeLabel}</Chip>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setStaffIds([]); setLocationIds([]); setFrom(""); setTo(""); }}
            className="text-brand-600"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-separator bg-white shadow-mac-sm">
        <Table>
          <TableHeader className="bg-vibrant-white sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[90px]">Staff ID</TableHead>
              <TableHead>Staff name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-[140px]">Last paid</TableHead>
              <TableHead className="w-[140px] text-right">Pending</TableHead>
              <TableHead className="w-[110px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-label-3">
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">{error}</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-label-2">
                  No bonuses to show. Payouts appear here once a clinic has passed its daily goal.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.staff_id}>
                  <TableCell className="tabular-nums text-label-2">{r.staff_id}</TableCell>
                  <TableCell className="font-medium text-label">{r.full_name}</TableCell>
                  <TableCell className="text-label-2">
                    {r.locations.length === 0
                      ? "—"
                      : r.locations.length <= 2
                        ? r.locations.join(", ")
                        : `${r.locations.slice(0, 2).join(", ")} +${r.locations.length - 2}`}
                  </TableCell>
                  <TableCell className="text-label-2">{day(r.last_paid_date)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-label">
                    {money(r.pending)}
                    {r.pending_rows > 0 && (
                      <span className="ml-1.5 text-caption font-normal text-label-3">
                        {r.pending_rows}d
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isSuperAdmin || r.pending <= 0 || paying === r.staff_id}
                      onClick={() => pay(r)}
                      title={!isSuperAdmin ? "Administrators only" : undefined}
                    >
                      {paying === r.staff_id ? <Loader2 size={13} className="animate-spin" /> : "Pay"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter</SheetTitle>
          </SheetHeader>

          <div className="mt-5 space-y-6">
            <CheckList
              title="Staff members"
              empty="No staff with bonuses yet"
              options={staffOptions.map((o) => ({ id: o.id, label: o.name }))}
              selected={draftStaff}
              onToggle={(id) =>
                setDraftStaff((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
              }
              onAll={() =>
                setDraftStaff(draftStaff.length === staffOptions.length ? [] : staffOptions.map((o) => o.id))
              }
              allSelected={draftStaff.length === staffOptions.length && staffOptions.length > 0}
            />

            <CheckList
              title="Locations"
              empty="No locations"
              options={(locations ?? []).map((l: any) => ({ id: Number(l.id), label: l.title }))}
              selected={draftLocs}
              onToggle={(id) =>
                setDraftLocs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
              }
              onAll={() =>
                setDraftLocs(
                  draftLocs.length === (locations ?? []).length ? [] : (locations ?? []).map((l: any) => Number(l.id))
                )
              }
              allSelected={draftLocs.length === (locations ?? []).length && (locations ?? []).length > 0}
            />

            <div>
              <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-label-3">Date range</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="block text-footnote text-label-2">From</span>
                  <Input
                    type="date"
                    value={draftFrom}
                    max={draftTo || undefined}
                    onChange={(e) => setDraftFrom(e.target.value)}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="block text-footnote text-label-2">To</span>
                  <Input
                    type="date"
                    value={draftTo}
                    min={draftFrom || undefined}
                    onChange={(e) => setDraftTo(e.target.value)}
                  />
                </label>
              </div>
              <p className="mt-2 text-footnote text-label-3">
                Leave both empty for everything. Pending and Pay both follow this range.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
            <Button type="button" onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </main>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-separator bg-surface px-2.5 py-0.5 text-footnote text-label">
      <span className="max-w-[16rem] truncate">{children}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove this filter"
        className="text-label-3 transition-colors hover:text-destructive"
      >
        <X size={12} />
      </button>
    </span>
  );
}

function CheckList({
  title,
  options,
  selected,
  onToggle,
  onAll,
  allSelected,
  empty,
}: {
  title: string;
  options: { id: number; label: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  onAll: () => void;
  allSelected: boolean;
  empty: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-caption font-semibold uppercase tracking-wide text-label-3">{title}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onAll} className="h-6 px-2 text-brand-600">
          {allSelected ? "Clear all" : "Select all"}
        </Button>
      </div>
      <div className="max-h-56 overflow-auto rounded-lg border border-separator p-1">
        {options.length === 0 ? (
          <p className="px-2 py-3 text-center text-footnote text-label-3">{empty}</p>
        ) : (
          options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface">
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={() => onToggle(o.id)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="truncate text-body text-label">{o.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
