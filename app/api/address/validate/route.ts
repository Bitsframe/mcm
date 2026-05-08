import { NextResponse } from "next/server";

const SMARTY_STREET_URL = "https://us-street.api.smartystreets.com/street-address";
const SMARTY_AUTOCOMPLETE_URL = "https://us-autocomplete-pro.api.smarty.com/lookup";

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

type AutocompleteSuggestion = {
  street_line?: string;
  secondary?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  zip_code?: string;
};

async function verifyStreetComponents(
  authId: string,
  authToken: string,
  street: string,
  city: string,
  state: string,
  zipcode: string
) {
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

/**
 * Verifies a US address with Smarty (US Street API), using either:
 * - `freeform`: one line → Autocomplete first match → Street API
 * - `street`, `city`, `state`, `zipcode` → Street API directly
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

  const b = body as Record<string, unknown>;
  const freeform = String(b.freeform ?? "").trim();

  let street = String(b.street ?? "").trim();
  let city = String(b.city ?? "").trim();
  let state = String(b.state ?? "").trim();
  let zipcode = String(b.zipcode ?? "").trim();

  if (freeform.length > 0) {
    const params = new URLSearchParams({
      "auth-id": authId,
      "auth-token": authToken,
      search: freeform.slice(0, 256),
      max_results: "8",
    });
    const acRes = await fetch(`${SMARTY_AUTOCOMPLETE_URL}?${params.toString()}`);
    if (!acRes.ok) {
      const text = await acRes.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: "Address lookup failed.",
          detail: text.slice(0, 200),
        },
        { status: 502 }
      );
    }
    const acJson = (await acRes.json()) as { suggestions?: AutocompleteSuggestion[] };
    const first = Array.isArray(acJson.suggestions) ? acJson.suggestions[0] : undefined;
    if (!first) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No matching address found. Enter a fuller street, city, state, and ZIP.",
        },
        { status: 422 }
      );
    }
    let line = String(first.street_line ?? "").trim();
    const secondary = String(first.secondary ?? "").trim();
    if (secondary) {
      line = `${line} ${secondary}`.trim();
    }
    street = line;
    city = String(first.city ?? "").trim();
    state = String(first.state ?? "").trim();
    zipcode = String(first.zipcode ?? first.zip_code ?? "").trim();
  }

  if (!street || !state || !zipcode) {
    return NextResponse.json(
      {
        ok: false,
        error: freeform
          ? "Could not derive street, state, and ZIP from that address."
          : "Street, state, and ZIP code are required.",
      },
      { status: 400 }
    );
  }

  return verifyStreetComponents(authId, authToken, street, city, state, zipcode);
}
