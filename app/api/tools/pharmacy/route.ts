import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const GET = async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: pharmacies, error } = await supabase
      .from('pharmacy')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: pharmacies }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await req.json();
    const { name, address, state, zipcode, phone, delivers, opening_hours, is_active } = body;

    const { data, error } = await supabase
      .from('pharmacy')
      .insert({
        name,
        address,
        state,
        zipcode,
        phone,
        delivers: delivers || false,
        opening_hours,
        is_active: typeof is_active === "boolean" ? is_active : true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Pharmacy created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pharmacy:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};
