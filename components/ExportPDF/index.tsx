import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useContext, useState } from 'react';
import DateRangeModal from './DateRangeModal';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services';
import { LocationContext } from '@/context';
import { toast } from 'react-toastify'; // Import the toast library

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
                                            console.log("ExportAsPDF.generatePDF called", {
                                                startDate,
                                                endDate,
                                                selectedLocation: selectedLocation?.title,
                                                pdfFields: ["Order ID", "Date", "Patient Name", "Total Amount", "Payment Type"],
                                            });
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
                    orders(order_id, pos:allpatients (
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
                console.log('sales_history fetched_data (expanded):', fetched_data);
            } catch (e) {
                // ignore in non-browser env
            }

            // Fetch discounts for the orders present in the fetched sales_history rows
            try {
                const orderIds = Array.from(new Set((fetched_data || []).map((row: any) => row.orders?.order_id).filter(Boolean)));
                if (orderIds.length > 0) {
                    const discounts = await fetch_content_service({
                        table: 'discounts',
                        language: '',
                        filterOptions: [{ column: 'order_id', operator: 'in', value: orderIds }]
                    });
                    try { console.log('discounts for orders:', discounts); } catch (e) {}
                } else {
                    try { console.log('No order IDs found in sales_history to fetch discounts'); } catch (e) {}
                }
            } catch (e) {
                console.error('Error fetching discounts for orders:', e);
            }

            // Define table column headers (include product details)
            const tableColumn = ['Order ID', 'Date', 'Patient Name', 'Product Name', 'Product Price', 'Quantity', 'Total Amount', 'Payment Type'];
            const tableRows: (string[] | object[])[] = [];
            let totalAmount = 0;

            // Populate the PDF rows using nested relations (orders, inventory.products)
            if (fetched_data && fetched_data.length > 0) {
                fetched_data.forEach((item: any) => {
                    const orderId = item.orders?.order_id || item.order_id || '';
                    const salesHistoryId = item.sales_history_id ? item.sales_history_id.toString() : '';
                    const dateStr = item.date_sold ? new Date(item.date_sold).toLocaleString() : '';
                    const patientName = item.orders?.pos ? `${item.orders.pos.firstname || ''} ${item.orders.pos.lastname || ''}`.trim() : '';

                    const productName = item.inventory?.products?.product_name || item.inventory?.product_name || '';
                    const productPriceNum = item.inventory?.products?.price ?? item.inventory?.price ?? item.price ?? 0;
                    const productPrice = `$${Number(productPriceNum).toFixed(2)}`;

                    const quantity = item.quantity_sold != null ? String(item.quantity_sold) : '';
                    const rowTotalNum = item.total_price != null ? Number(item.total_price) : 0;
                    const rowTotal = `$${rowTotalNum.toFixed(2)}`;

                    const paymentType = item.paymentcash ? 'Cash' : 'Card';

                    // Build the row: keep existing fields and add product details
                    const rowData = [
                        String(orderId || salesHistoryId),
                        dateStr,
                        patientName,
                        productName,
                        productPrice,
                        quantity,
                        rowTotal,
                        paymentType,
                    ];

                    tableRows.push(rowData);
                    totalAmount += parseFloat(String(rowTotalNum || 0));
                });
            } else {
                // Add a "No Records" message row
                tableRows.push([
                    { content: 'No records found for the selected date range', colSpan: tableColumn.length, styles: { halign: 'center', fontStyle: 'italic' } }
                ]);
            }

            // Add total row (will show $0.00 if no records)
            const totalRow = [
                { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: `$${totalAmount.toFixed(2)}`, colSpan: 2, styles: { halign: 'left', fontStyle: 'bold' } },
            ];
            tableRows.push(totalRow);

            // Create PDF document
            const doc = new jsPDF();

            // Title Section: Heading, Date Range, and Location
            doc.setFontSize(16);
            doc.text('Sales History Report', 14, 20);
            doc.setFontSize(12);

            // Date Range
            doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);
            
            // Location Title
            doc.text(`Location: ${selectedLocation.title}`, 14, 40);  // Adjust for the selectedLocation name

            // Add some space before the table
            doc.setLineWidth(0.5);
            doc.line(14, 45, 195, 45); // Horizontal line after the header

            // Generate the table in the PDF
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,  // Starting point for the table
                margin: { top: 20 },
                theme: 'grid', // Optional theme for styling
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
