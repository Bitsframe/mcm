import { currencyFormatHandle } from "@/helper/common_functions";

export const sendFulfillmentRequestEmail = async (
  patientEmail: string,
  patientName: string,
  mainOrderId: number,
  token: string,
  items: Array<{ product_name: string; category_name: string; quantity: number; }>,
  locationName: string,
  locationAddress: string
) => {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2>Your Pickup is Ready at <span style='color:#1976d2;'>${locationName}</span></h2>
        <p>Dear ${patientName},</p>
        <p>Your order is ready for pickup at <strong>${locationName}</strong>:</p>
        <ul>
          <li><strong>Order Ref:</strong> #${mainOrderId}</li>
          <li><strong>Pickup Token:</strong> <span style="font-size: 1.2em; color: #1976d2; font-weight: bold;">${token}</span></li>
          <li><strong>Pickup Location:</strong> ${locationName}, ${locationAddress}</li>
        </ul>
        <h3>Items to Pick Up:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background-color: #eee;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Category</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Units</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.category_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <p><strong>Instructions:</strong> Please visit the above location and present your order reference and pickup token to collect your items.</p>
        <p>If you have any questions, please contact us. Thank you for choosing us!</p>
      </div>
    `;

    const fromEmail = "test@alerts.myclinicmd.com";
    const payload = {
      from: fromEmail,
      recipients: [patientEmail],
      subject: `Pickup Ready at ${locationName}`,
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
      throw new Error(result.message || "Failed to send fulfillment request email");
    }
    return result;
  } catch (error: any) {
    console.error("Error sending fulfillment request email:", error);
    throw error;
  }
}; 