import { NextResponse } from 'next/server';

// Use the environment variables
const SENDER_BROADCAST_EMAIL = process.env.SENDER_BROADCAST_EMAIL;
const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_EMAIL_SENDER_URL;
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL; // Add the reply-to email to the environment variables

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Log incoming data for debugging
    console.log("Received email data:", data);

    // Extract necessary fields from the request data
    const { to, subject, appointmentDate, appointmentTime } = data;

    // Validate required fields for a single email call
    if (!to || !appointmentDate || !appointmentTime) {
      console.error('[sendappointemntemail] missing required fields', { to, appointmentDate, appointmentTime });
      // Return what was actually received to help debug deployed vs local mismatch
      return NextResponse.json({
        error: 'Missing required fields: to, appointmentDate, appointmentTime',
        received: { to, appointmentDate, appointmentTime },
        rawBody: data,
      }, { status: 400 });
    }

    // Construct the request body for the edge function
    const requestBody = {
      from: SENDER_BROADCAST_EMAIL,  // Use the sender email from environment variables
      to: to,
      subject: subject || "Appointment Confirmation",
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      html: `<p>Your appointment has been booked for <strong>${appointmentDate} at ${appointmentTime}</strong>. Please be on time.</p>`,
      replyTo: REPLY_TO_EMAIL || SENDER_BROADCAST_EMAIL, // Add the Reply-To email
    };

    // Log the request body for debugging
    console.log("Sending request body:", requestBody);

    // Build endpoint for single email (common shape for edge function)
    if (!EDGE_FUNCTION_URL) {
      console.error('[sendappointemntemail] EDGE_FUNCTION_URL not configured');
      return NextResponse.json({ error: 'EDGE_FUNCTION_URL not configured' }, { status: 500 });
    }

    // Build the explicit batch endpoint per your requested host
    const batchEndpoint = EDGE_FUNCTION_URL.endsWith('/') ? `${EDGE_FUNCTION_URL}send-batch-email` : `${EDGE_FUNCTION_URL}/send-batch-email`;
    console.log('[sendappointemntemail] proxying to edge function batch endpoint', { batchEndpoint, from: SENDER_BROADCAST_EMAIL });

    // Convert to batch payload expected by the service
    const batchPayload = {
      from: SENDER_BROADCAST_EMAIL,
      recipients: [to],
      subject: requestBody.subject,
      html: requestBody.html,
      replyTo: requestBody.replyTo, // Include the replyTo in the batch payload
    };

    // Send a POST request to the batch endpoint
    const response = await fetch(batchEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload),
    });

    const responseText = await response.text();

    // Log the response from the edge function
    console.log("Response from edge function:", responseText);

    // Handle successful response from the edge function
    if (response.ok) {
      return NextResponse.json({ message: 'Appointment email sent successfully', data: responseText });
    }

    // Handle error from the edge function
    throw new Error(responseText);
  } catch (error) {
    // Log the error details
    const errAny: any = error;
    console.error("Error while sending email:", errAny && (errAny.stack || errAny));

    // Try to include useful info in the response (temporary, for debugging)
    let message = errAny?.message || String(errAny);
    // If the message looks like JSON, include the parsed JSON as well
    let parsed: any = null;
    try {
      parsed = JSON.parse(message);
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      error: message,
      parsedError: parsed,
      stack: errAny?.stack,
    }, { status: 500 });
  }
}
