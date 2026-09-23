import { requireUser } from '@/utils/server/require-auth';
import { NextRequest, NextResponse } from 'next/server';

import { classifyError } from '@/utils/logging/safe-log';
export async function POST(request: NextRequest) {
  const gate = await requireUser();
  if (gate.response) return gate.response;

    try {
        const body = await request.json();
        

        // Validate required fields
        if (!body.name || !body.address) {
            return NextResponse.json({
                success: false,
                error: 'Validation error',
                message: 'Name and address are required'
            }, { status: 400 });
        }

        // Call the external pharmacy check API
        const response = await fetch('https://mcm-pharmacy-production.up.railway.app/api/pharmacy/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: body.name,
                phoneNumber: body.phoneNumber || '',
                address: {
                    streetAddress: body.address.streetAddress || '',
                    zipcode: body.address.zipcode || '',
                    state: body.address.state || ''
                }
            })
        });

        console.log('📡 External API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ External API error:', errorText);
            
            return NextResponse.json({
                success: false,
                error: 'External API error',
                message: `API returned ${response.status}: ${errorText}`
            }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('❌ Error in pharmacy check:', classifyError(error));
        
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error.message || 'Failed to check pharmacy'
        }, { status: 500 });
    }
}
