import { NextRequest, NextResponse } from 'next/server';
import { fetchMapboxAddressSuggestions, isMapboxConfigured } from '@/utils/mapboxAddress';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    if (!search) {
        return NextResponse.json({ error: 'Search parameter is required' }, { status: 400 });
    }

    if (!isMapboxConfigured()) {
        return NextResponse.json({ error: 'MAPBOX_ACCESS_TOKEN is not configured' }, { status: 500 });
    }

    const suggestions = await fetchMapboxAddressSuggestions(search, 5);
    return NextResponse.json({ suggestions });
}
