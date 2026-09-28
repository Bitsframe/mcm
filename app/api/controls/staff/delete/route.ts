import { NextResponse } from 'next/server';
import { classifyError } from '@/utils/logging/safe-log';
import { requireSuperAdmin } from '@/utils/server/require-auth';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Deletes a staff member, or unassigns them from every clinic.
 *
 * A person with bonus payouts is never hard-deleted: those rows are money
 * history, and depending on the environment the foreign key either blocks the
 * delete or would cascade it away. They get a 409 instead, and the caller can
 * retry with `unassign_all` so they stop sharing any clinic's daily bonus while
 * their history stays intact.
 *
 * Body: { staff_id: number, unassign_all?: boolean }
 */
export async function POST(req: Request) {
  const gate = await requireSuperAdmin();
  if (gate.response) return gate.response;

  try {
    const body = await req.json().catch(() => ({}));
    const staffId = Number(body?.staff_id);
    const unassignAll = body?.unassign_all === true;

    if (!Number.isFinite(staffId)) {
      return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
    }

    const admin = await createAdminClient();

    const { data: staff, error: readErr } = await (admin as any)
      .from('staff')
      .select('id, full_name')
      .eq('id', staffId)
      .single();

    if (readErr || !staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (unassignAll) {
      const { error } = await (admin as any)
        .from('staff')
        .update({ location_id: [] })
        .eq('id', staffId);
      if (error) {
        console.error('[api/controls/staff/delete] unassign failed', classifyError(error));
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, staff_id: staffId, unassigned_everywhere: true });
    }

    const { count, error: countErr } = await (admin as any)
      .from('individual_bonus')
      .select('id', { count: 'exact', head: true })
      .eq('staff_id', staffId);

    if (countErr) {
      console.error('[api/controls/staff/delete] bonus check failed', classifyError(countErr));
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          error: 'This person has bonus history, so they cannot be deleted.',
          has_bonus_history: true,
          bonus_rows: count,
        },
        { status: 409 }
      );
    }

    const { error: delErr } = await (admin as any).from('staff').delete().eq('id', staffId);
    if (delErr) {
      console.error('[api/controls/staff/delete] delete failed', classifyError(delErr));
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, staff_id: staffId, deleted: true });
  } catch (err: any) {
    console.error('[api/controls/staff/delete]', classifyError(err));
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
