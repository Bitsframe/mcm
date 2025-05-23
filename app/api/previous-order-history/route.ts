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
      table: 'pos',
      selectParam: ', Locations(title)',
      matchCase: { key: 'patientid', value: patientId }
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

    // Step 3: Fetch sales history for these orders
    const salesHistory = await fetch_content_service({
      table: 'sales_history',
      filterOptions: [{ column: 'order_id', operator: 'in', value: orderIds }]
    });


    const inventoryIds = salesHistory.map((sale: any) => sale.inventory_id);

    // Step 4: Fetch inventory details
    const inventoryData = await fetch_content_service({
      table: 'inventory',
      filterOptions: [{ column: 'inventory_id', operator: 'in', value: inventoryIds }]
    });

    const productIds = inventoryData.map((item: any) => item.product_id);

    // Step 5: Fetch product details
    const products = await fetch_content_service({
      table: 'products',
      filterOptions: [{ column: 'product_id', operator: 'in', value: productIds }]
    });

    const categoryIds = products.map((product: any) => product.category_id);

    // Step 6: Fetch category details
    const categories = await fetch_content_service({
      table: 'categories',
      filterOptions: [{ column: 'category_id', operator: 'in', value: categoryIds }]
    });

    // Step 7: Structure the final response
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

        return {
          order_id: order.order_id,
          patient_id: order.patientid,
          order_date: order.order_date,
          promo_code_id: order.promo_code_id,
          promo_code: order.promocodes,
          promo_code_percentage: percentage,
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
          sales_history: salesDetails
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