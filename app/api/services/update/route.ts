import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { table, post_data } = await req.json();

    // Extract ID and prepare data for update
    const { id, ...dataToUpdate } = post_data;

    // Update the service
    const { data, error } = await supabase
      .from(table)
      .update(dataToUpdate)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json(
        { 
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Service updated successfully',
      data: data
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        type: 'unexpected_error'
      },
      { status: 500 }
    );
  }
}