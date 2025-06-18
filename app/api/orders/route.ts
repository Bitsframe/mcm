import { NextResponse } from 'next/server';
import { create_content_service } from '@/utils/supabase/data_services/data_services';
import { sendOrderEmail } from '@/utils/emailServices/sendOrderEmail';

export async function POST(request: Request) {
  try {
    const {
      patient_id,
      cartArray,
      appliedDiscount,
      creditAmount,
      receivedAmount,
      selectedMethod,
      promoCodeData,
      selectedPatient,
      selectedLocation,
    } = await request.json();

    // Calculate all amounts
    const subtotalAmount = cartArray.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const discountAmount = (subtotalAmount * appliedDiscount) / 100;
    const finalAmountDue = Number((subtotalAmount - discountAmount - creditAmount).toFixed(2));
    const newCreditBalance = Number((receivedAmount - finalAmountDue).toFixed(2));

    // Create order
    const orderCreatePostData = {
      patient_id: patient_id,
      previous_credit_amount: Number(creditAmount.toFixed(2)),
      credit_balance: newCreditBalance,
      paid_amount: Number(receivedAmount.toFixed(2)),
      ...(promoCodeData && { promo_code_id: promoCodeData.id })
    };

    const { data: orderData, error: orderError } = await create_content_service({
      table: "orders",
      post_data: orderCreatePostData,
    });

    if (orderError) throw new Error(orderError.message);

    if (orderData?.length) {
      const order_id = orderData[0].order_id;

      // Create sales history entries
      const salesHistoryData = cartArray.map((elem: any) => ({
        order_id,
        inventory_id: elem.product_id,
        quantity_sold: elem.quantity,
        total_price: elem.price * elem.quantity,
        paymentcash: selectedMethod === "Cash",
      }));

      const { error: salesError } = await create_content_service({
        table: "sales_history",
        post_data: salesHistoryData,
        multiple_rows: true,
      });

      if (salesError) throw new Error(salesError.message);

      // Send order email with credit information
      await sendOrderEmail(
        { order_id, paymentcash: selectedMethod === "Cash" },
        { ...selectedPatient, location: selectedLocation.title },
        cartArray,
        subtotalAmount,
        discountAmount,
        appliedDiscount,
        Number(creditAmount.toFixed(2)), // Previous credit amount
        newCreditBalance // New credit balance
      );

      return NextResponse.json({
        success: true,
        order_id,
        message: `Order has been placed, order # ${order_id}`
      });
    }

    throw new Error('Failed to create order');

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 