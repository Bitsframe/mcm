import { NextRequest, NextResponse } from 'next/server';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    const data: any = await fetch_content_service({
      table: 'fulfillment_requests',
      selectParam: ', inventory(product_id, products(product_name)), orders!fulfillment_requests_fulfillment_order_id_fkey(*,pos:allpatients(firstname, lastname, email))',
      matchCase: [
        { key: 'location_id', value: parseInt(locationId) }
      ],
      filterOptions: [
        { operator: 'not', column: 'inventory', value: null },
        { operator: 'not', column: 'orders', value: null }
      ]
    });

    const formattedData = data.map((item: any) => ({
      id: item.id,
      order_id: item.fulfillment_order_id,
      status: item.status,
      quantity: item.quantity,
      product_name: item.inventory?.products?.product_name || 'Unknown Product',
      created_at: item.created_at,
      fulfilled_at: item.fulfilled_at,
      patient_name: item.orders?.pos ? `${item.orders.pos.firstname} ${item.orders.pos.lastname}` : 'Unknown Patient',
      patient_email: item.orders?.pos?.email || ''
    }));

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching fulfillment requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fulfillment requests' },
      { status: 500 }
    );
  }
} 