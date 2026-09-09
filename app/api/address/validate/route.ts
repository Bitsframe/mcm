import { NextResponse } from "next/server";
import { geocodeMapboxAddress, isMapboxConfigured } from "@/utils/mapboxAddress";

export const dynamic = "force-dynamic";

/** Whether Mapbox is configured (no API call). */
export async function GET() {
  return NextResponse.json({ configured: isMapboxConfigured() });
}

/**
 * Verifies a US address with Mapbox, using either:
 * - `freeform`: one line
 * - `street`, `city`, `state`, `zipcode` components
 */
export async function POST(req: Request) {
  if (!isMapboxConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: "Address validation is not configured (MAPBOX_ACCESS_TOKEN).",
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

  const street = String(b.street ?? "").trim();
  const city = String(b.city ?? "").trim();
  const state = String(b.state ?? "").trim();
  const zipcode = String(b.zipcode ?? "").trim();

  const query =
    freeform ||
    [street, [city, state].filter(Boolean).join(", "), zipcode].filter(Boolean).join(", ");

  if (!query) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide either a freeform address or street, city, state and ZIP code.",
      },
      { status: 400 }
    );
  }

  const match = await geocodeMapboxAddress(query);

  if (!match) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Address could not be verified. Check the street, city, state, and ZIP code.",
      },
      { status: 422 }
    );
  }

  const lastLine = [match.city, match.state].filter(Boolean).join(", ");

  return NextResponse.json({
    ok: true,
    formatted: match.fullAddress,
    components: {
      delivery_line_1: match.streetLine,
      delivery_line_2: match.secondary,
      last_line: [lastLine, match.zipcode].filter(Boolean).join(" "),
    },
  });
}
