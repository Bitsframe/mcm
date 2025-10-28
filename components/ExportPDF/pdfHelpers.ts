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
    invoiceLines.push(`Payment Method: ${orderObj.paymentType || ''}`);
    if (orderObj.cash != null) invoiceLines.push(`Cash Amount: $${Number(orderObj.cash || 0).toFixed(2)}`);
    if (orderObj.card != null) invoiceLines.push(`Card Amount: $${Number(orderObj.card || 0).toFixed(2)}`);
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
    const contentLeft = {
        content: patientLines.join('\n'),
        colSpan: leftColSpan,
        styles: { halign: 'left', valign: 'top', fontStyle: 'normal', textColor: [60,60,67] }
    } as any;

    const contentRight = {
        content: invoiceLines.join('\n'),
        colSpan: rightColSpan,
        styles: { halign: 'left', valign: 'top', fontStyle: 'normal', textColor: [60,60,67] }
    } as any;

    return [[headerLeft, headerRight], [contentLeft, contentRight]];
}

export default {};
