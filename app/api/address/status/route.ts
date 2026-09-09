import { NextResponse } from 'next/server';
import { isMapboxConfigured } from '@/utils/mapboxAddress';

/** Whether address autocomplete can run — Mapbox is the only provider. */
export async function GET() {
    const enabled = isMapboxConfigured();

    return NextResponse.json({
        enabled,
        message: enabled
            ? 'Address lookup available'
            : 'MAPBOX_ACCESS_TOKEN not configured'
    });
}
