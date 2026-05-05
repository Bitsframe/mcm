import { NextResponse } from 'next/server';
import { dbSync } from '@/utils/sync/directDbSync';
import { getServiceRoleSupabase } from '@/utils/supabase/service-role-client';

export const GET = async () => {
  const supabase = getServiceRoleSupabase();

  try {
    const { data: forms, error } = await supabase
      .from('forms')
      .select('id, name, is_active, created_at, content')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: forms }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  const supabase = getServiceRoleSupabase();

  try {
    const body = await req.json();
    const { name, content } = body;

    if (!name) {
      return NextResponse.json({ message: 'Form name is required' }, { status: 400 });
    }

    // Store HTML content in JSONB format
    const contentJson = {
      html: content || '',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('forms')
      .insert({
        name,
        content: contentJson,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // 🔥 SYNC TO CHILD DATABASE
    dbSync.syncCreate('forms', data);

    return NextResponse.json({ success: true, data, message: 'Form created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating form:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const PUT = async (req: Request) => {
  const supabase = getServiceRoleSupabase();

  try {
    const body = await req.json();
    const { id, is_active, name, content } = body;

    const updateData: any = {};
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (name !== undefined) updateData.name = name;
    if (content !== undefined) {
      // Store HTML content in JSONB format
      updateData.content = {
        html: content,
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 🔥 SYNC TO CHILD DATABASE
    dbSync.syncUpdate('forms', id, data);

    return NextResponse.json({ success: true, data, message: 'Form updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating form:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};

export const DELETE = async (req: Request) => {
  const supabase = getServiceRoleSupabase();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Form ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 🔥 SYNC TO CHILD DATABASE
    dbSync.syncDelete('forms', id);

    return NextResponse.json({ success: true, message: 'Form deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
};
