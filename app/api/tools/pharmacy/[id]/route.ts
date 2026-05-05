import { NextResponse } from 'next/server';
import { dbSync } from '@/utils/sync/directDbSync';
import { getServiceRoleSupabase } from '@/utils/supabase/service-role-client';

/**
 * UPDATE PHARMACY
 */
export const PUT = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  const supabase = getServiceRoleSupabase();
  const id = Number(params.id); // 🔑 ensure integer

  try {
    const body = await req.json();
    const {
      name,
      address,
      city,
      state,
      zip_code,
      zipcode,
      phone_number,
      phone,
      delivers,
      opening_hours,
      is_active,
    } = body;

    const updateData = {
      name,
      address,
      city: city || null,
      state,
      zip_code: zip_code || zipcode,
      phone_number: phone_number || phone,
      delivers,
      opening_hours,
      is_active,
    };

    const { data, error } = await supabase
      .from('pharmacy')
      .update(updateData)
      .eq('id', id)
      .select(); // ✅ no .single()

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    // 🔄 Sync to child database
    dbSync.syncUpdate('pharmacy', id, data[0]);

    return NextResponse.json(
      {
        success: true,
        data: data[0], // return the updated row
        message: 'Pharmacy updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating pharmacy:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
};

/**
 * DELETE PHARMACY (Hard Delete)
 */
export const DELETE = async (
  _req: Request,
  { params }: { params: { id: string } }
) => {
  const supabase = getServiceRoleSupabase();
  const id = Number(params.id); // 🔑 ensure integer

  try {
    const { data, error } = await supabase
      .from('pharmacy')
      .delete()
      .eq('id', id)
      .select(); // ✅ no .single()

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Pharmacy not found' },
        { status: 404 }
      );
    }

    // 🔄 Sync to child database
    dbSync.syncDelete('pharmacy', id);

    return NextResponse.json(
      {
        success: true,
        message: 'Pharmacy deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting pharmacy:', error);
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
};
