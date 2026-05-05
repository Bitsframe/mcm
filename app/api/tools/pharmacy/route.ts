import { NextResponse } from 'next/server';
import { dbSync } from '@/utils/sync/directDbSync';
import { getServiceRoleSupabase } from '@/utils/supabase/service-role-client';

export const GET = async () => {
  const supabase = getServiceRoleSupabase();

  try {
    const { data: pharmacies, error } = await supabase
      .from('pharmacy')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: pharmacies }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  const supabase = getServiceRoleSupabase();

  try {
    const body = await req.json();
    const { name, address, state, zip_code, zipcode, phone_number, phone, delivers, opening_hours, is_active, city } = body;

    const insertData = {
      name,
      address,
      city: city || null,
      state,
      zip_code: zip_code || zipcode, // Support both field names
      phone_number: phone_number || phone, // Support both field names
      delivers: delivers || false,
      opening_hours,
      is_active: typeof is_active === "boolean" ? is_active : true
    };

    const { data, error } = await supabase
      .from('pharmacy')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // 🔄 Sync to child database
    dbSync.syncCreate('pharmacy', data);

    return NextResponse.json({ success: true, data, message: 'Pharmacy created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pharmacy:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};
