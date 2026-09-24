import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Whether the signed-in account is a super admin.
 *
 * Read from profiles.role_id -> roles.name on every call rather than trusted
 * from the client, because this is the gate on company-wide figures: sales,
 * revenue and stock. A client-supplied role would let any account ask for them.
 *
 * Fails closed. If the role cannot be read, the answer is "no".
 */
export async function isSuperAdmin(
  supabase: SupabaseClient<any, any, any>,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    const name = (data as any)?.roles?.name;
    return String(name ?? '').trim().toLowerCase() === 'super admin';
  } catch {
    return false;
  }
}
