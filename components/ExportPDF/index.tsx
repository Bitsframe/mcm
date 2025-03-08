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
            // Fetch the data with date range filter
            const fetched_data = await fetch_content_service({
                table: 'sales_history',
                language: '',
                selectParam: `,
                    orders(pos:pos (
                    lastname,
                    firstname,
                    locationid
                )),
                date_sold,
                quantity_sold,
                total_price
                `,
                matchCase: { key: 'orders.pos.locationid', value: selectedLocation.id },
                filterOptions: [
                    { column: 'created_at', operator: 'gte', value: startDate },
                    { column: 'created_at', operator: 'lte', value: endDate },
                    { column: 'orders.pos', operator: 'not', value: null },
                    { column: 'orders', operator: 'not', value: null },
                ]
            });

            // Define table column headers
            const tableColumn = ['Order ID', 'Date', 'Patient Name', 'Total Amount', 'Payment Type'];
            const tableRows: (string[] | object[])[] = [];
            let totalAmount = 0;

            // Process data if available
            if (fetched_data && fetched_data.length > 0) {
                // Process data and calculate total
                fetched_data.forEach((item: any) => {
                    const patientName = `${item.orders.pos.firstname} ${item.orders.pos.lastname}`;
                    const rowData = [
                        item.sales_history_id.toString(),
                        new Date(item.date_sold).toLocaleString(),
                        patientName,
                        `$${item.total_price.toFixed(2)}`,
                        item.paymentcash ? 'Cash' : 'Card',
                    ];
                    tableRows.push(rowData);
                    totalAmount += parseFloat(item.total_price);
                });
            } else {
                // Add a "No Records" message row
                tableRows.push([
                    { content: 'No records found for the selected date range', colSpan: 5, styles: { halign: 'center', fontStyle: 'italic' } }
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
