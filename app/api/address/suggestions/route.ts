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

    const authId = process.env.SMARTY_AUTH_ID;
    const authToken = process.env.SMARTY_AUTH_TOKEN;

    if (!authId || !authToken) {
        return NextResponse.json({ 
            success: false,
            error: 'Smarty credentials not configured' 
        }, { status: 500 });
    }

    try {
        // Call Smarty US Autocomplete API
        const url = `https://us-autocomplete-pro.api.smarty.com/lookup?auth-id=${authId}&auth-toke