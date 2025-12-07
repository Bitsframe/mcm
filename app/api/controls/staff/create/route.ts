import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, location_id } = body;
    if (!full_name || !location_id) {
      return NextResponse.json({ error: 'full_name and location_id are required' }, { status: 400 });
    }

    // Normalize location_id to an array. Accept either a single value or an array.
    let normalizedLocationIds: string[] = [];
    if (Array.isArray(location_id)) {
      normalizedLocationIds = location_id.map((v: any) => String(v));
    } else {
      normalizedLocationIds = [String(location_id)];
    }

    // For debugging, log the incoming payload (will appear in server logs)
    console.log('[create-staff] payload', { full_name, location_id: normalizedLocationIds });

    const supabase = createClient();

    const { data, error } = await supabase.from('staff').insert({ full_name, location_id: normalizedLocationIds }).select();
    if (error) {
      console.error('[create-staff] supabase error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (e: any) {
    console.error('[create-staff] unexpected error', e);
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
