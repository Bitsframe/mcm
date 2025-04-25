import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = supabaseCreateClient();
    const { fullName, email, profileImage } = await req.json();

    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select()
      .eq('id', user.id)
      .single();

    let result;
    
    if (existingProfile) {
      result = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          email: email,
          profile_pictures: profileImage
        })
        .eq('id', user.id)
        .select();
    } else {
      result = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          email: email,
          profile_pictures: profileImage
        })
        .select();
    }

    if (result.error) {
      console.error('Profile update error:', result.error);
      return NextResponse.json(
        { message: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      data: result.data[0]
    });

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 