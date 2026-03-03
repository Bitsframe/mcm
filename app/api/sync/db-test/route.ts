import { NextResponse } from 'next/server';
import { dbSync } from '@/utils/sync/directDbSync';

/**
 * Simple test endpoint for database sync
 */

export const GET = async () => {
  try {
    const childConfigured = !!(process.env.CHILD_SUPABASE_URL && process.env.CHILD_SUPABASE_SERVICE_ROLE_KEY);
    const parentConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    return NextResponse.json({
      success: true,
      message: 'Database sync status',
      data: {
        parentDatabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
          configured: parentConfigured
        },
        childDatabase: {
          url: process.env.CHILD_SUPABASE_URL || 'Not configured',
          configured: childConfigured
        },
        syncReady: parentConfigured && childConfigured
      }
    }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Database sync test failed',
      error: error.message
    }, { status: 500 });
  }
};