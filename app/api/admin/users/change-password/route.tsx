import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const POST = async (req: Request) => {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!!
    );

    try {
        const { id, password } = await req.json();

        if (!id || !password) {
            return NextResponse.json({ message: 'User ID and password are required' }, { status: 400 });
        }

        const { data: user, error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });

        if (error) {
            throw new Error(`Error updating password: ${error.message}`);
        }

        return NextResponse.json({ success: true, message: 'Password updated successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
    }
};
