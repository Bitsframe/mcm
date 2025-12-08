export function buildOrderInfoBlock(orderObj: any, totals: any, colCount: number) {
    // colCount is total number of columns in the main table
    const leftColSpan = Math.max(3, Math.floor(colCount * 0.5));
    const rightColSpan = colCount - leftColSpan;

    // Helper: format date without time as '27 Oct 2025'
    function formatDateOnly(dateStr: string) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const day = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleString('en-US', { month: 'short' });
            const year = d.getFullYear();
            return `${day} ${month} ${year}`;
        } catch (e) { return dateStr; }
    }

    const patientLines = [];
    patientLines.push(`Patient Name: ${orderObj.patientName || ''}`);
    if (orderObj.phone) patientLines.push(`Phone: ${orderObj.phone}`);
    if (orderObj.email) patientLines.push(`Email: ${orderObj.email}`);
    if (orderObj.treatment) patientLines.push(`Treatment Type: ${orderObj.treatment}`);

    const invoiceLines = [];
    invoiceLines.push(`Invoice Date: ${formatDateOnly(orderObj.date || '')}`);
    invoiceLines.push(`Order ID: ${orderObj.order_id || orderObj.orderId || ''}`);
    invoiceLines.push(`Payment Method: ${orderObj.paymentType || ''}`);
    if (orderObj.cash != null) {
        if (orderObj.cash === '-') invoiceLines.push(`Cash Amount: -`);
        else invoiceLines.push(`Cash Amount: $${Number(orderObj.cash || 0).toFixed(2)}`);
    }
    if (orderObj.card != null) {
        if (orderObj.card === '-') invoiceLines.push(`Card Amount: -`);
        else invoiceLines.push(`Card Amount: $${Number(orderObj.card || 0).toFixed(2)}`);
    }
    invoiceLines.push(`Gross Amount: $${Number(totals.orderTotal || 0).toFixed(2)}`);
    invoiceLines.push(`Discount (cart): -$${Number(totals.cartDiscountTotal || 0).toFixed(2)}`);
    invoiceLines.push(`Product Discount: -$${Number(totals.productDiscountTotal || 0).toFixed(2)}`);
    invoiceLines.push(`Net Amount: $${Number(totals.finalPriceNum || 0).toFixed(2)}`);

    // Header row (section titles) with subtle background and bold font
    const headerLeft = {
        content: 'Patient Details',
        colSpan: leftColSpan,
        styles: { halign: 'left', fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [15, 23, 42] }
    } as any;

    const headerRight = {
        content: 'Invoice Summary',
        colSpan: rightColSpan,
        styles: { halign: 'left', fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [15, 23, 42] }
    } as any;

    // Content row with normal font and slightly darker text
    // Return structured patient content so we can render labels bold in the same way as invoice
    const approxPatientLineHeight = 7; // points
    const minPatientHeight = Math.max(Math.ceil(approxPatientLineHeight * patientLines.length + 6), 26);
    const contentLeft = {
        // attach the order id so rendering layer can avoid double-drawing when rows span pages
        content: { __patient: true, lines: patientLines, order_id: orderObj.order_id || null },
        colSpan: leftColSpan,
        styles: { halign: 'left', valign: 'top', fontStyle: 'normal', textColor: [60,60,67], minCellHeight: minPatientHeight }
    } as any;

    // Return structured invoice content so the table drawing hook can render
    // labels in bold and values normal. Set a smaller minCellHeight to reduce gap.
    // Increase the min height allocation to ensure bottom lines (Product Discount, Net Amount)
    // are visible on tighter layouts or when table headers occupy space above.
    const approxLineHeight = 8.5; // points per line
    const minHeight = Math.max(Math.ceil(approxLineHeight * invoiceLines.length + 8), 48);
    const contentRight = {
        // attach the order id to the invoice cell too
        content: { __invoice: true, lines: invoiceLines, order_id: orderObj.order_id || null },
        colSpan: rightColSpan,
        styles: { halign: 'left', valign: 'top', fontStyle: 'normal', textColor: [60,60,67], minCellHeight: minHeight }
    } as any;

    return [[headerLeft, headerRight], [contentLeft, contentRight]];
}

// Return structured data about the order info block so calling code can
// render it manually (and measure heights) when needed.
export function getOrderInfoData(orderObj: any, totals: any, colCount: number) {
    // create the same patient and invoice lines and min heights used by buildOrderInfoBlock
    function formatDateOnly(dateStr: string) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const day = String(d.getDate()).padStart(2, '0');
            const month = d.toLocaleString('en-US', { month: 'short' });
            const year = d.getFullYear();
            return `${day} ${month} ${year}`;
        } catch (e) { return dateStr; }
    }

    const patientLines: string[] = [];
    patientLines.push(`Patient Name: ${orderObj.patientName || ''}`);
    if (orderObj.phone) patientLines.push(`Phone: ${orderObj.phone}`);
    if (orderObj.email) patientLines.push(`Email: ${orderObj.email}`);
    // Add Sales Person with special marker for grey background rendering - only if salesPerson is defined and not empty
    if (orderObj.salesPerson) {
        patientLines.push(`__SALESPERSON__Sales Person: ${orderObj.salesPerson}`);
    }

    const invoiceLines: string[] = [];
    invoiceLines.push(`Invoice Date: ${formatDateOnly(orderObj.date || '')}`);
    invoiceLines.push(`Order ID: ${orderObj.order_id || orderObj.orderId || ''}`);
    invoiceLines.push(`Payment Method: ${orderObj.paymentType || ''}`);
    if (orderObj.cash != null) {
        if (orderObj.cash === '-') invoiceLines.push(`Cash Amount: -`);
        else invoiceLines.push(`Cash Amount: $${Number(orderObj.cash || 0).toFixed(2)}`);
    }
    if (orderObj.card != null) {
        if (orderObj.card === '-') invoiceLines.push(`Card Amount: -`);
        else invoiceLines.push(`Card Amount: $${Number(orderObj.card || 0).toFixed(2)}`);
    }
    invoiceLines.push(`Gross Amount: $${Number(totals.orderTotal || 0).toFixed(2)}`);
    invoiceLines.push(`Discount (cart): -$${Number(totals.cartDiscountTotal || 0).toFixed(2)}`);
    invoiceLines.push(`Product Discount: -$${Number(totals.productDiscountTotal || 0).toFixed(2)}`);
    invoiceLines.push(`Net Amount: $${Number(totals.finalPriceNum || 0).toFixed(2)}`);

    const approxPatientLineHeight = 7; // points
    const minPatientHeight = Math.max(Math.ceil(approxPatientLineHeight * patientLines.length + 6), 26);

    const approxLineHeight = 8.5; // points per line
    const minInvoiceHeight = Math.max(Math.ceil(approxLineHeight * invoiceLines.length + 8), 48);

    return {
        patientLines,
        invoiceLines,
        minPatientHeight,
        minInvoiceHeight,
    } as const;
}

const PdfHelpers = { buildOrderInfoBlock, getOrderInfoData } as const;

export default PdfHelpers;
