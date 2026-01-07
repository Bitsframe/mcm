import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useContext, useState } from 'react';
import DateRangeModal from './DateRangeModal';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { supabase } from '@/services/supabase';
import { LocationContext } from '@/context';
import { toast } from 'react-toastify'; // Import the toast library
import { buildOrderInfoBlock, getOrderInfoData } from './pdfHelpers';

interface TableData {
    orderId: string;
    date: string;
    patientName: string;
    totalAmount: string;
    paymentType: string;
}

interface ExportAsPDFProps {}

const ExportAsPDF: React.FC<ExportAsPDFProps> = () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { selectedLocation } = useContext(LocationContext);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Helper: convert a UTC datetime string to Central Time (CT) date string YYYY-MM-DD
    const convertUTCtoCtDate = (utcDateString: string): string => {
        if (!utcDateString) return '';
        const date = new Date(utcDateString);
        // CT (CST) is UTC-6; using fixed offset to align with POS history page logic
        const ctOffsetMs = -6 * 60 * 60 * 1000;
        const ctDate = new Date(date.getTime() + ctOffsetMs);
        const year = ctDate.getUTCFullYear();
        const month = String(ctDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(ctDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Function to generate the PDF
    const generatePDF = async (startDate: string, endDate: string) => {
        setLoading(true);

        try {
            // bonus totals (computed later) - keep in outer scope so header can access
            let totalBonus = 0;
            let totalPaidBonus = 0;
            // Debug: log the requested range
            try {
                console.log('[ExportPDF] generatePDF range', { startDate, endDate, locationId: selectedLocation?.id });
            } catch (e) { /* ignore in non-browser env */ }

            // Normalize range to CT boundaries converted to UTC so DB filter matches CT day
            const ctToUtcBoundary = (dateStr: string, isStart: boolean) => {
                // Base at UTC midnight or end-of-day, then add 6 hours to shift CT->UTC
                const baseUTC = new Date(`${dateStr}T${isStart ? '00:00:00.000Z' : '23:59:59.999Z'}`);
                const utcMs = baseUTC.getTime() + (6 * 60 * 60 * 1000); // CT is UTC-6
                return new Date(utcMs).toISOString();
            };
            const startDateStart = ctToUtcBoundary(startDate, true);
            const endDateEnd = ctToUtcBoundary(endDate, false);
                            // Loud alert to show date range and included fields
                                        try {
                                                    // logging removed for production
                                                } catch (e) {
                                                    // ignore in non-browser env
                                                }
            // Fetch the data with date range filter, and include related inventory, orders and products
            // We'll inspect and log the combined dataset and skip populating the PDF body for now.
            const fetched_data = await fetch_content_service({
                table: 'sales_history',
                language: '',
                selectParam: `,
                    orders(order_id, order_date, paid_amount, cash, card, zelle, sales_team_id, pos:allpatients (
                        lastname,
                        firstname,
                        email,
                        phone,
                        dob,
                        locationid
                    )),
                    inventory(inventory_id, product_id, location_id, products (
                        product_id,
                        product_name,
                        price,
                        category_id,
                        archived,
                        unlimited
                    )),
                    date_sold,
                    quantity_sold,
                    total_price,
                    sales_history_id
                `,
                matchCase: { key: 'inventory.location_id', value: selectedLocation.id },
                filterOptions: [
                    { column: 'orders.pos', operator: 'not', value: null },
                    { column: 'orders', operator: 'not', value: null },
                    { column: 'orders.order_date', operator: 'gte', value: startDateStart },
                    { column: 'orders.order_date', operator: 'lte', value: endDateEnd },
                    // explicit location filter to ensure only this location
                    { column: 'inventory.location_id', operator: 'eq', value: selectedLocation.id },
                ]
            });

            // Additional client-side guards: location and exact date part
            const filteredByDate = (fetched_data || []).filter((item: any) => {
                if (!item.orders?.order_date) return false;
                if (!item.inventory?.location_id || selectedLocation?.id == null) return false;
                const datePartCT = convertUTCtoCtDate(item.orders.order_date);
                const matchesLocation = String(item.inventory.location_id) === String(selectedLocation.id);
                return matchesLocation && datePartCT >= startDate && datePartCT <= endDate;
            });

            console.log('[ExportPDF] Fetched (DB filtered):', fetched_data?.length || 0, 'After date/location filter:', filteredByDate.length, 'Range:', startDate, 'to', endDate, 'Location:', selectedLocation?.id);

            // For debugging: log the fetched structure that includes sales_history rows with nested orders, inventory and products
            try {
                console.log('[ExportAsPDF] generatePDF called', { startDate, endDate, selectedLocation });
                console.log('[ExportAsPDF] fetched_data (raw):', fetched_data);
                // --- DEBUG: fetch bonus rows and compute totals on frontend ---
                try {
                    // Use direct supabase queries here to select only required columns and avoid heavy payloads
                    const selectCols = 'id, bonus_amount, date, paid, paid_date, location_id, total_sales, bonus_eligibility, bonus_config_history_id';

                    // Fetch all bonus rows for the selected location where `date` is within the selected range
                    const { data: bonusRows, error: bonusError } = await (supabase as any)
                        .from('bonus')
                        .select(selectCols)
                        .eq('location_id', selectedLocation.id)
                        .gte('date', startDate)
                        .lte('date', endDate);

                    if (bonusError) {
                        console.error('ExportAsPDF: error fetching bonusRows from supabase', bonusError);
                    }

                    // Fetch paid bonus rows where paid = true and paid_date is within the selected range
                    const { data: paidBonusRows, error: paidError } = await (supabase as any)
                        .from('bonus')
                        .select(selectCols)
                        .eq('location_id', selectedLocation.id)
                        .eq('paid', true)
                        .gte('paid_date', startDate)
                        .lte('paid_date', endDate);

                    if (paidError) {
                        console.error('ExportAsPDF: error fetching paidBonusRows from supabase', paidError);
                    }

                    // Compute totals on the frontend (safe numeric coercion)
                    const toNumber = (v: any) => {
                        const n = Number(v);
                        return Number.isNaN(n) ? 0 : n;
                    };

                    totalBonus = (bonusRows || []).reduce((s: number, r: any) => s + toNumber(r.bonus_amount), 0);
                    totalPaidBonus = (paidBonusRows || []).reduce((s: number, r: any) => s + toNumber(r.bonus_amount), 0);

                } catch (e) {
                    console.error('ExportAsPDF: error fetching/processing bonus debug rows', e);
                }
            } catch (e) {
                // ignore in non-browser env
            }

            // Fetch discounts for the orders present in the fetched sales_history rows
            let discountsForOrders: any[] = [];
            try {
                const orderIds = Array.from(new Set((fetched_data || []).map((row: any) => row.orders?.order_id).filter(Boolean)));
                try { /* logging removed */ } catch (e) {}

                if (orderIds.length > 0) {
                    discountsForOrders = await fetch_content_service({
                        table: 'discounts',
                        language: '',
                        filterOptions: [{ column: 'order_id', operator: 'in', value: orderIds }]
                    }) || [];

                } else {

                }
            } catch (e) {
                console.error('ExportAsPDF: Error fetching discounts for orders:', e);
            }

            // DEBUG: fetch ALL discounts (select * from discounts) to confirm the table rows exist and inspect types
            try {
                const allDiscounts = await fetch_content_service({
                    table: 'discounts',
                    language: ''
                });
                try {
                    const summary = (allDiscounts || []).map((d: any) => ({
                        discount_id: d.discount_id,
                        order_id: d.order_id,
                        order_id_type: typeof d.order_id,
                        product_id: d.product_id,
                        product_id_type: typeof d.product_id,
                        discount_type: d.discount_type,
                        discount_amount: d.discount_amount,
                        discount_value: d.discount_value,
                    }));
   
                } catch (e) { console.error('ExportAsPDF: error summarizing allDiscounts', e); }
            } catch (e) {
                console.error('ExportAsPDF: Error fetching ALL discounts (debug):', e);
            }

            // EXTRA DEBUG: fetch and log related tables explicitly to narrow down which data is missing
            let productsRaw: any[] = [];
            try {
                try { /* logging removed */ } catch(e){}

                const derivedOrderIds = Array.from(new Set((fetched_data || []).map((row: any) => row.orders?.order_id).filter(Boolean)));
                let ordersRaw: any[] = [];
                if (derivedOrderIds.length > 0) {
                    ordersRaw = await fetch_content_service({ table: 'orders', language: '', filterOptions: [{ column: 'order_id', operator: 'in', value: derivedOrderIds }] }) || [];

                } else {
                    console.log('[ExportAsPDF] no derivedOrderIds found');
                }

                const inventoryIds = Array.from(new Set((fetched_data || []).map((row: any) => row.inventory?.inventory_id || row.inventory_id).filter(Boolean)));
                let inventoryRaw: any[] = [];
                if (inventoryIds.length > 0) {
                    inventoryRaw = await fetch_content_service({ table: 'inventory', language: '', filterOptions: [{ column: 'inventory_id', operator: 'in', value: inventoryIds }] }) || [];
                    console.log('[ExportAsPDF] inventoryRaw for inventoryIds', inventoryIds, inventoryRaw);

                    const productIds = Array.from(new Set((inventoryRaw || []).map((it: any) => it.product_id).filter(Boolean)));
                    if (productIds.length > 0) {
                        productsRaw = await fetch_content_service({ table: 'products', language: '', filterOptions: [{ column: 'product_id', operator: 'in', value: productIds }] }) || [];
                        console.log('[ExportAsPDF] productsRaw for productIds', productIds, productsRaw);
                    } else {
                        console.log('[ExportAsPDF] no productIds found in inventoryRaw');
                    }
                } else {
                    console.log('[ExportAsPDF] no inventoryIds found in fetched_data');
                }
            } catch (e) {
                console.error('ExportAsPDF: Error during extra debug fetches:', e);
            }

            // Define table column headers to match desired product-level layout
            const tableColumn = ['Category', 'Product', 'Quantity', 'Amount', 'Product Discount %', 'Amount After Discount'];
            const tableRows: (string[] | object[])[] = [];
            let totalAmount = 0;
            // ordersMap will hold grouped sales_history rows by order_id so we can compute totals like cash/card sums
            let ordersMap: Map<string, any> = new Map();
            // accumulator for total sales (sum of net amounts after discounts)
            let totalSalesNet = 0;

            // Populate the PDF rows using nested relations (orders, inventory.products)
            if (filteredByDate && filteredByDate.length > 0) {
                // Build discount lookup maps locally to avoid relying on globalThis state
                const cartMapLocal = new Map<string, any[]>();
                const productMapLocal = new Map<string, any[]>();
                (discountsForOrders || []).forEach((d: any) => {
                    const oId = d.order_id != null ? String(d.order_id) : '';
                    const pId = d.product_id != null ? String(d.product_id) : '';
                    if (!d.product_id) {
                        if (!cartMapLocal.has(oId)) cartMapLocal.set(oId, []);
                        const arr = cartMapLocal.get(oId)!;
                        arr.push(d);
                    } else {
                        const key = `${oId}_${pId}`;
                        if (!productMapLocal.has(key)) productMapLocal.set(key, []);
                        const parr = productMapLocal.get(key)!;
                        parr.push(d);
                    }
                });

                // Group sales_history rows by order_id
                ordersMap = new Map<string, any>();
                filteredByDate.forEach((item: any) => {
                    const orderId = item.orders?.order_id || item.order_id || '';
                    const oIdStr = String(orderId);
                    const salesHistoryId = item.sales_history_id ? item.sales_history_id.toString() : '';
                    // Convert order date from UTC to CT for invoice display and grouping
                    const dateStr = item.orders?.order_date ? convertUTCtoCtDate(item.orders.order_date) : '';
                    const patientName = item.orders?.pos ? `${item.orders.pos.firstname || ''} ${item.orders.pos.lastname || ''}`.trim() : '';
                    // Legacy: item.paymentcash was used before to decide payment type.
                    // New logic (per requirements): determine cash/card amounts from the orders row
                    // and set paymentType according to these rules:
                    // 1) if card amount === 0 -> paymentType = 'Cash' and print cash amount (if present)
                    // 2) if cash amount === 0 -> paymentType = 'Card' and print card amount (if present)
                    // 3) if both have positive values -> paymentType = 'Card & Cash' and print both
                    // 4) if both are 0 or missing -> paymentType = 'Cash & Card' and render 0 and 0

                    // Read raw numeric values from orders row.
                    // Prefer the explicit `cash` column over `paid_amount` so that an explicit cash=0
                    // in the DB is respected (i.e. cash was intentionally zero).
                    const rawCashFromOrders = (item.orders && (item.orders.cash != null ? item.orders.cash : (item.orders.paid_amount != null ? item.orders.paid_amount : null)));
                    const rawCardFromOrders = (item.orders && item.orders.card != null ? item.orders.card : null);
                    const rawZelleFromOrders = (item.orders && item.orders.zelle != null ? item.orders.zelle : null);

                    const cashNum = rawCashFromOrders != null ? Number(rawCashFromOrders) : null;
                    const cardNum = rawCardFromOrders != null ? Number(rawCardFromOrders) : null;
                    const zelleNum = rawZelleFromOrders != null ? Number(rawZelleFromOrders) : null;

                    // Build payment method label dynamically including Zelle when present
                    const presentMethods: string[] = [];
                    if (cashNum != null && cashNum > 0) presentMethods.push('Cash');
                    if (cardNum != null && cardNum > 0) presentMethods.push('Card');
                    if (zelleNum != null && zelleNum > 0) presentMethods.push('Zelle');

                    let computedPaymentType = presentMethods.length ? presentMethods.join(' & ') : 'Cash & Card';

                    // Amounts to display; use '-' when explicitly not used but other tenders exist
                    const computedCash: number | string | null = (() => {
                        if (cashNum == null || isNaN(cashNum)) return presentMethods.length ? '-' : null;
                        if (presentMethods.includes('Cash')) return cashNum;
                        if (cashNum === 0) return '-';
                        return cashNum;
                    })();

                    const computedCard: number | string | null = (() => {
                        if (cardNum == null || isNaN(cardNum)) return presentMethods.length ? '-' : null;
                        if (presentMethods.includes('Card')) return cardNum;
                        if (cardNum === 0) return '-';
                        return cardNum;
                    })();

                    const computedZelle: number | string | null = (() => {
                        if (zelleNum == null || isNaN(zelleNum)) return presentMethods.length ? '-' : null;
                        if (presentMethods.includes('Zelle')) return zelleNum;
                        if (zelleNum === 0) return '-';
                        return zelleNum;
                    })();

                    const productName = item.inventory?.products?.product_name || item.inventory?.product_name || '';
                    const productPriceNum = item.inventory?.products?.price ?? item.inventory?.price ?? item.price ?? 0;
                    const productPrice = Number(productPriceNum);
                    const quantityNum = item.quantity_sold != null ? Number(item.quantity_sold) : 0;
                    const rowTotalNum = item.total_price != null ? Number(item.total_price) : 0;
                    const productId = item.inventory?.products?.product_id || item.inventory?.product_id || null;

                    if (!ordersMap.has(oIdStr)) {
                        ordersMap.set(oIdStr, {
                            order_id: orderId,
                            date: dateStr,
                            patientName,
                            paymentType: computedPaymentType,
                            // store contact and payment info for the per-order header block
                            email: item.orders?.pos?.email || '',
                            phone: item.orders?.pos?.phone || '',
                            sales_team_id: item.orders?.sales_team_id ?? null,
                            salesPerson: item.orders?.created_by || item.orders?.user_name || 'N/A',
                            // Set cash/card to numeric values or null according to rules above.
                            // pdfHelpers prints lines only when the value is not null. For the "both zero" case
                            // we intentionally set 0 so the PDF shows $0.00 for both fields.
                            cash: computedCash,
                            card: computedCard,
                            zelle: computedZelle,
                            // store paid_amount and credit_balance from orders if present
                            paid_amount: item.orders?.paid_amount != null ? Number(item.orders.paid_amount) : 0,
                            credit_balance: item.orders?.credit_balance != null ? Number(item.orders.credit_balance) : null,
                            items: [],
                        });
                    }

                    ordersMap.get(oIdStr).items.push({
                        productName,
                        productPrice,
                        quantityNum,
                        rowTotalNum,
                        productId,
                    });
                });

                // Resolve sales team members to names for each order
                const salesTeamIds = Array.from(new Set(Array.from(ordersMap.values()).map((o: any) => Number(o.sales_team_id)).filter(Boolean)));
                const salesTeamMembersMap = new Map<number, string[]>();
                if (salesTeamIds.length > 0) {
                    try {
                        const { data: salesTeamRows, error: salesTeamErr } = await (supabase as any)
                            .from('sales_team')
                            .select('id, members, auth_member')
                            .in('id', salesTeamIds);
                        if (salesTeamErr) {
                            console.error('ExportAsPDF: error fetching sales_team rows', salesTeamErr);
                        } else if (salesTeamRows && salesTeamRows.length > 0) {
                            // Fetch staff members
                            const memberIds = Array.from(new Set((salesTeamRows || []).flatMap((row: any) => (row.members || []).map((m: any) => Number(m)).filter(Boolean))));
                            const staffMap = new Map<number, string>();
                            if (memberIds.length > 0) {
                                const { data: staffRows, error: staffErr } = await (supabase as any)
                                    .from('staff')
                                    .select('id, full_name')
                                    .in('id', memberIds);
                                if (staffErr) {
                                    console.error('ExportAsPDF: error fetching staff rows for sales team', staffErr);
                                } else {
                                    (staffRows || []).forEach((s: any) => {
                                        const sid = Number(s.id);
                                        if (!Number.isNaN(sid)) staffMap.set(sid, s.full_name || String(sid));
                                    });
                                }
                            }

                            // Fetch auth_member names from profiles
                            const authMemberIds = Array.from(new Set((salesTeamRows || []).map((row: any) => row.auth_member).filter(Boolean)));
                            const profilesMap = new Map<string, string>();
                            if (authMemberIds.length > 0) {
                                const { data: profileRows, error: profileErr } = await (supabase as any)
                                    .from('profiles')
                                    .select('id, full_name')
                                    .in('id', authMemberIds);
                                if (profileErr) {
                                    console.error('ExportAsPDF: error fetching profiles for auth_member', profileErr);
                                } else {
                                    (profileRows || []).forEach((p: any) => {
                                        if (p && p.id) profilesMap.set(String(p.id), p.full_name || String(p.id));
                                    });
                                }
                            }

                            // Build names list based on which fields are populated
                            (salesTeamRows || []).forEach((row: any) => {
                                const tid = Number(row.id);
                                if (Number.isNaN(tid)) return;
                                const names: string[] = [];
                                
                                const hasMembers = row.members && Array.isArray(row.members) && row.members.length > 0;
                                const hasAuthMember = row.auth_member != null && row.auth_member !== '';
                                
                                if (!hasMembers && !hasAuthMember) {
                                    // Both null: show special message
                                    names.push('Sales person not assigned');
                                } else if (!hasMembers && hasAuthMember) {
                                    // Only auth_member present
                                    const authId = String(row.auth_member);
                                    const authName = profilesMap.get(authId) || authId;
                                    names.push(authName);
                                } else if (hasMembers && !hasAuthMember) {
                                    // Only members present
                                    (row.members || []).forEach((m: any) => {
                                        const mid = Number(m);
                                        if (Number.isNaN(mid)) return;
                                        const name = staffMap.get(mid) || String(mid);
                                        names.push(name);
                                    });
                                } else {
                                    // Both present: add staff members first, then auth_member
                                    (row.members || []).forEach((m: any) => {
                                        const mid = Number(m);
                                        if (Number.isNaN(mid)) return;
                                        const name = staffMap.get(mid) || String(mid);
                                        names.push(name);
                                    });
                                    
                                    const authId = String(row.auth_member);
                                    const authName = profilesMap.get(authId) || authId;
                                    // Only add if not already included as a staff member
                                    if (!names.includes(authName)) {
                                        names.push(authName);
                                    }
                                }
                                
                                salesTeamMembersMap.set(tid, names);
                            });
                        }
                    } catch (e) {
                        console.error('ExportAsPDF: error resolving sales team members', e);
                    }
                }

                // Assign resolved sales person names back onto each order
                ordersMap.forEach((orderObj: any, key: string) => {
                    const tid = Number(orderObj.sales_team_id);
                    const names = !Number.isNaN(tid) ? salesTeamMembersMap.get(tid) : null;
                    // Only assign a value if header will not be shown, otherwise set undefined
                    orderObj.salesPerson = names && names.length > 0 ? names.join(', ') : undefined;
                    ordersMap.set(key, orderObj);
                });

                // Build product-level rows for each order with a per-order header
                // Also accumulate a gross-based Total Sales (gross - cartDiscount - productDiscount)
                for (const [oIdStr, orderObj] of Array.from(ordersMap.entries())) {
                    const items = orderObj.items as any[];
                    const totalQty = items.reduce((s, it) => s + (it.quantityNum || 0), 0);
                    // orderTotal: sum of rowTotalNum (this may include applied discounts / stored row total)
                    const orderTotal = items.reduce((s, it) => s + (it.rowTotalNum || 0), 0);
                    // grossAmount: total of product price * quantity BEFORE any discounts
                    const grossAmount = items.reduce((s, it) => s + (Number(it.productPrice || 0) * Number(it.quantityNum || 0)), 0);

                    // Cart discount text (presentation)
                    const cartDiscounts = cartMapLocal.get(oIdStr) || [];
                    const cartDiscountText = (cartDiscounts || []).map((d: any) => {
                        const amount = d?.discount_amount;
                        return amount != null && amount !== '' ? `${amount}%` : String(amount ?? '');
                    }).join(' | ');

                    // Product discounts (presentation): show product name and discount amount/percentage only.
                    const productDiscountText = items.map((it) => {
                        const key = `${oIdStr}_${String(it.productId)}`;
                        const pds = productMapLocal.get(key) || [];
                        return pds.map((d: any) => {
                            const amount = d?.discount_amount;
                            return amount != null && amount !== '' ? `${it.productName}: ${amount}%` : `${it.productName}: ${String(amount ?? '')}`;
                        }).join(' | ');
                    }).filter(Boolean).join('\n');

                    // If no product discount text, show a dash to indicate empty
                    const displayProductDiscountText = productDiscountText && String(productDiscountText).trim() !== '' ? productDiscountText : '-';

                    // Compute numeric discount totals for final price calculation using sequential logic:
                    // 1) Apply cart-level discounts first (explicit currency values and percentage components)
                    // 2) Then apply product-level discounts on the amounts after cart percentage has been applied to each line
                    let cartDiscountTotal = 0;
                    let cartPercentTotal = 0; // sum of percent-based cart discounts
                    (cartDiscounts || []).forEach((d: any) => {
                        if (!d) return;
                        if (d.discount_value != null && d.discount_value !== '') {
                            cartDiscountTotal += Number(d.discount_value) || 0;
                        } else if (d.discount_amount != null && d.discount_amount !== '') {
                            cartPercentTotal += Number(d.discount_amount) || 0;
                        }
                    });

                    // Currency value of cart percent discounts against the order total
                    if (cartPercentTotal > 0) {
                        cartDiscountTotal += ((Number(orderTotal || 0) * cartPercentTotal) / 100);
                    }

                    // If no cart discount text, show a dash to indicate empty
                    const displayCartDiscountText = cartDiscountText && String(cartDiscountText).trim() !== '' ? cartDiscountText : '-';

                    // Determine cart percent factor (for per-line adjustments)
                    const cartPct = cartPercentTotal > 0 ? (cartPercentTotal / 100) : 0;

                    // Product discounts after applying cart percent to each line
                    const productDiscountTotal = items.reduce((sum: number, it: any) => {
                        const key = `${oIdStr}_${String(it.productId)}`;
                        const pds = productMapLocal.get(key) || [];
                        // amount of this line after applying cart percent
                        const itemRowAfterCart = Number(it.rowTotalNum || 0) * (1 - cartPct);
                        pds.forEach((d: any) => {
                            if (d == null) return;
                            if (d.discount_value != null && d.discount_value !== '') {
                                // explicit currency value applied to product after cart percent
                                sum += Number(d.discount_value) || 0;
                            } else if (d.discount_amount != null && d.discount_amount !== '') {
                                const pct = Number(d.discount_amount) || 0;
                                sum += (itemRowAfterCart * pct) / 100;
                            }
                        });
                        return sum;
                    }, 0);

                    // Final price after discounts (ensure not negative)
                    const postCartTotal = Math.max(0, Number(orderTotal || 0) - cartDiscountTotal);
                    const finalPriceNum = Math.max(0, postCartTotal - Number(productDiscountTotal || 0));
                    const finalPriceText = `$${Number(finalPriceNum).toFixed(2)}`;

                    // Accumulate total sales as the net amount after discounts (finalPriceNum)
                    totalSalesNet += Number(finalPriceNum || 0);

                    // Prepare per-order totals and product rows so we can render each order separately
                    const totalsForBlock = { orderTotal: grossAmount, cartDiscountTotal, productDiscountTotal, finalPriceNum };

                    // Save totals and product rows on the order object for later per-order rendering
                    const productRows: any[] = [];

                    // Prepare the green header row for this order (used when rendering the products table)
                    const perOrderHeader = tableColumn.map((col) => ({
                        content: col,
                        styles: { halign: 'center', fillColor: [0, 150, 136], textColor: [255, 255, 255], fontStyle: 'bold' }
                    }));

                    // For each product in the order, add a product-level row matching the desired table
                    for (const it of items) {
                        // Category name: try to lookup from productsRaw if available
                        let categoryName = '';
                        try {
                            const prod = productsRaw?.find((p: any) => String(p.product_id) === String(it.productId));
                            if (prod && prod.category_id) categoryName = String(prod.category_id);
                        } catch (e) { /* ignore */ }

                        const productName = it.productName || '';
                        const qty = Number(it.quantityNum || 0);
                        const amountNum = Number(it.rowTotalNum || 0);

                        // compute product discount percent and amount after discount per item
                        const key = `${oIdStr}_${String(it.productId)}`;
                        const pds = productMapLocal.get(key) || [];
                        let pctSum = 0;
                        let productDiscountAmount = 0;
                        const itemRowAfterCart = Number(it.rowTotalNum || 0) * (1 - cartPct);
                        pds.forEach((d: any) => {
                            if (d == null) return;
                            if (d.discount_amount != null && d.discount_amount !== '') {
                                const pct = Number(d.discount_amount) || 0;
                                pctSum += pct;
                                productDiscountAmount += (itemRowAfterCart * pct) / 100;
                            } else if (d.discount_value != null && d.discount_value !== '') {
                                productDiscountAmount += Number(d.discount_value) || 0;
                            }
                        });

                        const amountAfter = Math.max(0, itemRowAfterCart - productDiscountAmount);

                        const productRow = [
                            categoryName,
                            productName,
                            String(qty),
                            `$${Number(amountNum).toFixed(2)}`,
                            `${pctSum}%`,
                            `$${Number(amountAfter).toFixed(2)}`,
                        ];

                        productRows.push(productRow);
                    }
                    // persist computed data to the order object for later rendering
                    ordersMap.get(oIdStr).totals = totalsForBlock;
                    ordersMap.get(oIdStr).productRows = productRows;
                    ordersMap.get(oIdStr).perOrderHeader = perOrderHeader;
                    totalAmount += Number(orderTotal || 0);
                }
            } else {
                // Add a "No Records" message row
                tableRows.push([
                    { content: 'No records found for the selected date range', colSpan: tableColumn.length, styles: { halign: 'center', fontStyle: 'italic' } }
                ]);
            }

            // Add total row (will show $0.00 if no records)
            const totalRow = [
                { content: 'Total', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `$${totalAmount.toFixed(2)}`, colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
            ];
            tableRows.push(totalRow);

            // Debug: log table columns/rows and totals
            try {
                console.log('[ExportAsPDF] tableColumn:', tableColumn);
                console.log('[ExportAsPDF] tableRows (first 10 rows):', tableRows.slice(0, 10));
                console.log('[ExportAsPDF] totalAmount:', totalAmount);
            } catch (e) { /* ignore in non-browser env */ }

            // Compute total receivables using tender breakdown (cash + card + zelle) with paid_amount as fallback
            let totalReceivables = 0;
            try {
                const toNum = (v: any) => {
                    const n = Number(v);
                    return Number.isFinite(n) ? n : 0;
                };
                for (const [, orderObj] of Array.from(ordersMap.entries())) {
                    const cash = toNum(orderObj.cash);
                    const card = toNum(orderObj.card);
                    const zelle = toNum(orderObj.zelle);
                    const paidFallback = toNum(orderObj.paid_amount);
                    const totalTender = Number((cash + card + zelle).toFixed(2));
                    totalReceivables += totalTender || paidFallback;
                }
            } catch (e) {
                // ignore any malformed entries
            }

            // Check if all orders have the same sales person
            const allSalesPersons = new Set<string>();
            const allOrdersSalesPerson: string[] = [];
            ordersMap.forEach((orderObj: any) => {
                allOrdersSalesPerson.push(orderObj.salesPerson || 'Sales person not assigned');
                if (orderObj.salesPerson && orderObj.salesPerson !== 'Sales person not assigned') {
                    // Split comma-separated names and add individually
                    const names = orderObj.salesPerson.split(',').map((n: string) => n.trim()).filter(Boolean);
                    names.forEach((name: string) => allSalesPersons.add(name));
                }
            });
            
            // Check if all orders have identical sales person
            const allSalesPersonsSame = allOrdersSalesPerson.length > 0 && allOrdersSalesPerson.every((sp: string) => sp === allOrdersSalesPerson[0]);
            const salesPersonSummary = allSalesPersons.size > 0 ? Array.from(allSalesPersons).join(', ') : 'Sales person not assigned';
            
            // Only show header sales person if all orders have the same sales person
            const showHeaderSalesPerson = allSalesPersonsSame && ordersMap.size > 0;

            // Create PDF document
            const doc = new jsPDF();

            // Title Section: Heading, Date Range, Location and Total Sales on the right
            doc.setFontSize(16);
            doc.text('Sales History Report', 14, 20);
            doc.setFontSize(12);

            // Date Range (left)
            doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);

            // Total Receivables (right, shown once)
            try {
                // place at right margin, align right
                doc.text(`Total Receivables: $${Number(totalReceivables || 0).toFixed(2)}`, 195, 30, { align: 'right' });
                // Show Total Sales (sum of net amounts) below receivables
                doc.text(`Total Sales: $${Number(totalSalesNet || 0).toFixed(2)}`, 195, 36, { align: 'right' });
                // Bonus and Paid Bonus (right)
                doc.text(`Bonus: $${Number(totalBonus || 0).toFixed(2)}`, 195, 42, { align: 'right' });
                doc.text(`Paid Bonus: $${Number(totalPaidBonus || 0).toFixed(2)}`, 195, 48, { align: 'right' });
            } catch (e) {
                // fallback: place without alignment
                doc.text(`Total Receivables: $${Number(totalReceivables || 0).toFixed(2)}`, 160, 30);
                doc.text(`Total Sales: $${Number(totalSalesNet || 0).toFixed(2)}`, 160, 36);
                doc.text(`Bonus: $${Number(totalBonus || 0).toFixed(2)}`, 160, 42);
                doc.text(`Paid Bonus: $${Number(totalPaidBonus || 0).toFixed(2)}`, 160, 48);
            }

            // Location Title (left, below date range)
            doc.text(`Location: ${selectedLocation.title}`, 14, 40);  // Adjust for the selectedLocation name

            // Sales Person section with grey background (below location) - only if all orders have same sales person
            if (showHeaderSalesPerson) {
                const salesPersonY = 50;
                
                doc.setFontSize(10);
                try { doc.setFont('helvetica', 'bold'); } catch (e) {}
                const labelText = 'Sales Person: ';
                const labelWidth = doc.getTextWidth(labelText);
                
                try { doc.setFont('helvetica', 'normal'); } catch (e) {}
                const valueWidth = doc.getTextWidth(salesPersonSummary);
                
                // Calculate total width needed with some padding
                const totalWidth = labelWidth + valueWidth + 8; // 8px padding (4px on each side)
                
                doc.setFillColor(240, 240, 240); // Light grey background
                doc.rect(14, salesPersonY - 6, totalWidth, 12, 'F'); // Grey background rectangle with dynamic width
                
                try { doc.setFont('helvetica', 'bold'); } catch (e) {}
                try { doc.setTextColor(60, 60, 67); } catch (e) {}
                doc.text(labelText, 16, salesPersonY);
                
                try { doc.setFont('helvetica', 'normal'); } catch (e) {}
                doc.text(salesPersonSummary, 16 + labelWidth, salesPersonY);
                
                // Reset text color
                try { doc.setTextColor(0, 0, 0); } catch (e) {}
            }

            // Add some space before the table
            doc.setLineWidth(0.5);
            doc.line(14, 60, 195, 60); // Horizontal line after the header (moved down to allow bonus fields)

            // Generate the table in the PDF
            // DEBUG: log final PDF payload that's passed into autoTable
            try {
                // logging removed for production
            } catch (e) { console.error('ExportAsPDF: Error logging PDF payload', e); }

            // Render each order separately: draw the patient/invoice block manually
            // and then render that order's product table. This lets us measure
            // remaining space and force a page break so an order is never split.
            const PAGE_WIDTH = doc.internal.pageSize.getWidth();
            const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
            const LEFT_MARGIN = 14;
            const RIGHT_MARGIN = 14;
            const START_Y = 66;
            let cursorY = START_Y;

            for (const [oIdStr, orderObj] of Array.from(ordersMap.entries())) {
                try {
                    const totals = orderObj.totals || { orderTotal: 0, cartDiscountTotal: 0, productDiscountTotal: 0, finalPriceNum: 0 };
                    const productRows = orderObj.productRows || [];
                    const header = orderObj.perOrderHeader || tableColumn.map((col) => ({ content: col }));

                    // Hide per-order sales person if header is shown (force undefined)
                    const info = getOrderInfoData({
                        patientName: orderObj.patientName,
                        email: orderObj.email,
                        phone: orderObj.phone,
                        salesPerson: showHeaderSalesPerson ? undefined : (orderObj.salesPerson || undefined),
                        orderId: orderObj.order_id,
                        date: orderObj.date,
                        paymentType: orderObj.paymentType,
                        cash: orderObj.cash,
                        card: orderObj.card,
                        zelle: orderObj.zelle,
                    }, totals, tableColumn.length);

                    const infoBlockHeight = Math.max(info.minPatientHeight, info.minInvoiceHeight);

                    // Estimate product table height: header + rows
                    const headerHeightEstimate = 12;
                    const rowHeightEstimate = 10;
                    const spacerAfter = 8;
                    const productTableEstimate = headerHeightEstimate + (productRows.length * rowHeightEstimate) + spacerAfter;

                    const totalNeeded = infoBlockHeight + productTableEstimate + 12; // some padding

                    // If not enough space on current page, start a new page
                    if (cursorY + totalNeeded > PAGE_HEIGHT - 20) {
                        doc.addPage();
                        cursorY = START_Y;
                    }

                    // Draw bounding box for the info block (subtle border)
                    const contentWidth = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(LEFT_MARGIN, cursorY - 6, contentWidth, infoBlockHeight + 8, 'S');

                    // Draw headers
                    const leftX = LEFT_MARGIN + 8;
                    const rightX = LEFT_MARGIN + (contentWidth / 2) + 8;
                    const titleY = cursorY + 6;
                    try { doc.setFont('helvetica', 'bold'); } catch (e) {}
                    doc.setFontSize(10);
                    // Draw section titles in blue
                    try { doc.setTextColor(0, 102, 204); } catch (e) {}
                    doc.text('Patient Details', leftX, titleY);
                    doc.text('Invoice Summary', rightX, titleY);
                    // reset text color for content lines
                    try { doc.setTextColor(60, 60, 67); } catch (e) {}

                    // Draw patient lines (left)
                    let yLeft = titleY + 8;
                    doc.setFontSize(9);
                    for (const line of info.patientLines) {
                        // Check if this is the Sales Person line (marked with special prefix)
                        const isSalesPerson = line.startsWith('__SALESPERSON__');
                        const displayLine = isSalesPerson ? line.replace('__SALESPERSON__', '') : line;
                        
                        // Draw grey background for Sales Person line
                        if (isSalesPerson) {
                            doc.setFillColor(240, 240, 240); // Light grey background
                            const lineWidth = contentWidth / 2 - 16; // Half width minus padding
                            doc.rect(leftX - 4, yLeft - 6, lineWidth, 8, 'F');
                        }
                        
                        const idx = displayLine.indexOf(':');
                        if (idx > -1) {
                            const label = displayLine.substring(0, idx + 1);
                            const value = displayLine.substring(idx + 1).trim();
                            try { doc.setFont('helvetica', 'bold'); } catch (e) {}
                            doc.text(label + ' ', leftX, yLeft);
                            const labelW = doc.getTextWidth(label + ' ');
                            try { doc.setFont('helvetica', 'normal'); } catch (e) {}
                            doc.text(String(value), leftX + labelW, yLeft);
                        } else {
                            try { doc.setFont('helvetica', 'normal'); } catch (e) {}
                            doc.text(displayLine, leftX, yLeft);
                        }
                        yLeft += 9 * 1.0;
                    }

                    // Draw invoice lines (right)
                    let yRight = titleY + 8;
                    doc.setFontSize(8);
                    for (const line of info.invoiceLines) {
                        const idx = line.indexOf(':');
                        if (idx > -1) {
                            const label = line.substring(0, idx + 1);
                            const value = line.substring(idx + 1).trim();
                            try { doc.setFont('helvetica', 'bold'); } catch (e) {}
                            doc.text(label + ' ', rightX, yRight);
                            const labelW = doc.getTextWidth(label + ' ');
                            try { doc.setFont('helvetica', 'normal'); } catch (e) {}
                            doc.text(String(value), rightX + labelW, yRight);
                        } else {
                            try { doc.setFont('helvetica', 'normal'); } catch (e) {}
                            doc.text(line, rightX, yRight);
                        }
                        yRight += 8 * 1.0;
                    }

                    // Advance cursorY past the info block
                    cursorY += infoBlockHeight + 12;

                    // Render the product table for this order
                    autoTable(doc, {
                        startY: cursorY,
                        margin: { left: LEFT_MARGIN, right: RIGHT_MARGIN },
                        head: [header.map((h: any) => (typeof h === 'string' ? h : h.content))],
                        body: productRows,
                        theme: 'grid',
                        headStyles: { fillColor: [0, 150, 136], textColor: [255, 255, 255], halign: 'center' },
                        styles: { fontSize: 8 }
                    });

                    // Update cursorY to the end of the table
                    cursorY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : cursorY + productTableEstimate;
                } catch (e) {
                    console.error('ExportAsPDF: error rendering order', oIdStr, e);
                }
            }

            // Save the generated PDF
            doc.save('sales_history_report.pdf');
            setLoading(false);
            toast.success('PDF generated successfully!');

            // Close the modal after PDF is generated
            handleClose();
        } catch (error) {
            setLoading(false);
            console.error('Error generating PDF:', error);
            toast.error('An error occurred while generating the PDF');
        }
    };

    return (
        <>
            <DateRangeModal
                open={open}
                handleOpen={handleOpen}
                handleClose={handleClose}
                generatePdfHandle={generatePDF}
                loading={loading}
            />
        </>
    );
};

export default ExportAsPDF;
