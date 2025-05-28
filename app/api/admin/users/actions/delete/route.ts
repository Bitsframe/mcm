import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


export const POST = async (req: Request) => {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            throw new Error(`Error deleting profile: ${profileError.message}`);
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
    }
};
