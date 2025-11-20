"use client"

import React, { useState } from "react";
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
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const StaffControlsPage: React.FC = () => {
  const { t } = useTranslation(translationConstant.CONTROLS);
  const { locations, update_loading } = useLocationClinica();
  const [fullName, setFullName] = useState("");
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewLocationId, setViewLocationId] = useState<number | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // load staff for viewLocationId
  React.useEffect(() => {
    const load = async () => {
      if (!viewLocationId) {
        setStaffList([]);
        return;
      }
      try {
        setLoadingStaff(true);
        // staff.location_id is now stored as an array — fetch rows where the array contains the selected location id
        const { data, error } = await (supabase as any)
          .from('staff')
          .select('*')
          .contains('location_id', [String(viewLocationId)]);

        if (error) {
          console.error('Error fetching staff list', error);
          setStaffList([]);
          return;
        }

        setStaffList(data || []);
      } catch (err) {
        console.error('Error fetching staff list', err);
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    load();
  }, [viewLocationId]);

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
        console.error("API error creating staff:", payload);
        toast.error(payload?.error || "Failed to create staff");
      } else {
        toast.success("Staff created successfully");
        setFullName("");
        setLocationIds([]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create staff");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLocation = (id: string) => {
    setLocationIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  return (
    <main className="flex-1 space-y-4 h-[80dvh] dark:bg-[#0e1725]">
      <Card className="w-full dark:bg-[#0e1725] dark:border-gray-700">
        <CardHeader className="dark:bg-[#0e1725]">
          <CardTitle className="dark:text-white">{t("Staff") || "Staff"}</CardTitle>
        </CardHeader>
        <CardContent className="dark:bg-[#0e1725]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location(s)</label>
                    <div>
                      <div className="w-full rounded border bg-white text-sm p-2 max-h-64 overflow-auto">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">Select one or more locations</span>
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => setLocationIds(locations?.map((l: any) => String(l.id)) || [])}
                          >
                            Select all
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
                  <Button type="submit" disabled={submitting} className="bg-blue-600">
                    {submitting ? "Saving..." : "Create Staff"}
                  </Button>
                  <Button type="button" onClick={() => { setFullName(""); setLocationIds([]); }} className="bg-gray-300">
                    Reset
                  </Button>
                </div>
              </form>
            </div>

            <div className="md:col-span-1 border rounded p-4 bg-gray-50 dark:bg-[#0e1725]">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">View staff by location</label>
                <Select value={viewLocationId ? String(viewLocationId) : ""} onValueChange={(v) => setViewLocationId(v ? Number(v) : null)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {locations?.map((loc: any) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>
                          {loc.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-auto">
                {loadingStaff ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : staffList.length === 0 ? (
                  <div className="text-sm text-gray-500">No staff for this location</div>
                ) : (
                  staffList.map((s: any) => (
                    <div key={s.id} className="p-2 border-b last:border-b-0">
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-xs text-gray-500">ID: {s.id}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default StaffControlsPage;
