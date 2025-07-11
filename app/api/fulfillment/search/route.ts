import { NextResponse } from 'next/server';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';

export async function POST(request: Request) {
  try {
    const { orderRef, token, location_id } = await request.json();

    if (!orderRef || !token) {
      return NextResponse.json(
        { success: false, message: 'Order reference and token are required' },
        { status: 400 }
      );
    }

    // Search for fulfillment requests
    const fulfillmentRequests = await fetch_content_service({
      table: 'fulfillment_requests',
      selectParam: ', inventory(product_id, products(product_name)), orders(order_id)',
      matchCase: [
        { key: 'main_order_id', value: orderRef },
        { key: 'token', value: token },
        { key: 'status', value: 'pending' },
        { key: 'location_id', value: location_id }
      ]
    });

    if (!fulfillmentRequests || fulfillmentRequests.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No pending fulfillment requests found' },
        { status: 404 }
      );
    }

    const mapData = fulfillmentRequests.map((elem)=>{
      return {
        ...elem,
        product_name: elem?.inventory?.products?.product_name
      }
    })

    return NextResponse.json({
      success: true,
      data: mapData
    });

  } catch (error: any) {
    console.error('Fulfillment search error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 