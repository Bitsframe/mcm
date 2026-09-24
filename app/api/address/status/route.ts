import { requireUser } from '@/utils/server/require-auth';
import { NextResponse } from 'next/server';
import { isMapboxConfigured } from '@/utils/mapboxAddress';

/** Whether address autocomplete can run — Mapbox is the only provider. */
export async function GET() {
  const gate = await requireUser();
  if (gate.response) return gate.response;

    const enabled = isMapboxConfigured();

    return NextResponse.json({
        enabled,
        message: enabled
            ? 'Address lookup available'
            : 'MAPBOX_ACCESS_TOKEN not configured'
    });
}
