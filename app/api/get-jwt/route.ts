import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not logged in' }), { status: 401 });
  }
  return new Response(JSON.stringify({ token: session.access_token }), { status: 200 });
} 