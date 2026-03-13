import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      location_id,
      first_name,
      last_name,
      email_address,
      phone,
      sex,
      service,
      date_and_time,
      dob,
      address,
    } = body;

    // Call the Supabase Edge Function with service role key
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase service role key' },
        { status: 500 }
      );
    }

    const response = await fetch('https://yktnfcrxtujyoabjtdff.supabase.co/functions/v1/create-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
      },
      body: JSON.stringify({
        location_id,
        first_name,
        last_name,
        email_address,
        phone,
        sex,
        service,
        date_and_time,
        dob: dob || null,
        address: address || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Edge function error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to create appointment' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in create appointment API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
