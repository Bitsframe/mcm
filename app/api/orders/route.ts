import { NextResponse } from 'next/server';
import { create_content_service, fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services';
import { supabase } from '@/services/supabase';
import { createClient } from '@/utils/supabase/server';
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
      selectedSalesPersons = [],
    } = await request.json();


     console.log("Cart Array Data:", cartArray); 
     console.log(appliedDiscount);

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

    // find current active sales_team for this location (valid_to IS NULL)
    let sales_team_id: number | null = null;
    try {
      const { data: teamRows, error: teamErr } = await (supabase as any)
        .from('sales_team')
        .select('id')
        .eq('location_id', posLocationId)
        .is('valid_to', null)
        .limit(1);
      if (teamErr) {
        console.error('Error fetching active sales_team', teamErr);
      } else if (teamRows && teamRows.length > 0) {
        sales_team_id = (teamRows[0] as any).id;
        
        // Update auth_member for existing team
        try {
          const serverSupabase = createClient();
          const { data: { user } } = await serverSupabase.auth.getUser();
          
          if (user?.id) {
            const { error: updateErr } = await (supabase as any)
              .from('sales_team')
              .update({ auth_member: user.id })
              .eq('id', sales_team_id);
            
            if (updateErr) {
              console.error('[orders] Error updating auth_member in sales_team', updateErr);
            } else {
              console.log('[orders] Updated auth_member for sales_team:', sales_team_id);
            }
          }
        } catch (updateError) {
          console.error('[orders] Unexpected error updating auth_member', updateError);
        }
      } else {
        // No active team exists - create one
        console.log('[orders] No active sales_team found, creating one');
        try {
          // Get authenticated user from server-side client
          const serverSupabase = createClient();
          const { data: { user } } = await serverSupabase.auth.getUser();
          const now = new Date().toISOString();
          
          console.log('[orders] Creating sales_team with auth_member:', user?.id);
          
          // Prepare members: NULL if empty array, otherwise array of IDs as strings
          const members = selectedSalesPersons && selectedSalesPersons.length > 0 
            ? selectedSalesPersons.map((sp: any) => String(sp.id))
            : null;

          const { data: newTeam, error: createErr } = await (supabase as any)
            .from('sales_team')
            .insert({
              location_id: posLocationId,
              members: members,
              valid_from: now,
              valid_to: null,
              auth_member: user?.id || null,
            })
            .select('id');
          
          if (createErr) {
            console.error('[orders] Error creating sales_team', createErr);
          } else if (newTeam && newTeam.length > 0) {
            sales_team_id = newTeam[0].id;
            console.log('[orders] Created sales_team with id:', sales_team_id);
          }
        } catch (createError) {
          console.error('[orders] Unexpected error creating sales_team', createError);
        }
      }
    } catch (e) {
      console.error('Unexpected error fetching sales_team', e);
    }

    const orderCreatePostData = {
      patient_id: patient_id,
      previous_credit_amount: Number(creditAmount.toFixed(2)),
      ...(sales_team_id !== null ? { sales_team_id } : {}),
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