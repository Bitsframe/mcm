import { NextResponse } from 'next/server';
import { update_content_service } from '@/utils/supabase/data_services/data_services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, requestIds } = body;

    // Case 1: Single fulfillment
    if (requestId && !requestIds) {
      const { error: updateError }: any = await update_content_service({
        table: 'fulfillment_requests',
        post_data: {
          id: requestId,
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        }
      });

      if (updateError) {
        throw new Error(`Failed to fulfill ID ${requestId}: ${updateError.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `Fulfillment request #${requestId} marked as fulfilled`
      });
    }

    // Case 2: Batch fulfillment
    if (Array.isArray(requestIds) && requestIds.length > 0) {
      for (const id of requestIds) {
        const { error: updateError }: any = await update_content_service({
          table: 'fulfillment_requests',
          post_data: {
            id,
            status: 'fulfilled',
            fulfilled_at: new Date().toISOString()
          }
        });

        if (updateError) {
          throw new Error(`Failed to fulfill ID ${id}: ${updateError.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'All selected fulfillment requests marked as fulfilled'
      });
    }

    // If neither input is valid
    return NextResponse.json(
      { success: false, message: 'Either requestId or requestIds[] is required' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Fulfillment error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
