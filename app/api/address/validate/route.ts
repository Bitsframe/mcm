import { NextResponse } from "next/server";

const SMARTY_STREET_URL = "https://us-street.api.smartystreets.com/street-address";

export const dynamic = "force-dynamic";

/** Whether Smarty embedded keys are configured (no API call). */
export async function GET() {
  const configured = !!(
    process.env.SMARTY_AUTH_ID?.trim() && process.env.SMARTY_AUTH_TOKEN?.trim()
  );
  return NextResponse.json({ configured });
}

type SmartyCandidate = {
  delivery_line_1?: string;
  delivery_line_2?: string;
  last_line?: string;
};

/**
 * Verifies a US address with Smarty US Street Address API (server-side keys only).
 */
export async function POST(req: Request) {
  const authId = process.env.SMARTY_AUTH_ID?.trim();
  const authToken = process.env.SMARTY_AUTH_TOKEN?.trim();
  if (!authId || !authToken) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "Address validation is not configured (SMARTY_AUTH_ID / SMARTY_AUTH_TOKEN).",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const street = String((body as Record<string, unknown>).street ?? "").trim();
  const city = String((body as Record<string, unknown>).city ?? "").trim();
  const state = String((body as Record<string, unknown>).state ?? "").trim();
  const zipcode = String((body as Record<string, unknown>).zipcode ?? "").trim();

  if (!street || !state || !zipcode) {
    return NextResponse.json(
      { ok: false, error: "Street, state, and ZIP code are required." },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    "auth-id": authId,
    "auth-token": authToken,
    street,
    state,
    zipcode,
    candidates: "5",
  });
  if (city) params.set("city", city);

  const smRes = await fetch(`${SMARTY_STREET_URL}?${params.toString()}`);
  if (!smRes.ok) {
    const text = await smRes.text();
    return NextResponse.json(
      {
        ok: false,
        error: "Address provider request failed.",
        detail: text.slice(0, 300),
      },
      { status: 502 }
    );
  }

  const data = (await smRes.json()) as SmartyCandidate[];
  if (!Array.isArray(data) || data.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Address could not be verified. Check the street, city, state, and ZIP code.",
      },
      { status: 422 }
    );
  }

  const a = data[0];
  const line1 = a.delivery_line_1 ?? "";
  const line2 = a.delivery_line_2 ?? "";
  const last = a.last_line ?? "";
  const formatted = [line1, line2, last].filter(Boolean).join(", ");

  return NextResponse.json({
    ok: true,
    formatted,
    components: { delivery_line_1: line1, delivery_line_2: line2, last_line: last },
  });
}
