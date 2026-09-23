import { NextResponse } from 'next/server';
import { classifyError } from '@/utils/logging/safe-log';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Recalculates the bonus for one business date.
 *
 * The calculation functions are revoked from anon and authenticated, so this is
 * the only way to run them outside the nightly job. It is idempotent: running it
 * twice for the same day produces the same figures, never double payouts.
 *
 * Body: { business_date: 'YYYY-MM-DD', location_ids?: number[] }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessDate = String(body?.business_date ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
      return NextResponse.json(
        { error: 'business_date is required as YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Who is asking, and what may they touch.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single();

    const roleName = String((profile as any)?.roles?.name ?? '').toLowerCase();
    let allowed = roleName === 'super admin';

    if (!allowed && profile?.role_id != null) {
      const { data: perms } = await supabase
        .from('user_permissions')
        .select('permissions(permission)')
        .eq('roles', profile.role_id);
      allowed = (perms ?? []).some((row: any) =>
        ['control', 'bonus'].includes(String(row?.permissions?.permission ?? '').toLowerCase())
      );
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Not permitted to recalculate bonuses' }, { status: 403 });
    }

    // Only the caller's own locations, whatever they asked for.
    const { data: granted } = await supabase
      .from('user_locations')
      .select('location_id')
      .eq('profile_id', user.id);

    const grantedIds = new Set(
      (granted ?? []).map((r: any) => Number(r.location_id)).filter(Number.isFinite)
    );

    const requested = Array.isArray(body?.location_ids)
      ? body.location_ids.map((n: any) => Number(n)).filter(Number.isFinite)
      : null;

    const targets = (requested && requested.length > 0
      ? requested.filter((id: number) => grantedIds.has(id))
      : Array.from(grantedIds)
    );

    if (targets.length === 0) {
      return NextResponse.json(
        { error: 'No locations you have access to were selected' },
        { status: 403 }
      );
    }

    // The functions are service-role only by design.
    const admin = await createAdminClient();
    const done: number[] = [];
    const failed: { location_id: number; message: string }[] = [];

    for (const locationId of targets) {
      const { error } = await (admin as any).rpc('recalculate_bonus_for_date', {
        p_location_id: locationId,
        p_business_date: businessDate,
      });
      if (error) {
        console.error('[api/bonuses/recalculate] failed for location', locationId, error);
        failed.push({ location_id: locationId, message: error.message });
      } else {
        done.push(locationId);
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      business_date: businessDate,
      recalculated: done,
      failed,
    });
  } catch (err: any) {
    console.error('[api/bonuses/recalculate] error', classifyError(err));
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
