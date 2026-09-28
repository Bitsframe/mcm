"use client"

import React, { useState, useContext } from "react";
import { AuthContext } from "@/context";
import { LocationPicker } from "@/components/ui/location-picker";
import { classifyError, logError } from '@/utils/logging/safe-log';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocationClinica } from "@/hooks/useLocationClinica";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { supabase } from "@/services/supabase";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const StaffControlsPage: React.FC = () => {
  const { t } = useTranslation(translationConstant.CONTROLS);
  const { userRole } = useContext(AuthContext);
  // Creating people and assigning them to clinics is an administrator action,
  // and the assignment decides who the daily bonus is split between. The API
  // enforces the same rule, so this is a courtesy, not the control.
  const isSuperAdmin = String(userRole ?? "").trim().toLowerCase() === "super admin";
  const { locations, update_loading } = useLocationClinica();
  const [fullName, setFullName] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewLocationId, setViewLocationId] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Everyone when no location is picked; otherwise only that clinic's staff.
  React.useEffect(() => {
    const load = async () => {
      try {
        setLoadingStaff(true);
        let query = (supabase as any).from('staff').select('*').order('full_name');
        // staff.location_id is an array — match rows whose array contains the selected id
        if (viewLocationId) query = query.contains('location_id', [String(viewLocationId)]);
        const { data, error } = await query;

        if (error) {
          console.error('Error fetching staff list', classifyError(error));
          setStaffList([]);
          return;
        }

        setStaffList(data || []);
      } catch (err) {
        console.error('Error fetching staff list', classifyError(err));
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    load();
  }, [viewLocationId, reloadKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !locationIds || locationIds.length === 0) {
      toast.error("Please provide full name and at least one location");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/controls/staff/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, location_id: locationIds }),
      });
      const payload = await res.json();
      if (!res.ok) {
        // `payload` is the API body; the toast below still shows its message to
        // the user. Only the log stream is narrowed.
        logError('staff.create_failed', { status: res.status });
        toast.error(payload?.error || "Failed to create staff");
      } else {
        toast.success("Staff created successfully");
        setFullName("");
        setLocationIds([]);
        setReloadKey((k) => k + 1);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create staff");
    } finally {
      setSubmitting(false);
    }
  };

  const [removingId, setRemovingId] = useState<number | null>(null);

  // Unassign, not delete: the person keeps their row and their bonus history,
  // they just stop counting towards this clinic's daily split from here on.
  const removeFromLocation = async (staffId: number, staffName: string) => {
    if (!viewLocationId) return;
    const locationName =
      (locations ?? []).find((l: any) => Number(l.id) === Number(viewLocationId))?.title ??
      `location ${viewLocationId}`;
    if (!window.confirm(`Remove ${staffName} from ${locationName}? They keep their record and past bonuses.`)) return;

    try {
      setRemovingId(staffId);
      const res = await fetch("/api/controls/staff/remove-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ staff_id: staffId, location_id: viewLocationId }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        logError('staff.remove_location_failed', { status: res.status });
        toast.error(payload?.error || "Could not remove them from this location");
        return;
      }
      setStaffList((prev) => prev.filter((row: any) => Number(row.id) !== staffId));
      toast.success(
        payload?.unassigned_everywhere
          ? `${staffName} removed. They are no longer assigned to any clinic.`
          : `${staffName} removed from ${locationName}.`
      );
    } catch (err) {
      console.error('Error removing staff from location', classifyError(err));
      toast.error("Could not remove them from this location");
    } finally {
      setRemovingId(null);
    }
  };

  // Delete flow: confirm first; if they have bonus history the API refuses and
  // the modal offers unassigning them from every clinic instead.
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; hasHistory: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const locationTitles = (ids: any[] | null | undefined) =>
    (ids ?? [])
      .map((id) => (locations ?? []).find((l: any) => Number(l.id) === Number(id))?.title)
      .filter(Boolean) as string[];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id, name, hasHistory } = deleteTarget;
    try {
      setDeleting(true);
      const res = await fetch("/api/controls/staff/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ staff_id: id, unassign_all: hasHistory }),
      });
      const payload = await res.json().catch(() => null);
      if (res.status === 409 && payload?.has_bonus_history) {
        setDeleteTarget({ id, name, hasHistory: true });
        return;
      }
      if (!res.ok) {
        logError('staff.delete_failed', { status: res.status });
        toast.error(payload?.error || "Could not delete this staff member");
        return;
      }
      toast.success(hasHistory ? `${name} removed from all clinics.` : `${name} deleted.`);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error('Error deleting staff', classifyError(err));
      toast.error("Could not delete this staff member");
    } finally {
      setDeleting(false);
    }
  };

  const toggleLocation = (id: string) => {
    setLocationIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="rounded-xl border border-separator bg-surface p-6 text-body text-label-2">
        Staff management is limited to administrator accounts.
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-4 h-[80dvh]">
      <Card className="w-full">
        <CardHeader className="">
          <CardTitle className="">{t("CT_k34")}</CardTitle>
        </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("CT_k35")}</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("CT_k36")}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t("CT_k37")}</label>
                    <div>
                      <div className="w-full rounded border bg-white text-sm p-2 max-h-64 overflow-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">{t("CT_k38")}</span>
                          <button
                            type="button"
                            className="text-xs text-brand-600 hover:underline"
                            onClick={() => setLocationIds(locations?.map((l: any) => String(l.id)) || [])}
                          >
                            {t("CT_k39")}
                          </button>
                        </div>
                        <div className="space-y-1">
                          {locations?.map((loc: any) => {
                            const id = String(loc.id);
                            const checked = locationIds.includes(id);
                            return (
                              <label key={id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleLocation(id)}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm">{loc.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="bg-brand-600 hover:bg-brand-700">
                    {submitting ? t("CT_k55") : t("CT_k45")}
                  </Button>
                  <Button type="button" onClick={() => { setFullName(""); setLocationIds([]); }} className="bg-gray-300 hover:bg-gray-400">
                    {t("CT_k44")}
                  </Button>
                </div>
              </form>
            </div>

            <div className="md:col-span-1 border rounded p-4 bg-gray-50">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">{t("CT_k40")}</label>
                <LocationPicker
                  className="w-full"
                  locations={locations ?? []}
                  value={viewLocationId ? String(viewLocationId) : ""}
                  onChange={(v) => setViewLocationId(v ? Number(v) : null)}
                  placeholder={t("CT_k41")}
                />
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {loadingStaff ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : staffList.length === 0 ? (
                  <div className="text-sm text-gray-500">{viewLocationId ? t("CT_k42") : "No staff yet"}</div>
                ) : (
                  <>
                  <div className="text-xs text-gray-500 px-2">
                    {staffList.length} {viewLocationId ? "at this location" : "staff in total"}
                  </div>
                  {staffList.map((s: any) => {
                    const clinics = locationTitles(s.location_id);
                    return (
                    <div key={s.id} className="flex items-center justify-between gap-2 p-2 border-b last:border-b-0">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.full_name}</div>
                        <div className="text-xs text-gray-500 truncate" title={clinics.join(", ")}>
                          ID: {s.id} · {clinics.length ? (clinics.length === 1 ? clinics[0] : `${clinics.length} clinics`) : "No clinic"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {viewLocationId && (
                          <button
                            type="button"
                            disabled={removingId === Number(s.id)}
                            onClick={() => removeFromLocation(Number(s.id), s.full_name)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                          >
                            {removingId === Number(s.id) ? "Removing…" : "Remove"}
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Delete ${s.full_name}`}
                          onClick={() => setDeleteTarget({ id: Number(s.id), name: s.full_name, hasHistory: false })}
                          className="rounded-md border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/[0.06]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {deleteTarget && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-white p-6 shadow-mac-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-50 p-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-headline text-label">
                  {deleteTarget.hasHistory ? `${deleteTarget.name} can't be deleted` : `Delete ${deleteTarget.name}?`}
                </h3>
                <p className="mt-1 text-body text-label-2">
                  {deleteTarget.hasHistory
                    ? "They have bonus payouts on record, and deleting them would lose that history. You can remove them from all clinics instead — they stop sharing any daily bonus, and their past payouts stay."
                    : "This permanently deletes this staff member. This can't be undone."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={deleting} onClick={confirmDelete}>
                {deleting ? "Working…" : deleteTarget.hasHistory ? "Remove from all clinics" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default StaffControlsPage;
