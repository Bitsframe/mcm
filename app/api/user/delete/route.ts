import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';

export const POST = async (req: Request) => {
    try {
        const supabase = supabaseCreateClient();
        const { patientId } = await req.json();

        console.log('Received patientId:', patientId);

        if (!patientId) {
            return NextResponse.json(
                { success: false, message: 'Patient ID is required' },
                { status: 400 }
            );
        }

        // Check if patient has any orders
        const orders = await fetch_content_service({
            table: 'orders',
            matchCase: { key: 'patient_id', value: patientId }
        });

        if (orders && orders.length > 0) {
            return NextResponse.json(
                { success: false, message: 'Cannot delete patient with existing orders/sales history' },
                { status: 400 }
            );
        }

        // Check if patient has any transaction history
        const transactions = await fetch_content_service({
            table: 'transaction_history',
            matchCase: { key: 'patient_id', value: patientId }
        });

        if (transactions && transactions.length > 0) {
            return NextResponse.json(
                { success: false, message: 'Cannot delete patient with existing transaction history' },
                { status: 400 }
            );
        }

        // Check if patient has any credit audit records
        const creditAudit = await fetch_content_service({
            table: 'credit_audit',
            matchCase: { key: 'patient_id', value: patientId }
        });

        if (creditAudit && creditAudit.length > 0) {
            return NextResponse.json(
                { success: false, message: 'Cannot delete patient with existing credit balance' },
                { status: 400 }
            );
        }

        // Check if patient has any appointments
        // First get patient details to check by email and phone
        const patientDetails = await supabase
            .from("allpatients")
            .select("email, phone")
            .eq("id", patientId)
            .single();

        if (patientDetails.data) {
            const appointments = await supabase
                .from("Appoinments")
                .select("*")
                .or(`email_address.eq.${patientDetails.data.email},phone.eq.${patientDetails.data.phone}`);

            if (appointments.data && appointments.data.length > 0) {
                return NextResponse.json(
                    { success: false, message: 'Cannot delete patient with existing appointments' },
                    { status: 400 }
                );
            }
        }

        // If all checks pass, perform soft delete
        const { error } = await supabase
            .from("allpatients")
            .delete()
            .eq("id", patientId);

        if (error) {
            console.error("Error deleting patient:", error);
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        console.log('Successfully deleted patient:', patientId);

        return NextResponse.json(
            {
                success: true,
                message: "Patient deleted successfully.",
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error in soft delete:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred.", error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}; 