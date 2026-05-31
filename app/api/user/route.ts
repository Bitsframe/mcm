import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
    const supabase = supabaseCreateClient();

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
            return NextResponse.json({ message: 'User not authenticated.' }, { status: 401 });
        }

        const userId = session.user.id;

        const profileResult = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!profileResult || profileResult.error) {
            console.error('Error fetching profile:', profileResult.error);
            return;
        }

        const [locationsResult, permissionsResult] = await Promise.all([
            supabase
                .from('user_locations')
                .select('location_id')
                .eq('profile_id', userId),

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

        const { data: existingPatients, error: findError } = await supabase
            .from("allpatients")
            .select("*")
            .or(`email.eq.${patientData.email},phone.eq.${patientData.phone}`)
            .eq("locationid", patientData.locationid);

        if (findError) {
            console.log("ERROR ->", findError);
            return NextResponse.json(
                { success: false, message: findError.message },
                { status: 400 }
            );
        }

        const resolvedAddress =
            patientData.address ?? patientData.streetAddress ?? null;
        const resolvedDob =
            patientData.dob ?? patientData.dateOfBirth ?? null;

        if (existingPatients && existingPatients.length > 0) {
            // Update the first matching patient
            const patient = existingPatients[0];
            const { data: updated, error: updateError } = await supabase
                .from("allpatients")
                .update({
                    lastvisit: new Date().toISOString(),
                    email: patientData.email,
                    phone: patientData.phone,
                    note: patientData?.note,
                    address: resolvedAddress,
                    dob: resolvedDob,
                    gender: patientData?.gender,
                    ...(patientData.treatmenttype != null &&
                    patientData.treatmenttype !== ""
                        ? { treatmenttype: patientData.treatmenttype }
                        : {}),
                })
                .eq("id", patient.id)
                .select();

            if (updateError) {
                return NextResponse.json(
                    { success: false, message: updateError.message },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { success: true, message: "User updated successfully.", data: updated },
                { status: 200 }
            );
        } else {
            // Insert new patient
            const { data: inserted, error: insertError } = await supabase
                .from("allpatients")
                .insert([
                    {
                        locationid: patientData.locationid,
                        lastvisit: new Date().toISOString(),
                        onsite: patientData.onsite,
                        firstname: patientData.firstname,
                        lastname: patientData.lastname,
                        gender: patientData.gender,
                        email: patientData.email,
                        phone: patientData.phone,
                        note: patientData?.note,
                        address: resolvedAddress,
                        dob: resolvedDob,
                        treatmenttype: patientData.treatmenttype ?? null,
                    },
                ])
                .select();

            if (insertError) {
                return NextResponse.json(
                    { success: false, message: insertError.message },
                    { status: 400 }
                );
            }

            const newRow = inserted?.[0];
            const patientId = newRow?.id;

            if (
                patientId != null &&
                patientData.create_pos_walkin_appointment === true &&
                patientData.treatmenttype
            ) {
                const appointmentPayload = {
                    location_id: Number(patientData.locationid),
                    patient_id: patientId,
                    first_name: patientData.firstname,
                    last_name: patientData.lastname,
                    email_address: patientData.email ?? null,
                    phone: patientData.phone ?? null,
                    sex: patientData.gender ?? null,
                    dob: resolvedDob,
                    address: resolvedAddress,
                    service: patientData.treatmenttype,
                    in_office_patient: true,
                    new_patient: false,
                    date_and_time: null,
                    text_opt: false,
                    email_opt: false,
                    isApproved: true,
                };

                const admin = createAdminClient();
                const { error: apptError } = await admin
                    .from("Appoinments")
                    .insert([appointmentPayload]);

                if (apptError) {
                    await admin.from("allpatients").delete().eq("id", patientId);
                    return NextResponse.json(
                        {
                            success: false,
                            message: apptError.message,
                            detail: "Failed to create walk-in appointment",
                        },
                        { status: 400 }
                    );
                }
            }

            return NextResponse.json(
                { success: true, message: "User added successfully.", data: inserted },
                { status: 200 }
            );
        }
    } catch (error: any) {
        console.log("ERROR ->", error);
        return NextResponse.json(
            { success: false, message: "An error occurred.", error: error.message || "Internal Server Error" },
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
                note: patientData?.note,
                address: patientData?.streetAddress,
                dob: patientData?.dateOfBirth,
                gender: patientData?.gender,
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