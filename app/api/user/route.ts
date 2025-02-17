import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

interface Profile {
    id: string;
    role_id: string;
    // Add other profile fields as needed
}

interface UserPermission {
    permissions: {
        id: string;
        permission: string;
    };
}

interface UserRole {
    id: string;
    name: string;
}

export const GET = async (req: Request) => {
    const supabase = supabaseCreateClient();

    try {
        // Get session and user in a single operation
        const { data, error: sessionError } = await supabase.auth.getUser();
        
        if (sessionError || !data) {
            return NextResponse.json({ message: 'User not authenticated.' }, { status: 401 });
        }

        // Parallel execution of database queries
        const [
            profileResult,
            locationsResult,
            permissionsResult
        ] = await Promise.all([
            supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single(),
            
            supabase
                .from('user_locations')
                .select('location_id')
                .eq('profile_id', data.user.id),
            
            supabase
                .from('user_permissions')
                .select('*, permissions(id,permission)')
                .eq('roles', data.user.id)
        ]);

        // Early error checking
        if (profileResult.error) {
            return NextResponse.json({ message: 'Error fetching profile.' }, { status: 404 });
        }

        // Only fetch role if profile exists and has role_id
        const roleResult = profileResult.data.role_id ? 
            await supabase
                .from('roles')
                .select('*')
                .eq('id', profileResult.data.role_id)
                .single() : 
            { data: { name: 'admin' } };

        // Construct response data with null checks and type casting
        const userData = {
            profile: profileResult.data,
            locations: locationsResult.data?.map(location => location.location_id) ?? [],
            permissions: permissionsResult.data?.map(elem => elem.permissions.permission) ?? [],
            role: roleResult.data?.name ?? 'admin'
        };

        return NextResponse.json(
            { 
                success: true, 
                message: 'User details retrieved successfully.', 
                data: userData 
            }, 
            { status: 200 }
        );

    } catch (error) {
        console.error('User details error:', error);
        return NextResponse.json(
            { 
                success: false,
                message: error instanceof Error ? error.message : 'Internal Server Error'
            }, 
            { status: 500 }
        );
    }
};