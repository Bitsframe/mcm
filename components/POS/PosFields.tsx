"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";

interface PosFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelected?: { id: number; name: string }[];
  onSave: (selected: { id: number; name: string }[]) => void;
  locationId?: number | null;
}

const PosFields: React.FC<PosFieldsModalProps> = ({
  isOpen,
  onClose,
  initialSelected = [],
  onSave,
  locationId,
}) => {
  const [salesPeople, setSalesPeople] = useState<{ id: number; name: string }[]>([]);
  const [selected, setSelected] = useState<{ id: number; name: string }[]>(initialSelected || []);
  const [query, setQuery] = useState("");
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [currentTeam, setCurrentTeam] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    setSelected(initialSelected || []);
  }, [initialSelected]);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!locationId) {
        setSalesPeople([]);
        return;
      }
      try {
        const selectCols = "id, full_name, location_id";
        const { data, error } = await (supabase as any).from("staff").select(selectCols).eq("location_id", locationId);
        if (error) {
          console.error("Failed to fetch staff", error);
          setSalesPeople([]);
          return;
        }
        const rows = (data || []) as any[];
        const arr = rows.map((r: any) => ({ id: r.id, name: r.full_name || "" }));
        setSalesPeople(arr);
      } catch (e) {
        console.error("Error fetching staff", e);
        setSalesPeople([]);
      }
    };

    if (isOpen) fetchStaff();
  }, [locationId, isOpen]);

  // fetch current active team (where valid_to IS NULL) for this location and resolve member names
  useEffect(() => {
    const fetchCurrentTeam = async () => {
      setCurrentTeam([]);
      if (!isOpen || !locationId) return;
      try {
        const { data: teamRows, error: teamErr } = await (supabase as any)
          .from('sales_team')
          .select('members')
          .eq('location_id', locationId)
          .is('valid_to', null)
          .limit(1);
        if (teamErr) {
          console.error('[PosFields] error fetching current sales_team', teamErr);
          return;
        }
        const team = (teamRows && teamRows[0]) as any;
        if (!team || !team.members || team.members.length === 0) return;

        // members may be stored as text array; coerce to numbers
        const memberIds = (team.members || []).map((m: any) => Number(m)).filter(Boolean);
        if (memberIds.length === 0) return;

        const { data: staffRows, error: staffErr } = await (supabase as any)
          .from('staff')
          .select('id, full_name')
          .in('id', memberIds);
        if (staffErr) {
          console.error('[PosFields] error fetching staff for current team', staffErr);
          return;
        }

        const staff = (staffRows || []) as any[];
        // preserve order of memberIds
        const mapped = memberIds.map((id: number) => {
          const s = staff.find((x) => Number(x.id) === Number(id));
          return { id, name: s?.full_name ?? String(id) };
        });
        setCurrentTeam(mapped);
      } catch (e) {
        console.error('[PosFields] unexpected error fetching current team', e);
      }
    };

    fetchCurrentTeam();
  }, [isOpen, locationId]);

  useEffect(() => {
    const fetchAuth = async () => {
      if (!isOpen) return;
      try {
        // Try getSession (v2)
        if (supabase.auth && typeof (supabase.auth as any).getSession === "function") {
          const { data: sessionData } = await (supabase.auth as any).getSession();
          const userId = sessionData?.session?.user?.id ?? null;
          if (userId) {
            setAuthUserId(userId);
            return;
          }
        }

        // Try getUser (v2)
        if (supabase.auth && typeof (supabase.auth as any).getUser === "function") {
          const { data } = await (supabase.auth as any).getUser();
          setAuthUserId(data?.user?.id ?? null);
          return;
        }

        // Try user() (v1)
        if (supabase.auth && typeof (supabase.auth as any).user === "function") {
          const user = (supabase.auth as any).user();
          setAuthUserId(user?.id ?? null);
          return;
        }

        setAuthUserId(null);
      } catch (e) {
        console.error("[PosFields] error fetching auth user id:", e);
        setAuthUserId(null);
      }
    };

    fetchAuth();
  }, [isOpen]);

  const toggleSelect = (person: { id: number; name: string }) => {
    if (selected.find((s) => s.id === person.id)) setSelected(selected.filter((s) => s.id !== person.id));
    else setSelected([...selected, person]);
  };

  const handlePersonClick = async (person: { id: number; name: string }) => {
    toggleSelect(person);
    // also attempt to log auth id (no-op if not present)
    try {
      if (supabase.auth && typeof (supabase.auth as any).getUser === "function") {
        const { data } = await (supabase.auth as any).getUser();
        console.log("[PosFields] current auth user id:", data?.user?.id ?? null);
      } else if (supabase.auth && typeof (supabase.auth as any).user === "function") {
        const user = (supabase.auth as any).user();
        console.log("[PosFields] current auth user id:", user?.id ?? null);
      }
    } catch (e) {
      console.error("[PosFields] error logging auth id:", e);
    }
  };

  const handleSave = () => {
    (async () => {
      try {
        if (!locationId) {
          console.error('[PosFields] Cannot save: no location selected');
          return;
        }

        const memberIds = selected.map((s) => s.id);
        const now = new Date().toISOString();

        console.debug('[PosFields] saving sales_team for location', locationId, { memberIds, now });

        // 1) check for existing open sales_team for this location (valid_to IS NULL)
        const { data: openRows, error: selError } = await (supabase as any)
          .from('sales_team')
          .select('id')
          .eq('location_id', locationId)
          .is('valid_to', null)
          .limit(1);

        if (selError) {
          console.error('[PosFields] error checking open sales_team', selError);
          // still attempt to continue
        }

        if (openRows && openRows.length > 0) {
          const openId = (openRows[0] as any).id;
          console.debug('[PosFields] found open sales_team id, closing it:', openId);
          const { error: updErr } = await (supabase as any)
            .from('sales_team')
            .update({ valid_to: now })
            .eq('id', openId);
          if (updErr) console.error('[PosFields] error closing previous sales_team', updErr);
        }

        // 2) insert new sales_team record
        const insertPayload = {
          members: memberIds,
          location_id: locationId,
          valid_from: now,
          valid_to: null,
        } as any;

        const { data: insData, error: insErr } = await (supabase as any).from('sales_team').insert(insertPayload).select();
        if (insErr) {
          console.error('[PosFields] error inserting new sales_team', insErr);
        } else {
          console.debug('[PosFields] inserted sales_team', insData);
        }

        // call parent onSave with selected (ids + names) as before
        onSave(selected);
        onClose();
      } catch (e) {
        console.error('[PosFields] unexpected error when saving sales_team', e);
      }
    })();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="bg-white dark:bg-gray-800 rounded p-6 w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Sales Person</h3>
              <p className="text-xs text-gray-500">Select one or more staff from this location.</p>
            </div>
            <div className="text-xs text-gray-600">
              Auth ID: <span className="font-mono text-xs">{authUserId ?? "Not logged in"}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Left: search + list */}
          <div className="md:col-span-2 flex flex-col">
            <label className="block text-sm font-medium mb-2">Sales Person Name</label>
            {/* Current active team for this location */}
            {currentTeam.length > 0 ? (
              <div className="mb-3 p-2 bg-gray-50 border rounded">
                <div className="text-sm font-medium mb-1">Current Team</div>
                <div className="text-sm">
                  {currentTeam.map((m) => (
                    <div key={m.id} className="py-1">{m.name}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-3 text-xs text-gray-500">No active team for this location</div>
            )}

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sales person..."
              className="w-full border rounded p-2 text-sm mb-2"
            />

            <div className="border rounded flex-1 overflow-auto p-2 bg-white">
              {salesPeople.length === 0 && <div className="p-2 text-xs text-gray-500">No staff found for this location</div>}

              {salesPeople
                .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
                .map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={!!selected.find((s) => s.id === person.id)} onChange={() => handlePersonClick(person)} />
                      <span className="text-sm">{person.name}</span>
                    </div>
                    <button className="text-xs text-gray-500" onClick={() => handlePersonClick(person)}>
                      {selected.find((s) => s.id === person.id) ? "Remove" : "Add"}
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Right: selected summary */}
          <div className="md:col-span-1 border rounded p-3 bg-gray-50 flex flex-col">
            <div className="mb-2 font-medium">Selected</div>
            <div className="flex-1 overflow-auto">
              {selected.length === 0 && <div className="text-xs text-gray-500">No selection</div>}
              {selected.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2">
                  <div className="text-sm">{s.name}</div>
                  <button className="text-xs text-red-500" onClick={() => setSelected(selected.filter((x) => x.id !== s.id))}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-2">Tips</div>
              <div className="text-xs text-gray-600">Use the search to filter staff, then click Add/Remove.</div>
            </div>
          </div>
        </div>

        <div className="mt-4 sticky bottom-0 z-10 bg-white dark:bg-gray-800 border-t py-3 flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-300 rounded" onClick={onClose}>
            Cancel
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosFields;
