import { currencyFormatHandle } from "@/helper/common_functions";

export const sendOrderEmail = async (
  orderDetails: any,
  patientInfo: any,
  orderItems: any[],
  totalAmount: number = 0,
  discountAmount: number = 0,
  appliedDiscount: number = 0,
  previousCreditAmount: number = 0,
  newCreditBalance: number = 0
) => {
  try {
    const today = new Date();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const formattedDate = `${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}`;

    // Create a feedback URL with order ID and patient ID for tracking
    const feedbackUrl = `${process.env.NEXT_PUBLIC_USER_WEBSITE}/feedback/${orderDetails.order_id}`;

    const netAmount = +totalAmount - +discountAmount;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <p>Dear ${patientInfo.firstname} ${patientInfo.lastname},</p>
        
        <p>Thank you for choosing Clinica San Miguel for your healthcare needs. Please find your invoice details below:</p>
        
        <h3 style="margin-top: 20px;">Invoice Details:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Invoice Number:</strong> I-${orderDetails.order_id}</li>
          <li><strong>Invoice Date:</strong> ${formattedDate}</li>
          <li><strong>Payment Method:</strong> ${orderDetails.paymentcash ? "Cash" : "Debit Card"}</li>
          <li><strong>Gross Amount:</strong> ${totalAmount}</li>
          <li><strong>Discount(${appliedDiscount}%):</strong> -${discountAmount}</li>
          <li><strong>Previous Credit Balance:</strong> ${previousCreditAmount < 0 ? `-$${Math.abs(previousCreditAmount).toFixed(2)}` : `$${previousCreditAmount.toFixed(2)}`}</li>
          <li><strong>Net Amount:</strong> ${netAmount}</li>
          <li><strong>New Credit Balance:</strong> ${newCreditBalance < 0 ? `-$${Math.abs(newCreditBalance).toFixed(2)}` : `$${newCreditBalance.toFixed(2)}`}</li>
        </ul>
        
        <h3>Billing Information:</h3>
        <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Patient Name:</strong> ${patientInfo.firstname} ${patientInfo.lastname}</li>
          <li><strong>Location:</strong> Clinica San Miguel ${patientInfo.location || "Pasadena"}</li>
        </ul>
        
        <h3>Invoice Summary:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background-color: #eee;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Category</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Units</th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems.map((item) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.category_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencyFormatHandle(item.price * item.quantity)}</td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Discount:</strong></td>
              <td style="padding: 10px; text-align: right;">-${currencyFormatHandle(discountAmount)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Previous Credit:</strong></td>
              <td style="padding: 10px; text-align: right;">${previousCreditAmount < 0 ? `-$${Math.abs(previousCreditAmount).toFixed(2)}` : `$${previousCreditAmount.toFixed(2)}`}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${netAmount}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>New Credit Balance:</strong></td>
              <td style="padding: 10px; text-align: right; font-weight: bold;">${newCreditBalance < 0 ? `-$${Math.abs(newCreditBalance).toFixed(2)}` : `$${newCreditBalance.toFixed(2)}`}</td>
            </tr>
          </tfoot>
        </table>
        
        <p>If you have any questions or need further assistance, feel free to reach out at contact@clinicasanmiguel.com.</p>
        
        <p>Thank you for your trust in us.</p>
        
        <p>Best regards,<br>Clinica San Miguel Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="color: #666;">We value your feedback!</p>
          <a href="${feedbackUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Share Your Feedback & Get a Promo Code</a>
          <p style="color: #666; font-size: 12px; margin-top: 10px;">Complete our quick survey and receive a promotional code for your next visit.</p>
        </div>
      </div>
    `;

    const fromEmail = "test@alerts.myclinicmd.com";


    const payload = {
      from: fromEmail,
      recipients: [patientInfo.email],
      subject: `Invoice I-${orderDetails.order_id}`,
      html: emailHtml,
    };

    const response = await fetch(
      "https://send-resent-mail-646827ff1a0b.herokuapp.com/send-batch-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to send order confirmation email");
    }

    return result;
  } catch (error: any) {
    console.error("Error sending order email:", error);
    throw error;
  }
}; 