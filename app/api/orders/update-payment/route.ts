import { NextResponse } from 'next/server';
import { update_content_service } from '@/utils/supabase/data_services/data_services';

export async function PUT(request: Request) {
  try {
    const { order_id, paymentType } = await request.json();

    const res_data = await update_content_service({
      table: "sales_history",
      post_data: {
        order_id: order_id,
        paymentcash: paymentType === "Cash"
      },
      matchKey: 'order_id'
    });

    if (res_data?.length) {
      return NextResponse.json({
        success: true,
        message: 'Payment type updated successfully'
      });
    } else {
      throw new Error('Failed to update payment type');
    }

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 