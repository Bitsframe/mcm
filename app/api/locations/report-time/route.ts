import { NextResponse } from 'next/server';
import { bridgePatch, BridgeError } from '@/lib/bridge/client';

/**
 * The settings screen used to write `Locations.report_time` straight from the browser
 * with the publishable key. Writes go through mcm-bridge now, so it calls this route.
 */
export const PATCH = async (req: Request) => {
    try {
        const { locationId, reportTime } = await req.json();

        const id = Number(locationId);
        if (!Number.isFinite(id) || id <= 0) {
            return NextResponse.json(
                { success: false, message: 'A valid locationId is required' },
                { status: 400 }
            );
        }

        const data = await bridgePatch(`/locations/${id}/report-time`, {
            report_time: reportTime ?? null,
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        if (error instanceof BridgeError) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: error.status }
            );
        }
        console.error('Error updating report time:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update report time' },
            { status: 500 }
        );
    }
};
