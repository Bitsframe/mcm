import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const PUT = async (req: Request, { params }: { params: { id: string } }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
  const { id } = params;

  try {
    const body = await req.json();
    const { name, address, zipcode, phone, delivers, opening_hours } = body;

    const { data, error } = await supabase
      .from('pharmacy')
      .update({
        name,
        address,
        zipcode,
        phone,
        delivers,
        opening_hours,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: 'Pharmacy updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating pharmacy:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const DELETE = async (req: Request, { params }: { params: { id: string } }) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
  );
  const { id } = params;

  try {
    // Soft delete
    const { error } = await supabase
      .from('pharmacy')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Pharmacy deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting pharmacy:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};
