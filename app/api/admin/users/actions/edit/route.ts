import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {

    const supabaseAdmin: any = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );
    const { roleId = 1, locationIds, fullName, password, id } = await req.json();

    try {
        await supabaseAdmin
            .from('profiles')
            .update({ role_id: roleId, full_name: fullName })
            .eq('id', id)

        const userLocations = locationIds.map((locationId: number) => ({
            profile_id: id,
            location_id: locationId,
        }));

        await supabaseAdmin.from('user_locations').delete()
        .eq('profile_id', id)

        await supabaseAdmin.from('user_locations').insert(userLocations);

        return NextResponse.json(
            { success: true, message: 'User details has been updated' },
            { status: 200 }
        );
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}