import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useContext, useState } from 'react';
import DateRangeModal from './DateRangeModal';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { LocationContext } from '@/context';
import { toast } from 'react-toastify'; // Import the toast library
import { buildOrderInfoBlock } from './pdfHelpers';

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

    // Function to generate the PDF
    const generatePDF = async (startDate: string, endDate: string) => {
        setLoading(true);

        try {
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
                // Select related records: orders (with pos/patient), inventory (with product)
                selectParam: `,
                    orders(order_id, paid_amount, cash, card, pos:allpatients (
                        lastname,
                        firstname,
                        email,
                        phone,
                        dob,
                        locationid
                    )),
                    inventory(inventory_id, product_id, products (
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
                matchCase: { key: 'orders.pos.locationid', value: selectedLocation.id },
                filterOptions: [
                    { column: 'created_at', operator: 'gte', value: startDate },
                    { column: 'created_at', operator: 'lte', value: endDate },
                    { column: 'orders.pos', operator: 'not', value: null },
                    { column: 'orders', operator: 'not', value: null },
                ]
            });

            // For debugging: log the fetched structure that includes sales_history rows with nested orders, inventory and products
            try {
                console.log('[ExportAsPDF] generatePDF called', { startDate, endDate, selectedLocation });
                console.log('[ExportAsPDF] fetched_data (raw):', fetched_data);
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
                    console.log('[ExportAsPDF] discountsForOrders for orderIds', orderIds, discountsForOrders);
                } else {
                    console.log('[ExportAsPDF] no orderIds found for discounts lookup');
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
                    console.log('[ExportAsPDF] allDiscounts summary (debug):', summary);
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
                    console.log('[ExportAsPDF] ordersRaw for derivedOrderIds', derivedOrderIds, ordersRaw);
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

            // Populate the PDF rows using nested relations (orders, inventory.products)
            if (fetched_data && fetched_data.length > 0) {
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
                fetched_data.forEach((item: any) => {
                    const orderId = item.orders?.order_id || item.order_id || '';
                    const oIdStr = String(orderId);
                    const salesHistoryId = item.sales_history_id ? item.sales_history_id.toString() : '';
                    const dateStr = item.date_sold ? new Date(item.date_sold).toLocaleString() : '';
                    const patientName = item.orders?.pos ? `${item.orders.pos.firstname || ''} ${item.orders.pos.lastname || ''}`.trim() : '';
                    const paymentType = item.paymentcash ? 'Cash' : 'Card';

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
                            paymentType,
                            // store contact and payment info for the per-order header block
                            email: item.orders?.pos?.email || '',
                            phone: item.orders?.pos?.phone || '',
                            cash: item.orders?.paid_amount != null ? Number(item.orders?.paid_amount || 0) : (item.orders?.cash != null ? Number(item.orders.cash) : undefined),
                            card: item.orders?.card != null ? Number(item.orders.card) : undefined,
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

                // Build product-level rows for each order with a per-order header
                for (const [oIdStr, orderObj] of Array.from(ordersMap.entries())) {
                    const items = orderObj.items as any[];
                    const totalQty = items.reduce((s, it) => s + (it.quantityNum || 0), 0);
                    const orderTotal = items.reduce((s, it) => s + (it.rowTotalNum || 0), 0);

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

                    // Insert a per-order patient details / invoice summary block above the green header
                    const totalsForBlock = { orderTotal, cartDiscountTotal, productDiscountTotal, finalPriceNum };
                    const infoBlockRows = buildOrderInfoBlock({
                        patientName: orderObj.patientName,
                        email: orderObj.email,
                        phone: orderObj.phone,
                        date: orderObj.date,
                        paymentType: orderObj.paymentType,
                        cash: orderObj.cash,
                        card: orderObj.card,
                    }, totalsForBlock, tableColumn.length);
                    infoBlockRows.forEach(r => tableRows.push(r as any));

                    // Insert a green header row for this order to visually separate orders
                    const perOrderHeader = tableColumn.map((col) => ({
                        content: col,
                        styles: { halign: 'center', fillColor: [0, 150, 136], textColor: [255, 255, 255], fontStyle: 'bold' }
                    }));
                    tableRows.push(perOrderHeader as any);

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

                        tableRows.push(productRow);
                    }

                    // Add a spacer row after each order to create a clear white gap.
                    // Mark it via a custom style flag so we can detect it in autoTable hooks.
                    tableRows.push([
                        { content: '', colSpan: tableColumn.length, styles: { minCellHeight: 18, fillColor: [255, 255, 255], isSpacer: true, cellPadding: 0 } }
                    ]);
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

            // Compute total sales using cash + card values from grouped orders (one-time top summary)
            let totalSales = 0;
            try {
                for (const [, orderObj] of Array.from(ordersMap.entries())) {
                    const cashVal = Number(orderObj.cash ?? 0) || 0;
                    const cardVal = Number(orderObj.card ?? 0) || 0;
                    totalSales += cashVal + cardVal;
                }
            } catch (e) {
                // ignore any malformed entries
            }

            // Create PDF document
            const doc = new jsPDF();

            // Title Section: Heading, Date Range, Location and Total Sales on the right
            doc.setFontSize(16);
            doc.text('Sales History Report', 14, 20);
            doc.setFontSize(12);

            // Date Range (left)
            doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);

            // Total Sales (right, shown once)
            try {
                // place at right margin, align right
                doc.text(`Total Sales: $${Number(totalSales || 0).toFixed(2)}`, 195, 30, { align: 'right' });
            } catch (e) {
                // fallback: place without alignment
                doc.text(`Total Sales: $${Number(totalSales || 0).toFixed(2)}`, 160, 30);
            }

            // Location Title (left, below date range)
            doc.text(`Location: ${selectedLocation.title}`, 14, 40);  // Adjust for the selectedLocation name

            // Add some space before the table
            doc.setLineWidth(0.5);
            doc.line(14, 45, 195, 45); // Horizontal line after the header

            // Generate the table in the PDF
            // DEBUG: log final PDF payload that's passed into autoTable
            try {
                // logging removed for production
            } catch (e) { console.error('ExportAsPDF: Error logging PDF payload', e); }

            // Use per-order header rows inserted into the body instead of a single global head
            // to avoid duplicate/empty header rows being rendered at the start of each page.
            autoTable(doc, {
                head: [],
                body: tableRows,
                startY: 50,  // Starting point for the table
                margin: { top: 20 },
                theme: 'grid', // Optional theme for styling
                // Ensure default head styles aren't applied since head is empty
                didParseCell: function (data: any) {
                    try {
                        // Ensure spacer cells have no text
                        if (data.cell && data.cell.styles && data.cell.styles.isSpacer) {
                            data.cell.text = '';
                        }
                    } catch (e) {
                        // ignore
                    }
                },
                didDrawCell: function (data: any) {
                    try {
                        // Draw a white rectangle over spacer rows to fully hide any grid lines
                        if (data.cell && data.cell.styles && data.cell.styles.isSpacer) {
                            const cell = data.cell;
                            const x = cell.x;
                            const y = cell.y;
                            const w = cell.width;
                            const h = cell.height;
                            doc.setFillColor(255, 255, 255);
                            doc.rect(x, y, w, h, 'F');
                        }
                    } catch (e) {
                        // ignore
                    }
                }
            });

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
