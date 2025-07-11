import { NextResponse } from 'next/server';
import { update_content_service, fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { sendFulfillmentConfirmationEmail } from '@/utils/emailServices/sendFulfillmentConfirmationEmail';

export async function POST(requestUser: Request) {
  try {
    const { requestId } = await requestUser.json();

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Get the fulfillment request details
    // const fulfillmentRequest = await fetch_content_service({
    //   table: 'fulfillment_requests',
    //   selectParam: ', inventory(product_name)',
    //   matchCase: { key: 'id', value: requestId }
    // });

    // if (!fulfillmentRequest || fulfillmentRequest.length === 0) {
    //   return NextResponse.json(
    //     { success: false, message: 'Fulfillment request not found' },
    //     { status: 404 }
    //   );
    // }

    // const request = fulfillmentRequest[0];

    // Update the fulfillment request status
    const { error: updateError }:any = await update_content_service({
      table: 'fulfillment_requests',
      post_data: {
        id: requestId,
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      }
    });

    if (updateError) {
      throw new Error(`Failed to update fulfillment request: ${updateError.message}`);
    }

    // Send confirmation email to patient
    // if (request.pos?.email) {
    //   try {
    //     await sendFulfillmentConfirmationEmail(
    //       request.pos.email,
    //       `${request.pos.firstname} ${request.pos.lastname}`,
    //       request.orders.order_id,
    //       request.inventory.product_name,
    //       request.quantity
    //     );
    //   } catch (emailError) {
    //     console.error('Failed to send confirmation email:', emailError);
    //     // Don't fail the whole request if email fails
    //   }
    // }

    return NextResponse.json({
      success: true,
      message: 'Fulfillment request marked as fulfilled'
    });

  } catch (error: any) {
    console.error('Fulfillment fulfill error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 