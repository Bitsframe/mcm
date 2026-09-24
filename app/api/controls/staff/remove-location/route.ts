import { NextResponse } from 'next/server';
import { classifyError } from '@/utils/logging/safe-log';
import { requireSuperAdmin } from '@/utils/server/require-auth';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Unassigns a staff member from one clinic.
 *
 * This is deliberately not a delete. The person keeps their row and their bonus
 * history, they simply stop counting towards that clinic's daily split from the
 * next calculation onward. Past payouts are untouched; run the recalculation for
 * a past day if you need it restated.
 *
 * Body: { staff_id: number, location_id: number }
 */
export async function POST(req: Request) {
  const gate = await requireSuperAdmin();
  if (gate.response) return gate.response;

  try {
    const body = await req.json().catch(() => ({}));
    const staffId = Number(body?.staff_id);
    const locationId = Number(body?.location_id);

    if (!Number.isFinite(staffId) || !Number.isFinite(locationId)) {
      return NextResponse.json(
        { error: 'staff_id and location_id are required' },
        { status: 400 }
      );
    }

    const admin = await createAdminClient();

    const { data: staff, error: readErr } = await (admin as any)
      .from('staff')
      .select('id, full_name, location_id')
      .eq('id', staffId)
      .single();

    if (readErr || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // location_id is a bigint[]; compare as numbers so "6" and 6 both match.
    const current: number[] = (staff.location_id ?? []).map((v: any) => Number(v));
    if (!current.includes(locationId)) {
      return NextResponse.json(
        { error: 'That staff member is not assigned to this location' },
        { status: 409 }
      );
    }

    const next = current.filter((id) => id !== locationId);

    const { error: writeErr } = await (admin as any)
      .from('staff')
      .update({ location_id: next })
      .eq('id', staffId);

    if (writeErr) {
      console.error('[api/controls/staff/remove-location] update failed', writeErr);
      return NextResponse.json({ error: writeErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      staff_id: staffId,
      removed_location: locationId,
      remaining_locations: next,
      // Worth surfacing: someone with no clinics shares no bonus anywhere.
      unassigned_everywhere: next.length === 0,
    });
  } catch (err: any) {
    console.error('[api/controls/staff/remove-location]', classifyError(err));
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
