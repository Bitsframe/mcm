import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


export const POST = async (req: Request) => {

    const supabaseAdmin: any = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { email, roleId = 1, locationIds, fullName, password } = await req.json();

    try {
        // let { data: user, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
        const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || null,
            email_confirm: true,
        });

        if (error) throw error;

        const userId = user.user.id;

        await supabaseAdmin
            .from('profiles')
            .insert({ id: userId, role_id: roleId, full_name: fullName, email });

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
        // Step 1: Fetch all users from auth.users
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) throw usersError;

        // Step 2: Fetch profiles related to these users
        const userIds = users.map((user: any) => user.id); // Extract user IDs
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                full_name,
                created_at,
                active,
                role_id,
                email,
                user_locations(location_id, Locations(title))
            `)
            .in('id', userIds); // Filter by the IDs of the users we fetched

        if (profilesError) throw profilesError;

        // Step 3: Fetch roles data
        const { data: roles, error: rolesError } = await supabaseAdmin
            .from('roles')
            .select('id, name');

        if (rolesError) throw rolesError;

        // Step 4: Create a map for role names based on role_id
        const roleMap = roles.reduce((acc: any, role: any) => {
            acc[role.id] = role.name;
            return acc;
        }, {});

        // Step 5: Merge data from auth.users and profiles
        const profilesMap = profiles.reduce((acc: any, profile: any) => {
            acc[profile.id] = profile;
            return acc;
        }, {});

        const transformedUsers = users.map((user: any) => {
            const profile = profilesMap[user.id] || {}; // Get the profile data, if available
            return {
                id: user.id,
                email: user.email,
                full_name: profile.full_name || 'No Name',
                role: roleMap[profile.role_id] || 'Unknown Role', // Map role name using role_id
                created_at: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A',
                active: profile.active || false,
                locations: profile.user_locations
                    ? profile.user_locations.map((loc: any) => loc.Locations?.title).join(', ')
                    : 'No Locations'
            };
        });

        // Step 6: Return the combined data
        return NextResponse.json({ success: true, data: transformedUsers }, { status: 200 });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: error?.message || 'Internal Server Error', error }, { status: 500 });
    }
};



