import { NextResponse } from 'next/server';
import { create_content_service, fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services';
import { sendOrderEmail } from '@/utils/emailServices/sendOrderEmail';
import { sendFulfillmentRequestEmail } from '@/utils/emailServices/sendFulfillmentRequestEmail';
import crypto from 'crypto';

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


     console.log("Cart Array Data:", cartArray); 

//     // Calculate all amounts
//     const subtotalAmount = cartArray.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
//     const discountAmount = (subtotalAmount * appliedDiscount) / 100;
//     const finalAmountDue = Number((subtotalAmount - discountAmount - creditAmount).toFixed(2));
//     const paidAmount = Number((cashAmount + cardAmount).toFixed(2));
//     // const newCreditBalance = Number((paidAmount - finalAmountDue).toFixed(2));

// // If patient owes money, balance should be negative
// const newCreditBalance = Number((finalAmountDue - paidAmount).toFixed(2));

const subtotalAmount = cartArray.reduce(
  (sum: number, item: any) => sum + item.price * item.quantity,
  0
);

// Apply discount
const discountAmount = (subtotalAmount * appliedDiscount) / 100;
const discountedSubtotal = Number((subtotalAmount - discountAmount).toFixed(2));

// Total amount due includes previous credit (outstanding dues)
const totalDue = Number((discountedSubtotal + creditAmount).toFixed(2));

// Amount patient is paying now
const paidAmount = Number((cashAmount + cardAmount).toFixed(2));

// New balance calculation: how much is still owed or overpaid
const newCreditBalance = Number((totalDue - paidAmount).toFixed(2));
















    // Split cart by fulfillment location
  
    const cartByLocation: Record<string, any[]> = {};
    for (const item of cartArray) {
      const locId = item.fulfillment_location_id;
     
      if (!cartByLocation[locId]) cartByLocation[locId] = [];
      cartByLocation[locId].push(item);
    }
    const posLocationId = selectedLocation.id;
    const posCart = cartByLocation[posLocationId] || [];
    const otherLocationIds = Object.keys(cartByLocation).filter(id => id !== String(posLocationId));

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
    if (!orderData?.length) throw new Error('Failed to create order');
    const order_id = orderData[0].order_id;


        // Insert Cart-Level Discount into Discounts Table (if applicable)
    if (appliedDiscount > 0) {
      const cartDiscount = {
        order_id: order_id,
        discount_type: 'cart',
        discount_amount: appliedDiscount,
        discount_value: discountAmount,  // Discount amount applied to cart
        product_id: null, // No product ID for cart-wide discount
      };
      
      await create_content_service({
        table: 'discounts',
        post_data: cartDiscount,
      });
    }

    // Insert Product-Level Discounts into Discounts Table (if applicable)
    for (const item of cartArray) {
      if (item.discount_percent > 0) {
        const productDiscount = {
          order_id: order_id,
          discount_type: 'product',
          discount_amount: item.discount_percent,
          discount_value: (item.original_price * item.discount_percent) / 100,  // Product-level discount value
          product_id: item.main_product_id,
        };

        await create_content_service({
          table: 'discounts',
          post_data: productDiscount,
        });
      }
    }











    // --- 2. Create sales history for POS location ---
    if (posCart.length) {
      const salesHistoryData = posCart.map((elem: any) => ({
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
    }

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

    // Credit audit logic (unchanged)
    try {
      const existingCreditAudit = await fetch_content_service({
        table: "credit_audit",
        matchCase: { key: "patient_id", value: patient_id }
      });
      if (existingCreditAudit && existingCreditAudit.length > 0) {
        await update_content_service({
          table: "credit_audit",
          post_data: {
            id: existingCreditAudit[0].id,
            balance: newCreditBalance,
            updated_at: new Date().toISOString()
          }
        });
      } else {
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
    }

    // --- 3. Handle fulfillment for other locations ---
    
 
    
    // for (const locId of otherLocationIds) {
    //   const items = cartByLocation[locId];
    //   console.log(`Processing location ${locId} with ${items?.length || 0} items`);
    //   if (!items?.length) continue;
      
    //   // Create fulfillment order (no payment)
    //   const { data: fulfillOrderData, error: fulfillOrderError } = await create_content_service({
    //     table: "orders",
    //     post_data: {
    //       patient_id: patient_id,
    //       paid_amount: 0,
    //       cash: 0,
    //       card: 0,
    //       credit_balance: 0,
    //       previous_credit_amount: 0,
    //     },
    //   });
    //   if (fulfillOrderError) throw new Error(fulfillOrderError.message);
    //   if (!fulfillOrderData?.length) throw new Error('Failed to create fulfillment order');
    //   const fulfill_order_id = fulfillOrderData[0].order_id;
      
    //   // Create sales history for fulfillment order
    //   const fulfillSalesHistory = items.map((elem: any) => ({
    //     order_id: fulfill_order_id,
    //     inventory_id: elem.product_id,
    //     quantity_sold: elem.quantity,
    //     total_price: 0, // no revenue at fulfillment location
    //   }));
    //   await create_content_service({
    //     table: "sales_history",
    //     post_data: fulfillSalesHistory,
    //     multiple_rows: true,
    //   });
      
    //   // For each item, create a fulfillment request row and send email
    //   for (const elem of items) {
    //     // Generate a secure token
    //     const token = crypto.randomBytes(4).toString('hex').toUpperCase();
        
    //     // Create fulfillment request
    //     console.log('Attempting to create fulfillment request with data:', {
    //       main_order_id: order_id,
    //       fulfillment_order_id: fulfill_order_id,
    //       inventory_id: elem.product_id,
    //       quantity: elem.quantity,
    //       token,
    //       status: 'pending',
    //     });
        
    //     const { data: fulfillmentData, error: fulfillmentError } = await create_content_service({
    //       table: "fulfillment_requests",
    //       post_data: {
    //         main_order_id: order_id,
    //         fulfillment_order_id: fulfill_order_id,
    //         inventory_id: elem.product_id,
    //         quantity: elem.quantity,
    //         location_id: locId,
    //         token,
    //         status: 'pending',
    //       },
    //     });
        
    //     if (fulfillmentError) {
    //       console.error('Fulfillment request creation error:', fulfillmentError);
    //       console.error('Error details:', {
    //         message: fulfillmentError.message,
    //         details: fulfillmentError.details,
    //         hint: fulfillmentError.hint,
    //         code: fulfillmentError.code
    //       });
    //       throw new Error(`Fulfillment request creation failed: ${fulfillmentError.message}`);
    //     }
        
    //     console.log('Successfully created fulfillment request:', fulfillmentData);
        
    //     // Fetch location info
    //     const locationData = await fetch_content_service({
    //       table: "Locations",
    //       matchCase: { key: "id", value: Number(locId) }
    //     });
    //     const locationName = locationData?.[0]?.title || '';
    //     const locationAddress = locationData?.[0]?.address || '';
        
    //     // Send fulfillment request email to patient
    //     await sendFulfillmentRequestEmail(
    //       selectedPatient.email,
    //       `${selectedPatient.firstname} ${selectedPatient.lastname}`,
    //       order_id,
    //       token,
    //       [
    //         {
    //           product_name: elem.product_name,
    //           category_name: elem.category_name,
    //           quantity: elem.quantity,
    //         },
    //       ],
    //       locationName,
    //       locationAddress
    //     );
    //   }
    // }



    


    // --- 4. Send order email to patient ---
    await sendOrderEmail(
      { order_id, paymentcash: cashAmount > 0, paymentcard: cardAmount > 0 },
      { ...selectedPatient, location: selectedLocation.title },
      cartArray,
      subtotalAmount,
      discountAmount,
      appliedDiscount,
      Number(creditAmount.toFixed(2)),
      newCreditBalance
    );

    return NextResponse.json({
      success: true,
      order_id,
      message: `Order has been placed, order # ${order_id}`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 