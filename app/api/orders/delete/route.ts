import { NextResponse } from 'next/server';
import { delete_content_service, fetch_content_service } from '@/utils/supabase/data_services/data_services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, message: 'order_id is required' }, { status: 400 });
    }

    // Delete dependent rows first to avoid FK constraint errors.
    // 1) discounts where order_id = X
    const discountsResult = await delete_content_service({ table: 'discounts', keyByDelete: 'order_id', id: order_id });
    if (discountsResult.error) {
      console.error('Error deleting discounts', discountsResult.error);
      return NextResponse.json({ success: false, message: 'Failed to delete discounts', error: discountsResult.error }, { status: 500 });
    }

    // 2) Find sales_history rows for this order so we can delete dependent returns first
    const salesRows = await fetch_content_service({ table: 'sales_history', language: '', matchCase: { key: 'order_id', value: order_id } });
    const salesIds = Array.isArray(salesRows) ? salesRows.map((r: any) => r.sales_history_id).filter(Boolean) : [];

    if (salesIds.length > 0) {
      // delete returns that reference these sales_history rows (returns.sales_id -> sales_history.sales_history_id)
      try {
        // delete each return row where sales_id = <id>
        await Promise.all(salesIds.map((sid: number) =>
          delete_content_service({ table: 'returns', keyByDelete: 'sales_id', id: sid })
        ));
      } catch (err) {
        console.error('Error deleting returns for sales_history', err);
        return NextResponse.json({ success: false, message: 'Failed to delete returns tied to sales_history', error: err }, { status: 500 });
      }
    }

    // 3) sales_history where order_id = X
    const salesHistoryResult = await delete_content_service({ table: 'sales_history', keyByDelete: 'order_id', id: order_id });
    if (salesHistoryResult.error) {
      console.error('Error deleting sales_history', salesHistoryResult.error);
      return NextResponse.json({ success: false, message: 'Failed to delete sales_history', error: salesHistoryResult.error }, { status: 500 });
    }

    // 4) transaction_history where order_id = X (remove transaction records first to avoid FK failures)
    const transactionHistoryResult = await delete_content_service({ table: 'transaction_history', keyByDelete: 'order_id', id: order_id });
    if (transactionHistoryResult.error) {
      console.error('Error deleting transaction_history', transactionHistoryResult.error);
      return NextResponse.json({ success: false, message: 'Failed to delete transaction_history', error: transactionHistoryResult.error }, { status: 500 });
    }

    // 5) orders where order_id = X
    const ordersResult = await delete_content_service({ table: 'orders', keyByDelete: 'order_id', id: order_id });
    if (ordersResult.error) {
      console.error('Error deleting order', ordersResult.error);
      return NextResponse.json({ success: false, message: 'Failed to delete order', error: ordersResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Order and related records deleted' });
  } catch (error: any) {
    console.error('Unexpected error deleting order', error);
    return NextResponse.json({ success: false, message: error.message || 'Unexpected error' }, { status: 500 });
  }
}
