import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
    const supabase = supabaseCreateClient();

    try {
        // Get session and user in a single operation
        const { data, error: sessionError } = await supabase.auth.getUser();

        if (sessionError || !data) {
            return NextResponse.json({ message: 'User not authenticated.' }, { status: 401 });
        }

        const profileResult = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (!profileResult || profileResult.error) {
            console.error('Error fetching profile:', profileResult.error);
            return;
        }

        const [locationsResult, permissionsResult] = await Promise.all([
            supabase
                .from('user_locations')
                .select('location_id')
                .eq('profile_id', data.user.id),

            supabase
                .from('user_permissions')
                .select('*, permissions(id, permission)')
                .eq('roles', profileResult.data.role_id)
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

export const POST = async (req: Request) => {
    try {
        const supabase = supabaseCreateClient();
        const patientData = await req.json();

        console.log('patientData from api:', patientData);

        const { data, error } = await supabase
            .from("allpatients")
            .insert([
                {
                    locationid:patientData.locationid,
                    lastvisit: patientData.lastvisit,
                    onsite: patientData.onsite,
                    firstname: patientData.firstname,
                    lastname: patientData.lastname,
                    gender: patientData.gender,
                    email: patientData.email,
                    phone: patientData.phone,
                    treatmenttype: patientData.treatmenttype,
                }
            ]);

        if (error) {
            console.log("ERROR ->",error);
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        console.log("DATA",data);
        return NextResponse.json(
            {
                success: true,
                message: "User added successfully.",
                data,
            },
            { status: 200 }
        );
    } catch (error:any) {
        console.log("ERROR ->",error);
        return NextResponse.json(
            { success: false, message: "An error occurred.", error: error.message  || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export const PUT = async (req: Request) => {
    try {
        const supabase = supabaseCreateClient();
        const patientData = await req.json();

        console.log('patientData:', patientData);

        const { data, error } = await supabase
            .from("allpatients")
            .update({
                firstname: patientData.firstname,
                lastname: patientData.lastname,
                email: patientData.email,
                phone: patientData.phone,
                treatmenttype: patientData.treatmenttype,
            })
            .eq("id", Number(patientData.id))
            .select();

        if (error) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "User details updated successfully.",
                data,
            },
            { status: 200 }
        );
    } catch (error:any) {
        return NextResponse.json(
            { success: false, message: "An error occurred.", error: error.message  || "Internal Server Error" },
            { status: 500 }
        );
    }
};