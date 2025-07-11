export const sendFulfillmentConfirmationEmail = async (
  patientEmail: string,
  patientName: string,
  orderId: number,
  productName: string,
  quantity: number
) => {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #28a745;">✅ Pickup Confirmed</h2>
        <p>Dear ${patientName},</p>
        <p>Your pickup has been successfully completed!</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Pickup Details:</h3>
          <ul>
            <li><strong>Order Reference:</strong> #${orderId}</li>
            <li><strong>Product:</strong> ${productName}</li>
            <li><strong>Quantity:</strong> ${quantity}</li>
            <li><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">PICKED UP</span></li>
          </ul>
        </div>
        <p>Thank you for choosing our service! If you have any questions or concerns, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Your Healthcare Team</p>
      </div>
    `;

    const fromEmail = "test@alerts.myclinicmd.com";
    const payload = {
      from: fromEmail,
      recipients: [patientEmail],
      subject: `Pickup Confirmed - Order #${orderId}`,
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
      throw new Error(result.message || "Failed to send confirmation email");
    }
    return result;
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
}; 