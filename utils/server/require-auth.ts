import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdmin } from '@/utils/server/roles';

/**
 * Session gate for API routes.
 *
 * middleware.ts deliberately skips `/api/`, so a route handler is the only place
 * an API request is ever checked. Without one of these, every handler below runs
 * for an anonymous caller — several of them hold the service-role key.
 *
 * Usage, as the first statement of the handler:
 *
 *   const gate = await requireUser();
 *   if (gate.response) return gate.response;
 *
 * `gate.supabase` is the same cookie-scoped client, so callers that already
 * needed one can use it instead of building a second.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase,
      response: NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }),
    };
  }

  return { user, supabase, response: null as null };
}

/**
 * As above, but also requires the super admin role.
 *
 * For handlers that create, edit or delete accounts, staff and orders. A session
 * check alone would let any signed-in staff member call them, and most of these
 * routes use the service-role key, which bypasses row-level security.
 */
export async function requireSuperAdmin() {
  const gate = await requireUser();
  if (gate.response) return gate;

  if (!(await isSuperAdmin(gate.supabase, gate.user!.id))) {
    return {
      ...gate,
      response: NextResponse.json(
        { error: 'This action requires an administrator account' },
        { status: 403 }
      ),
    };
  }

  return gate;
}
