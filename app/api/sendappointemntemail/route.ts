import { NextResponse } from 'next/server';

// Use the environment variables
const SENDER_BROADCAST_EMAIL = process.env.SENDER_BROADCAST_EMAIL;
const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_EMAIL_SENDER_URL;
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL; // Add the reply-to email to the environment variables

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Log incoming data for debugging (show type so array-vs-object issues are clear)
    console.log("Received email data (raw):", data);

    // Normalize many possible payload shapes that clients may send:
    // - raw object { to, appointmentDate, appointmentTime }
    // - single-item array [ { ... } ]
    // - wrapped shape { body: { ... } } or { data: '{...}' }
    // - stringified JSON
    const normalize = (d: any) => {
      if (!d) return {};
      if (typeof d === 'string') {
        try { return JSON.parse(d); } catch (e) { return { raw: d }; }
      }
      if (Array.isArray(d)) return d[0] || {};
      // unwrap common wrappers
      const inner = d.body ?? d.data ?? d.payload ?? d;
      if (typeof inner === 'string') {
        try { return JSON.parse(inner); } catch (e) { return { rawInner: inner }; }
      }
      return inner;
    };

    const payload = normalize(data);
    console.log("Normalized payload:", payload);

    // Accept many common field names and shapes
    let to: any = payload?.to ?? payload?.recipients ?? payload?.email ?? payload?.toAddress ?? null;
    if (Array.isArray(to)) to = to[0];
    if (typeof to === 'object' && to?.email) to = to.email;

    const subject = payload?.subject ?? payload?.title ?? 'Appointment Confirmation';
    const appointmentDate = payload?.appointmentDate ?? payload?.date ?? payload?.appointment?.date ?? null;
    const appointmentTime = payload?.appointmentTime ?? payload?.time ?? payload?.appointment?.time ?? null;

    // Validate required fields for a single email call
    const missing: string[] = [];
    if (!to) missing.push('to');
    if (!appointmentDate) missing.push('appointmentDate');
    if (!appointmentTime) missing.push('appointmentTime');
    if (missing.length) {
      console.error('[sendappointemntemail] missing required fields', { missing, to, appointmentDate, appointmentTime });
      return NextResponse.json({
        error: `Missing required fields: ${missing.join(', ')}`,
        missing,
        received: { to, appointmentDate, appointmentTime },
        rawBody: data,
        note: 'Accepted shapes: {to,appointmentDate,appointmentTime} or wrappers body/data/payload or array [obj] or recipients array',
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
