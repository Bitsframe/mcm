const RESEND_API_KEY = "re_8gEyaRox_GmBUZfWxoyg1a9xjmnc1tsL5";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        ...CORS_HEADERS,
      },
    });
  }

  try {
    console.log("[EdgeFunction] Incoming request headers:", Object.fromEntries(req.headers.entries()));
    const { to, subject, html } = await req.json(); // Request body se data lo

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'no-reply@alerts.myclinicmd.com',
        to: to || 'delivered@resend.dev',
        subject: subject || 'No Subject',
        html: html || '<strong>No content</strong>',
      }),
    });

    const responseText = await res.text();
    console.log("[EdgeFunction] Resend API response:", responseText);

    if (!res.ok) throw new Error(responseText);

    const data = JSON.parse(responseText);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });

  } catch (error) {
    // @ts-ignore
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  }
}
// @ts-ignore
Deno.serve(handler);