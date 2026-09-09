import { NextResponse } from 'next/server';
import { bridgePost, BridgeError } from '@/lib/bridge/client';

/**
 * Soft delete so historical records can keep referencing this patient.
 * mcm-bridge owns the write; this route keeps the validation and response shape.
 */
export const POST = async (req: Request) => {
    try {
        const { patientId } = await req.json();

        if (!patientId) {
            return NextResponse.json(
                { success: false, message: 'Patient ID is required' },
                { status: 400 }
            );
        }

        await bridgePost(`/patients/${patientId}/archive`, { store: 'portal.allpatients' });

        return NextResponse.json(
            { success: true, message: "Patient deleted successfully." },
            { status: 200 }
        );
    } catch (error: any) {
        if (error instanceof BridgeError) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: error.status }
            );
        }
        console.error("Error in patient delete:", error);
        return NextResponse.json(
            { success: false, message: "An error occurred.", error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
};
