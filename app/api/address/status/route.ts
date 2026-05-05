import { NextResponse } from 'next/server';

export async function GET() {
    const authId = process.env.SMARTY_AUTH_ID;
    const authToken = process.env.SMARTY_AUTH_TOKEN;

    // Check if credentials are configured
    const isConfigured = !!(authId && authToken);

    return NextResponse.json({ 
        enabled: isConfigured,
        message: isConfigured ? 'Smarty API is configured' : 'Smarty API credentials not found'
    });
}
