import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { table, post_data } = await req.json();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Extract ID and prepare data for update
    const { id, ...dataToUpdate } = post_data;

    // Update the service
    const { data, error } = await supabase
      .from(table)
      .update(dataToUpdate)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Service update error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Service updated successfully',
      data: data
    });

  } catch (error: any) {
    console.error('Service update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}