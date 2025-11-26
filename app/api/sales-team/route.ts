import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { location_id, members, valid_from } = body;

    if (!location_id || !members) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    // Get the current user from the cookie-aware server client
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Close any currently open team for the location (valid_to IS NULL)
    try {
      await supabase
        .from('sales_team')
        .update({ valid_to: now })
        .eq('location_id', location_id)
        .is('valid_to', null);
    } catch (e) {
      // continue even if closing previous team fails
      console.error('Error closing previous sales_team', e);
    }

    // Normalize members to strings to match DB array types, then insert
    const membersNormalized = Array.isArray(members) ? members.map((m: any) => String(m)) : [];

    const insertPayload = {
      members: membersNormalized,
      location_id,
      valid_from: valid_from ?? now,
      valid_to: null,
      auth_member: user.id,
      auth_email: user.email ?? null,
    } as any;

    const { data, error } = await supabase
      .from('sales_team')
      .insert(insertPayload)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, rows: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
