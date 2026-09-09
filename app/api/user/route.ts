import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { bridgePost, bridgePatch, BridgeError, type PatientCreateResult } from '@/lib/bridge/client';

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

        const resolvedAddress =
            patientData.address ?? patientData.streetAddress ?? null;
        const resolvedDob =
            patientData.dob ?? patientData.dateOfBirth ?? null;

        // mcm-bridge owns both Supabase projects and the rule for where a patient is
        // stored. `Portal` selects the walk-in / POS rule, which writes this app's
        // patient list only. Matching an existing patient (email or phone within the
        // same location) and updating them happens there too.
        let created: PatientCreateResult;
        try {
            created = await bridgePost<PatientCreateResult>('/patients', {
                source: 'Portal',
                first_name: patientData.firstname,
                last_name: patientData.lastname,
                email: patientData.email ?? null,
                phone: patientData.phone ?? null,
                gender: patientData.gender ?? null,
                date_of_birth: resolvedDob,
                street_address: resolvedAddress,
                location_id: Number(patientData.locationid),
                note: patientData?.note ?? null,
                onsite: patientData.onsite ?? false,
                treatmenttype: patientData.treatmenttype ?? null,
            });
        } catch (err) {
            const message =
                err instanceof BridgeError ? err.message : 'Failed to save patient';
            return NextResponse.json(
                { success: false, message },
                { status: err instanceof BridgeError ? err.status : 500 }
            );
        }

        const stored = created.stores.find((store) => store.store === 'portal.allpatients');
        if (!stored?.ok) {
            return NextResponse.json(
                { success: false, message: stored?.reason ?? 'Failed to save patient' },
                { status: 400 }
            );
        }

        if (stored.action === 'updated') {
            return NextResponse.json(
                { success: true, message: "User updated successfully.", data: [{ id: stored.id }] },
                { status: 200 }
            );
        }

        {
            const patientId = stored.id;


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
                    // The bridge created the patient, so it undoes it too.
                    await bridgePost('/patients/rollback', {
                        store: 'portal.allpatients',
                        id: patientId,
                    }).catch((rollbackErr) =>
                        console.error('[user] patient rollback failed:', rollbackErr)
                    );
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
                { success: true, message: "User added successfully.", data: [{ id: patientId }] },
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

        // Updates go through the bridge too — this app does not write the table.
        let data: unknown;
        try {
            data = await bridgePatch(`/patients/${Number(patientData.id)}`, {
                store: 'portal.allpatients',
                first_name: patientData.firstname,
                last_name: patientData.lastname,
                email: patientData.email,
                phone: patientData.phone,
                note: patientData?.note,
                street_address: patientData?.streetAddress,
                date_of_birth: patientData?.dateOfBirth,
                gender: patientData?.gender,
            });
        } catch (err) {
            const message =
                err instanceof BridgeError ? err.message : 'Failed to update patient';
            return NextResponse.json(
                { success: false, message },
                { status: err instanceof BridgeError ? err.status : 500 }
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