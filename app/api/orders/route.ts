import { NextResponse } from 'next/server';
import { create_content_service, fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services';
import { sendOrderEmail } from '@/utils/emailServices/sendOrderEmail';

export async function POST(request: Request) {
  try {
    const {
      patient_id,
      cartArray,
      appliedDiscount,
      creditAmount,
      cashAmount = 0,
      cardAmount = 0,
      promoCodeData,
      selectedPatient,
      selectedLocation,
    } = await request.json();

    // Calculate all amounts
    const subtotalAmount = cartArray.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const discountAmount = (subtotalAmount * appliedDiscount) / 100;
    const finalAmountDue = Number((subtotalAmount - discountAmount - creditAmount).toFixed(2));
    const paidAmount = Number((cashAmount + cardAmount).toFixed(2));
    // const newCreditBalance = Number((paidAmount - finalAmountDue).toFixed(2));

// If patient owes money, balance should be negative
const newCreditBalance = Number((finalAmountDue - paidAmount).toFixed(2));
// This will be positive (amount owed) or 0 if fully paid


    // Create order
    const orderCreatePostData = {
      patient_id: patient_id,
      previous_credit_amount: Number(creditAmount.toFixed(2)),
      credit_balance: newCreditBalance,
      paid_amount: paidAmount,
      cash: Number(cashAmount.toFixed(2)),
      card: Number(cardAmount.toFixed(2)),
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
      }));

      const { error: salesError } = await create_content_service({
        table: "sales_history",
        post_data: salesHistoryData,
        multiple_rows: true,
      });

      if (salesError) throw new Error(salesError.message);

      await create_content_service({
        table: "transaction_history",
        post_data: {
          patient_id,
          amount: paidAmount,
          balance: creditAmount,
          type: "order",
          order_id: order_id
        },
      });

      // Credit audit logic - update existing record or insert new one
      try {
        const existingCreditAudit = await fetch_content_service({
          table: "credit_audit",
          matchCase: { key: "patient_id", value: patient_id }
        });

        if (existingCreditAudit && existingCreditAudit.length > 0) {
          // Update existing credit record
          await update_content_service({
            table: "credit_audit",
            post_data: {
              id: existingCreditAudit[0].id,
              balance: newCreditBalance,
              updated_at: new Date().toISOString()
            }
          });
        } else {
          // Insert new credit record
          await create_content_service({
            table: "credit_audit",
            post_data: {
              patient_id,
              balance: newCreditBalance,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          });
        }
      } catch (creditAuditError: any) {
        console.error("Credit audit error:", creditAuditError.message);
        // Don't throw error here to avoid failing the entire order
      }

      // Send order email with credit information
      await sendOrderEmail(
        { order_id, paymentcash: cashAmount > 0, paymentcard: cardAmount > 0 },
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