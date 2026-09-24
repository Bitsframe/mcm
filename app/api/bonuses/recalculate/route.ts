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
 * Body: { business_date | from + to: 'YYYY-MM-DD', location_ids?: number[] }
 *
 * A range is capped at 31 days, because the Bonus page calls this on open and a
 * wide range would mean hundreds of location-days per page load.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ymd = (v: any) =>
      typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;

    const single = ymd(body?.business_date);
    const from = single ?? ymd(body?.from);
    const to = single ?? ymd(body?.to) ?? from;

    if (!from || !to) {
      return NextResponse.json(
        { error: 'business_date, or from and to, are required as YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const dates: string[] = [];
    for (let d = new Date(from + 'T00:00:00Z'); d <= new Date(to + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
      if (dates.length > 31) {
        return NextResponse.json(
          { error: 'That range is longer than 31 days. Narrow it and try again.' },
          { status: 400 }
        );
      }
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

    // Only clinics that actually sold something in the window can have changed.
    // Without this the Bonus page would recalculate every location for every day
    // on each open, which on 20-odd clinics is hundreds of pointless calls.
    let active = targets;
    try {
      const { data: sold } = await (admin as any)
        .from('bonus_sale_lines')
        .select('location_id')
        .gte('business_date', from)
        .lte('business_date', to)
        .in('location_id', targets);

      if (Array.isArray(sold)) {
        const seen = new Set(sold.map((r: any) => Number(r.location_id)));
        active = targets.filter((id: number) => seen.has(id));
      }
    } catch {
      // Fall back to recalculating everything rather than skipping work.
    }
    const failed: { location_id: number; business_date: string; message: string }[] = [];
    let ok = 0;

    for (const locationId of active) {
      for (const businessDate of dates) {
        const { error } = await (admin as any).rpc('recalculate_bonus_for_date', {
          p_location_id: locationId,
          p_business_date: businessDate,
        });
        if (error) {
          console.error('[api/bonuses/recalculate] failed', locationId, businessDate, error);
          failed.push({ location_id: locationId, business_date: businessDate, message: error.message });
        } else {
          ok += 1;
        }
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      from,
      to,
      locations: active.length,
      locations_considered: targets.length,
      recalculated: ok,
      failed,
    });
  } catch (err: any) {
    console.error('[api/bonuses/recalculate] error', classifyError(err));
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
