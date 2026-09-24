import { NextResponse } from 'next/server';
import { classifyError } from '@/utils/logging/safe-log';
import { requireUser } from '@/utils/server/require-auth';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export type StaffBonusRow = {
  staff_id: number;
  full_name: string;
  locations: string[];
  location_ids: number[];
  last_paid_date: string | null;
  pending: number;
  paid: number;
  pending_rows: number;
};

/**
 * One row per staff member: where they work, when they were last paid, and what
 * is still owed.
 *
 * Only current-model payouts are counted. Rows from the retired pipeline, and
 * days that were later recalculated, are excluded by the SQL function — showing
 * them would put money on screen that nobody should ever pay out.
 *
 * Query: staff_ids, location_ids (comma separated), from, to (YYYY-MM-DD).
 */
export async function GET(req: Request) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

  try {
    const url = new URL(req.url);

    const ids = (key: string) => {
      const raw = url.searchParams.get(key);
      if (!raw) return null;
      const list = raw
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => Number.isFinite(n));
      return list.length ? list : null;
    };

    const date = (key: string) => {
      const raw = url.searchParams.get(key);
      return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    };

    // Only the caller's own clinics, whatever they asked for.
    const { data: granted } = await gate.supabase
      .from('user_locations')
      .select('location_id')
      .eq('profile_id', gate.user!.id);

    const allowed = (granted ?? [])
      .map((r: any) => Number(r.location_id))
      .filter(Number.isFinite);

    const asked = ids('location_ids');
    const locationIds = asked ? asked.filter((id) => allowed.includes(id)) : allowed;

    if (locationIds.length === 0) {
      return NextResponse.json({ data: [], locations_counted: 0 });
    }

    const admin = await createAdminClient();
    const { data, error } = await (admin as any).rpc('bonus_staff_summary', {
      p_staff_ids: ids('staff_ids'),
      p_location_ids: locationIds,
      p_from: date('from'),
      p_to: date('to'),
    });

    if (error) throw error;

    return NextResponse.json({
      data: (data ?? []) as StaffBonusRow[],
      locations_counted: locationIds.length,
    });
  } catch (err: any) {
    console.error('[api/bonuses/staff-summary]', classifyError(err));
    return NextResponse.json(
      { error: err?.message ?? 'Failed to load staff bonuses' },
      { status: 500 }
    );
  }
}
