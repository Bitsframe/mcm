import { currencyFormatHandle } from "@/helper/common_functions";

// Helper: format a UTC datetime string as CT (UTC-6) in 'DD Mon YYYY'
function formatUTCToCTDate(utcDateString?: string): string {
  try {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const source = utcDateString && typeof utcDateString === 'string'
      ? utcDateString.replace(' ', 'T') // normalize 'YYYY-MM-DD hh:mm' → ISO-like
      : new Date().toISOString();
    const d = new Date(source);
    // CT is UTC-6 (fixed offset to match app display logic)
    const ctMs = d.getTime() + (-6 * 60 * 60 * 1000);
    const ct = new Date(ctMs);
    const day = String(ct.getUTCDate()).padStart(2, '0');
    const month = months[ct.getUTCMonth()];
    const year = ct.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    // Fallback to today's date in local if parsing fails
    const today = new Date();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${String(today.getDate()).padStart(2, '0')} ${months[today.getMonth()]} ${today.getFullYear()}`;
  }
}

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
    // Prefer the created order's UTC date, display as CT on invoice
    const formattedDate = formatUTCToCTDate(orderDetails?.order_date_utc);
    const discountPercentArray = orderItems.map(item => item.discount_percent);
 

    // Create a feedback URL with order ID and patient ID for tracking
    const feedbackUrl = `${process.env.NEXT_PUBLIC_USER_WEBSITE}/feedback/${orderDetails.order_id}`;

    const netAmount = +totalAmount - +discountAmount;

    // const emailHtml = `
    //   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
    //     <p>Dear ${patientInfo.firstname} ${patientInfo.lastname},</p>
        
    //     <p>Thank you for choosing Clinica San Miguel for your healthcare needs. Please find your invoice details below:</p>
        
    //     <h3 style="margin-top: 20px;">Invoice Details:</h3>
    //     <ul style="list-style-type: none; padding-left: 0;">
    //       <li><strong>Invoice Number:</strong> I-${orderDetails.order_id}</li>
    //       <li><strong>Invoice Date:</strong> ${formattedDate}</li>
    //       <li><strong>Payment Method:</strong> ${orderDetails.paymentcash ? "Cash" : "Debit Card"}</li>
    //       <li><strong>Gross Amount:</strong> ${totalAmount}</li>
    //       <li><strong>Discount(${appliedDiscount}%):</strong> -${discountAmount}</li>
    //       <li><strong>Previous Credit Balance:</strong> ${previousCreditAmount < 0 ? `-$${Math.abs(previousCreditAmount).toFixed(2)}` : `$${previousCreditAmount.toFixed(2)}`}</li>
    //       <li><strong>Net Amount:</strong> ${netAmount}</li>
    //       <li><strong>New Credit Balance:</strong> ${newCreditBalance < 0 ? `-$${Math.abs(newCreditBalance).toFixed(2)}` : `$${newCreditBalance.toFixed(2)}`}</li>
    //     </ul>
        
    //     <h3>Billing Information:</h3>
    //     <ul style="list-style-type: none; padding-left: 0;">
    //       <li><strong>Patient Name:</strong> ${patientInfo.firstname} ${patientInfo.lastname}</li>
    //       <li><strong>Location:</strong> Clinica San Miguel ${patientInfo.location || "Pasadena"}</li>
    //     </ul>
        
    //     <h3>Invoice Summary:</h3>
    //     <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
    //       <thead>
    //         <tr style="background-color: #eee;">
    //           <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Category</th>
    //           <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
    //           <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Units</th>
    //           <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
    //         </tr>
    //       </thead>
    //       <tbody>
    //         ${orderItems.map((item) => `
    //           <tr>
    //             <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.category_name}</td>
    //             <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
    //             <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
    //             <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencyFormatHandle(item.price * item.quantity)}</td>
    //           </tr>
    //         `).join("")}
    //       </tbody>
    //       <tfoot>
    //         <tr>
    //           <td colspan="3" style="padding: 10px; text-align: right;"><strong>Discount:</strong></td>
    //           <td style="padding: 10px; text-align: right;">-${currencyFormatHandle(discountAmount)}</td>
    //         </tr>
    //         <tr>
    //           <td colspan="3" style="padding: 10px; text-align: right;"><strong>Previous Credit:</strong></td>
    //           <td style="padding: 10px; text-align: right;">${previousCreditAmount < 0 ? `-$${Math.abs(previousCreditAmount).toFixed(2)}` : `$${previousCreditAmount.toFixed(2)}`}</td>
    //         </tr>
    //         <tr>
    //           <td colspan="3" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
    //           <td style="padding: 10px; text-align: right; font-weight: bold;">${netAmount}</td>
    //         </tr>
    //         <tr>
    //           <td colspan="3" style="padding: 10px; text-align: right;"><strong>New Credit Balance:</strong></td>
    //           <td style="padding: 10px; text-align: right; font-weight: bold;">${newCreditBalance < 0 ? `-$${Math.abs(newCreditBalance).toFixed(2)}` : `$${newCreditBalance.toFixed(2)}`}</td>
    //         </tr>
    //       </tfoot>
    //     </table>
        
    //     <p>If you have any questions or need further assistance, feel free to reach out at contact@clinicasanmiguel.com.</p>
        
    //     <p>Thank you for your trust in us.</p>
        
    //     <p>Best regards,<br>Clinica San Miguel Team</p>
        
    //     <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
    //       <p style="color: #666;">We value your feedback!</p>
    //       <a href="${feedbackUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Share Your Feedback & Get a Promo Code</a>
    //       <p style="color: #666; font-size: 12px; margin-top: 10px;">Complete our quick survey and receive a promotional code for your next visit.</p>
    //     </div>
    //   </div>
    // `;


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
          <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Discount</th>
       
        </tr>
      </thead>
      <tbody>
        ${orderItems.map((item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.category_name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencyFormatHandle(item.price * item.quantity)}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">
              ${discountPercentArray } %
            </td>
            
          </tr>
        `).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding: 10px; text-align: right;"><strong>Discount:</strong></td>
          <td style="padding: 10px; text-align: right;">-${currencyFormatHandle(discountAmount)}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 10px; text-align: right;"><strong>Previous Credit:</strong></td>
          <td style="padding: 10px; text-align: right;">${previousCreditAmount < 0 ? `-$${Math.abs(previousCreditAmount).toFixed(2)}` : `$${previousCreditAmount.toFixed(2)}`}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
          <td style="padding: 10px; text-align: right; font-weight: bold;">${netAmount}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 10px; text-align: right;"><strong>New Credit Balance:</strong></td>
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



    const fromEmail = "clinicasanmiguel@alerts.myclinicmd.com";


    const payload = {
      from: fromEmail,
      recipients: [patientInfo.email],
      subject: `Invoice I-${orderDetails.order_id}`,
      html: emailHtml,
    };

    // Use environment variable for email service URL (same as other email functions)
    const emailServiceUrl = process.env.NEXT_PUBLIC_EMAIL_SENDER_URL;
    
    // #region agent log
    const logData = {
      location: 'sendOrderEmail.ts:229',
      message: 'Reading email service URL from env',
      data: {
        hasUrl: !!emailServiceUrl,
        urlPreview: emailServiceUrl?.substring(0, 60) || 'undefined',
        isPlaceholder: emailServiceUrl?.includes('your-email-service-url.com') || false
      },
      timestamp: Date.now(),
      runId: 'run3',
      hypothesisId: 'P'
    };
    fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(() => {});
    // #endregion
    
    if (!emailServiceUrl) {
      throw new Error("Email service URL not configured (NEXT_PUBLIC_EMAIL_SENDER_URL)");
    }
    
    // Check if using placeholder value (common mistake)
    if (emailServiceUrl.includes('your-email-service-url.com') || emailServiceUrl.includes('example.com')) {
      throw new Error(`Email service URL appears to be a placeholder value. Please set NEXT_PUBLIC_EMAIL_SENDER_URL in .env.local and restart the server. Current value: ${emailServiceUrl}`);
    }
    
    // Append /send-batch-email endpoint (consistent with other email functions)
    const endpoint = emailServiceUrl.endsWith('/') 
      ? `${emailServiceUrl}send-batch-email` 
      : `${emailServiceUrl}/send-batch-email`;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sendOrderEmail.ts:237',message:'About to call email service',data:{endpoint,emailServiceUrl,hasUrl:!!emailServiceUrl},timestamp:Date.now(),runId:'run2',hypothesisId:'L'})}).catch(()=>{});
    // #endregion

    let response;
    try {
      response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
    } catch (fetchError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sendOrderEmail.ts:250',message:'Fetch call failed',data:{endpoint,errorName:fetchError?.name,errorMessage:fetchError?.message,errorCode:fetchError?.code,errorCause:fetchError?.cause?.toString()?.substring(0,200)},timestamp:Date.now(),runId:'run2',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      throw new Error(`Failed to connect to email service: ${fetchError.message || 'fetch failed'}`);
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sendOrderEmail.ts:237',message:'Email service response status',data:{status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type')},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Check response status and content-type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sendOrderEmail.ts:244',message:'Response content type check',data:{isJson,contentType,ok:response.ok},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!response.ok) {
      // If not OK, try to read as text first to see what we got
      const errorText = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sendOrderEmail.ts:250',message:'Email service error response',data:{status:response.status,statusText:response.statusText,errorTextPreview:errorText.substring(0,200),isHtml:errorText.trim().startsWith('<!DOCTYPE')},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Try to parse as JSON if it looks like JSON, otherwise use the text
      let errorMessage = "Failed to send order confirmation email";
      try {
        if (isJson) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } else {
          errorMessage = `Email service returned ${response.status}: ${errorText.substring(0, 100)}`;
        }
      } catch (parseError) {
        errorMessage = `Email service returned ${response.status} with non-JSON response`;
      }
      
      throw new Error(errorMessage);
    }

    // Only parse as JSON if content-type indicates JSON
    let result;
    if (isJson) {
      result = await response.json();
    } else {
      const text = await response.text();
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sendOrderEmail.ts:272',message:'Non-JSON response received',data:{contentType,textPreview:text.substring(0,200)},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw new Error(`Email service returned non-JSON response: ${text.substring(0, 100)}`);
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/697e0712-e788-4d2b-acc0-cc4317618d77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sendOrderEmail.ts:277',message:'Email sent successfully',data:{result},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return result;
  } catch (error: any) {
    console.error("Error sending order email:", error);
    throw error;
  }
}; 