import { NextResponse } from 'next/server';
import { getServiceRoleSupabase } from '@/utils/supabase/service-role-client';

export const POST = async (req: Request) => {
    try {
        const supabase = getServiceRoleSupabase();
        const { patientId } = await req.json();

        console.log('Received patientId:', patientId);

        if (!patientId) {
            return NextResponse.json(
                { success: false, message: 'Patient ID is required' },
                { status: 400 }
            );
        }

        // Soft delete so historical records can keep referencing this patient.
        const { error } = await supabase
            .from("allpatients")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", patientId);

        if (error) {
            console.error("Error soft deleting patient:", error);
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        console.log('Successfully soft deleted patient:', patientId);

        return NextResponse.json(
            {
                success: true,
                message: "Patient deleted successfully.",
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error in patient delete:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred.", error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}; 