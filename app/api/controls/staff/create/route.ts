import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, location_id } = body;
    if (!full_name || !location_id) {
      return NextResponse.json({ error: 'full_name and location_id are required' }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase.from('staff').insert({ full_name, location_id }).select();
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
