import axios from "axios";

export const sendInvoice = async (orderDetails: any, patientInfo: any, totalAmount: string) => {

    try {
        const today = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedDate = `${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}`;

        const smsMessage = `Clinica San Miguel: Thank you for choosing us!

        Invoice #I-${orderDetails.order_id} | Date: ${formattedDate}
        Payment: ${orderDetails.paymentType || "Cash"} | Amount: $${totalAmount}
        Patient: ${patientInfo.firstname} ${patientInfo.lastname}
        Location: Clinica San Miguel ${patientInfo.location || 'Pasadena'}
        Questions? Contact us at contact@clinicasanmiguel.com.
        Thank you for your trust! – Clinica San Miguel Team`;


        console.log({smsMessage})


        const payload = {
            phoneNumbers: [patientInfo.phone],
            message: smsMessage,
        };

        const response = await axios.post('/api/send-sms',payload);

        const result = await response.data;

        if (response.status !== 200) {
            throw new Error(result.message || 'Failed to send sms');
        }

        return result;
    } catch (error: any) {
        console.error('Error sending order email:', error);
    }
};