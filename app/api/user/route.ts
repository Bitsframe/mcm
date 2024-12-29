import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';
import { rolePermissions } from "@/utils/permissions";

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
    try {

        const supabase = supabaseCreateClient()
        const sessionData: any = await supabase.auth.getSession();

        const { data, error } = await supabase.auth.getUser(sessionData.data.session.access_token)

        if (error) {
            return NextResponse.json({ message: 'User not authenticated.' }, { status: 401 });
        }

        const userId = data.user.id;

        const { data: profile, error: profileError } = await supabase
            //  @ts-ignore
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();  // Assuming each user has a unique profile

        // if (profileError) {
        //     return NextResponse.json({ message: profileError.message }, { status: 500 });
        // }

        // Step 3: Get the user's locations from the 'user_locations' table
        const { data: locations, error: locationsError } = await supabase
            .from('user_locations')
            .select('location_id')
            .eq('profile_id', userId);

        // const { data: permissions, error: permissionsError } = await supabase
        //     .from('user_permissions')
        //     .select('*')
        //     .eq('user_id', userId);

        // if (permissionsError) {
        //     return NextResponse.json({ message: permissionsError.message }, { status: 500 });
        // }

        // // Step 5: Get the user's role from the 'roles' table
        const { data: userRole, error: rolesError } = await supabase
            .from('roles')
            .select('*')
            .eq('id', profile.role_id)
            .single();

        // if (rolesError) {
        //     return NextResponse.json({ message: rolesError.message }, { status: 500 });
        // }

        
        
        const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*, permissions(id,permission)')
        .eq('roles', profile.role_id)
        
        const role = userRole?.name || 'admin' 
        
        // const permissions = rolePermissions[role]
        

        const userData = {
            profile,
            locations: locations?.map((location)=>location.location_id),
            permissions:permissions?.map((elem)=>elem.permissions.permission),
            role: role
        };

        // Return the combined data
        return NextResponse.json(
            { success: true, message: 'User details retrieved successfully.', data: userData },
            { status: 200 }
        );

    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ message: error?.message || 'Internal Server Error' }, { status: 500 });
    }
};