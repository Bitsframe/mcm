import { NextResponse } from 'next/server';
import { createClient as supabaseCreateClient } from '@/utils/supabase/server';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';

export const POST = async (req: Request) => {
  try {
    const supabase = supabaseCreateClient();
    const { patientId, currentOrderId } = await req.json();


    if (!patientId) {

      return NextResponse.json(
        { success: false, message: 'Missing patientId' },
        { status: 400 }
      )
    }


    const posRecords = await fetch_content_service({
      table: 'allpatients',
      selectParam: ', Locations(title)',
      matchCase: { key: 'id', value: patientId }
    });
    console.log(posRecords)

    const posIds = posRecords.map((pos: any) => pos.id);

    // Step 2: Fetch orders linked to the found `pos` records
    const orders = await fetch_content_service({
      table: 'orders',
      selectParam: ', promocodes(*, promotype(*))',
      filterOptions: [{ column: 'patient_id', operator: 'in', value: posIds },
        // { column: 'order_id', operator: 'neq', value: currentOrderId }
      ]

    });


    const orderIds = orders.map((order: any) => order.order_id);

    // Step 3: Fetch discounts for these orders
    const discounts = await fetch_content_service({
      table: 'discounts',
      filterOptions: [{ column: 'order_id', operator: 'in', value: orderIds }]
    });

    // Step 4: Fetch sales history for these orders
    const salesHistory = await fetch_content_service({
      table: 'sales_history',
      filterOptions: [{ column: 'order_id', operator: 'in', value: orderIds }]
    });


    const inventoryIds = salesHistory.map((sale: any) => sale.inventory_id);

      // Step 4.5: Fetch any sales_team rows referenced by orders (so we can resolve member ids -> staff names
      // and resolve auth_member -> profiles.full_name when present)
      const salesTeamIds = orders.map((o: any) => o.sales_team_id).filter(Boolean);
      let salesTeams: any[] = [];
      let staffRows: any[] = [];
      let profileRows: any[] = [];
      if (salesTeamIds && salesTeamIds.length > 0) {
        salesTeams = await fetch_content_service({
          table: 'sales_team',
          filterOptions: [{ column: 'id', operator: 'in', value: salesTeamIds }]
        }) || [];

        // collect all member ids from all teams and any auth_member ids
        const allMemberIds: number[] = [];
        const allAuthIds: string[] = [];
        salesTeams.forEach((t: any) => {
          const mem = t.members;
          if (t.auth_member) {
            allAuthIds.push(String(t.auth_member));
          }
          if (!mem) return;
          // members might be text array or JSON string; normalize
          let arr: any[] = [];
          if (Array.isArray(mem)) arr = mem;
          else {
            try { arr = JSON.parse(String(mem)); } catch (e) { arr = [] }
          }
          arr.forEach((m) => { const idNum = Number(m); if (!Number.isNaN(idNum)) allMemberIds.push(idNum); });
        });

        const uniqueStaffIds = Array.from(new Set(allMemberIds));
        if (uniqueStaffIds.length > 0) {
          staffRows = await fetch_content_service({
            table: 'staff',
            filterOptions: [{ column: 'id', operator: 'in', value: uniqueStaffIds }]
          }) || [];
        }

        const uniqueAuthIds = Array.from(new Set(allAuthIds)).filter(Boolean);
        if (uniqueAuthIds.length > 0) {
          // profiles.id may be UUID/string - fetch by id
          profileRows = await fetch_content_service({
            table: 'profiles',
            filterOptions: [{ column: 'id', operator: 'in', value: uniqueAuthIds }]
          }) || [];
        }
      }

    // Step 5: Fetch inventory details
    const inventoryData = await fetch_content_service({
      table: 'inventory',
      filterOptions: [{ column: 'inventory_id', operator: 'in', value: inventoryIds }]
    });

    const productIds = inventoryData.map((item: any) => item.product_id);

    // Step 6: Fetch product details
    const products = await fetch_content_service({
      table: 'products',
      filterOptions: [{ column: 'product_id', operator: 'in', value: productIds }]
    });

    const categoryIds = products.map((product: any) => product.category_id);

    // Step 7: Fetch category details
    const categories = await fetch_content_service({
      table: 'categories',
      filterOptions: [{ column: 'category_id', operator: 'in', value: categoryIds }]
    });

    // Step 8: Structure the final response
    const formattedData = posRecords.map((pos: any) => {
      console.log({ pos })
      const ordersForPos = orders.filter((order: any) => order.patient_id === pos.id);

      return ordersForPos.map((order: any) => {
        const sales = salesHistory.filter((sale: any) => sale.order_id === order.order_id);
        const salesDetails = sales.map((sale: any) => {
          const inventoryItem = inventoryData.find((item: any) => item.inventory_id === sale.inventory_id);
          const product = products.find((p: any) => p.product_id === inventoryItem?.product_id);
          const category = categories.find((c: any) => c.category_id === product?.category_id);

          return {
            sales_history_id: sale.sales_history_id,
            date_sold: sale.date_sold,
            quantity_sold: sale.quantity_sold,
            total_price: sale.total_price,
            paymentcash: sale.paymentcash,
            return_qty: sale.return_qty,
            inventory_id: sale.inventory_id,
            inventory: {
              inventory_id: sale.inventory_id,
              product_id: inventoryItem?.product_id,
              price: product.price,
              products: product
                ? {
                  product_name: product.product_name,
                  category_id: product.category_id,
                  categories: category ? { category_name: category.category_name } : null
                }
                : null
            }
          };
        });

        const percentage = order.promocodes?.promotype?.percentage;
        
        // Get discounts for this specific order
        const orderDiscounts = discounts.filter((discount: any) => discount.order_id === order.order_id);

        return {
          order_id: order.order_id,
          patient_id: order.patientid,
          order_date: order.order_date,
          promo_code_id: order.promo_code_id,
          promo_code: order.promocodes,
          promo_code_percentage: percentage,
          cash: order.cash,
          card: order.card,
          credit_balance: order.credit_balance,
          previous_credit_amount: order.previous_credit_amount,
          discounts: orderDiscounts,
          pos: {
            id: pos.id,
            email: pos.email,
            phone: pos.phone,
            gender: pos.gender,
            lastname: pos.lastname,
            firstname: pos.firstname,
            patientid: pos.patientid,
            locationid: pos.locationid,
            treatmenttype: pos.treatmenttype,
            Locations: { title: pos.Locations.title }
          },
          sales_history: salesDetails,
          // include sales_team id and resolved member names (if available)
          sales_team_id: order.sales_team_id ?? null,
          sales_team_members: (() => {
            try {
              if (!order.sales_team_id) return [];
              const team = salesTeams.find((st: any) => String(st.id) === String(order.sales_team_id));
              if (!team) return [];

                  // Always include staff members (members field) first
                  const names: string[] = [];
                  if (team.members) {
                    let arr: any[] = [];
                    if (Array.isArray(team.members)) arr = team.members;
                    else {
                      try { arr = JSON.parse(String(team.members)); } catch (e) { arr = []; }
                    }
                    arr.forEach((mid) => {
                      const midNum = Number(mid);
                      const s = staffRows.find((sr: any) => Number(sr.id) === Number(midNum));
                      names.push(s ? (s.full_name || `${s.id}`) : String(mid));
                    });
                  }

                  // If auth_member exists, include that person's profile name as an additional member
                  if (team.auth_member) {
                    const authId = String(team.auth_member);
                    const prof = profileRows.find((p: any) => String(p.id) === authId);
                    names.push(prof ? (prof.full_name || authId) : authId);
                  }

                  return names;
            } catch (e) { return []; }
          })(),
        
        };
      });
    }).flat();




    const responseData = formattedData.sort((a, b) => (a.order_id === currentOrderId ? -1 : b.order_id === currentOrderId ? 1 : 0));






    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("ERROR ->", error);
    return NextResponse.json(
      { success: false, message: "An error occurred.", error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}