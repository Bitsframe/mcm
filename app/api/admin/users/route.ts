import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


export const POST = async (req: Request) => {

    const supabaseAdmin: any = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { email, roleId = 1, locationIds, fullName, password } = await req.json();

    try {
        let { data: user, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
        // const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
        //     email,
        //     password: password || null,
        //     email_confirm: true,
        // });

        if (error) throw error;

        const userId = user.user.id;

        await supabaseAdmin
            .from('profiles')
            .insert({ id: userId, role_id: roleId, full_name: fullName });

        const userLocations = locationIds.map((locationId: number) => ({
            profile_id: userId,
            location_id: locationId,
        }));

        await supabaseAdmin.from('user_locations').insert(userLocations);

        if (!password) {
            await supabaseAdmin.auth.resetPasswordForEmail(email, {
                redirectTo: 'http://localhost:3000/set-password',
            });
        }


        return NextResponse.json(
            { success: true, message: 'User created successfully.' },
            { status: 200 }
        );
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = async () => {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                id, 
                full_name, 
                created_at, 
                active, 
                roles(name), 
                user_locations(location_id, Locations(title)),
                auth.users(id,email)
            `);

        if (error) throw error;

        // Transform the data
        const users = profiles.map((profile: any) => ({
            id: profile.id,
            full_name: profile.full_name,
            email: profile.auth?.email || 'No Email', // Fetch email from the linked auth.user table
            role: profile.roles?.name || 'Unknown Role',
            created_at: new Date(profile.created_at).toLocaleDateString(),
            active: profile.active,
            locations: profile.user_locations.map((loc: any) => loc.Locations?.title).join(', ') || 'No Locations',
        }));

        return NextResponse.json({ success: true, data: users }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
    }
};