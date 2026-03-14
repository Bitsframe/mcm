import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Validation: search parameter is required
    if (!search) {
        return NextResponse.json({ 
            success: false,
            error: 'Search parameter is required' 
        }, { status: 400 });
    }

    // Validation: minimum 3 characters
    if (search.length < 3) {
        return NextResponse.json({ 
            success: false,
            error: 'Search query must be at least 3 characters' 
        }, { status: 400 });
    }

    try {
        // Proxy to Railway API as specified in documentation
        const railwayUrl = `https://mcm-pharmacy-production.up.railway.app/api/address/suggestions?search=${encodeURIComponent(search)}`;
        
        const response = await fetch(railwayUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Railway API responded with status: ${response.status}`);
        }

        const data = await response.json();
        
        // Return the data from Railway API
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching address suggestions from Railway API:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch address suggestions',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}