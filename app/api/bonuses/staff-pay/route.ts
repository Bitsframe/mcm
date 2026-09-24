import { NextResponse } from 'next/server';
import { classifyError } from '@/utils/logging/safe-log';
import { requireSuperAdmin } from '@/utils/server/require-auth';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Marks a staff member's outstanding bonus paid.
 *
 * Administrators only, and it records who did it in `paid_by`. The filters are
 * the same ones the table was showing, so the amount settled is the amount on
 * screen rather than everything that person has ever been owed.
 *
 * Body: { staff_ids: number[], location_ids?: number[], from?, to? }
 */
export async function POST(req: Request) {
  const gate = await requireSuperAdmin();
  if (gate.response) return gate.response;

  try {
    const body = await req.json().catch(() => ({}));

    const staffIds = Array.isArray(body?.staff_ids)
      ? body.staff_ids.map((n: any) => Number(n)).filter(Number.isFinite)
      : [];

    if (staffIds.length === 0) {
      return NextResponse.json({ error: 'staff_ids is required' }, { status: 400 });
    }

    const date = (v: any) =>
      typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

    // Never settle a clinic the caller cannot see.
    const { data: granted } = await gate.supabase
      .from('user_locations')
      .select('location_id')
      .eq('profile_id', gate.user!.id);

    const allowed = (granted ?? [])
      .map((r: any) => Number(r.location_id))
      .filter(Number.isFinite);

    const asked = Array.isArray(body?.location_ids)
      ? body.location_ids.map((n: any) => Number(n)).filter(Number.isFinite)
      : null;

    const locationIds = asked ? asked.filter((id: number) => allowed.includes(id)) : allowed;

    if (locationIds.length === 0) {
      return NextResponse.json(
        { error: 'No locations you have access to were selected' },
        { status: 403 }
      );
    }

    const admin = await createAdminClient();
    const { data, error } = await (admin as any).rpc('bonus_mark_staff_paid', {
      p_staff_ids: staffIds,
      p_location_ids: locationIds,
      p_from: date(body?.from),
      p_to: date(body?.to),
      p_paid_by: gate.user!.id,
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      success: true,
      rows_paid: Number(result?.rows_paid ?? 0),
      amount_paid: Number(result?.amount_paid ?? 0),
    });
  } catch (err: any) {
    console.error('[api/bonuses/staff-pay]', classifyError(err));
    return NextResponse.json(
      { error: err?.message ?? 'Failed to record the payment' },
      { status: 500 }
    );
  }
}
