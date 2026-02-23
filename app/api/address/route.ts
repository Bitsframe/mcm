import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    if (!search) {
        return NextResponse.json({ error: 'Search parameter is required' }, { status: 400 });
    }

    const authId = process.env.SMARTY_AUTH_ID;
    const authToken = process.env.SMARTY_AUTH_TOKEN;

    if (!authId || !authToken) {
        return NextResponse.json({ error: 'Smarty credentials not configured' }, { status: 500 });
    }

    try {
        // Call Smarty US Autocomplete API
        const url = `https://us-autocomplete-pro.api.smarty.com/lookup?auth-id=${authId}&auth-token=${authToken}&search=${encodeURIComponent(search)}&max_results=5`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Smarty API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching address suggestions:', error);
        return NextResponse.json({ error: 'Failed to fetch address suggestions' }, { status: 500 });
    }
}
