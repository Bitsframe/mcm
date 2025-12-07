import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { location_id } = await req.json();

    if (!location_id) {
      return NextResponse.json(
        { error: 'location_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get authenticated user for logging/validation
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update the active sales_team for this location: set valid_to to NOW()
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('sales_team')
      .update({ valid_to: now })
      .eq('location_id', location_id)
      .is('valid_to', null) // Only update the active team (no valid_to set)
      .select();

    if (error) {
      console.error('[Reset Team] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to reset team' },
        { status: 500 }
      );
    }

    console.log('[Reset Team] Successfully reset team for location:', location_id, 'Updated rows:', data?.length || 0);

    return NextResponse.json({
      success: true,
      message: 'Team reset successfully',
      updated: data?.length || 0,
    });
  } catch (e) {
    console.error('[Reset Team] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
