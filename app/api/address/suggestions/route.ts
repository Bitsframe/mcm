import { NextRequest, NextResponse } from 'next/server';

/** Normalize Smarty US Autocomplete Pro entries for POS / patient modals */
function mapSmartyToUiSuggestion(raw: Record<string, unknown>) {
  const street_line = String(raw.street_line ?? raw.streetline ?? '');
  const secondary = String(raw.secondary ?? '');
  const city = String(raw.city ?? '');
  const state = String(raw.state ?? '');
  const zipcode = String(raw.zipcode ?? raw.zip_code ?? '');
  const streetLine = street_line;
  const line1 = secondary ? `${street_line} ${secondary}`.trim() : street_line;
  const line2 = [city, state].filter(Boolean).join(', ');
  const fullAddress = [line1, line2, zipcode].filter(Boolean).join(', ');

  return {
    fullAddress,
    streetLine: streetLine || line1,
    secondary,
    city,
    state,
    zipcode,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');

  if (!search) {
    return NextResponse.json(
      {
        success: false,
        error: 'Search parameter is required',
      },
      { status: 400 }
    );
  }

  if (search.length < 3) {
    return NextResponse.json(
      {
        success: false,
        error: 'Search query must be at least 3 characters',
      },
      { status: 400 }
    );
  }

  const authId = process.env.SMARTY_AUTH_ID;
  const authToken = process.env.SMARTY_AUTH_TOKEN;

  if (!authId || !authToken) {
    return NextResponse.json({
      success: true,
      suggestions: [],
      notice: 'Smarty is not configured; enter the address manually.',
    });
  }

  try {
    const url = `https://us-autocomplete-pro.api.smarty.com/lookup?auth-id=${encodeURIComponent(
      authId
    )}&auth-token=${encodeURIComponent(
      authToken
    )}&search=${encodeURIComponent(search)}&max_results=8`;

    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('Smarty autocomplete HTTP error:', response.status, body);
      return NextResponse.json({
        success: true,
        suggestions: [],
        notice: 'Address lookup is temporarily unavailable.',
      });
    }

    const data = (await response.json()) as {
      suggestions?: Record<string, unknown>[];
    };

    const rawList = Array.isArray(data.suggestions) ? data.suggestions : [];
    const suggestions = rawList.map((row) => mapSmartyToUiSuggestion(row));

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Error fetching address suggestions (Smarty):', error);
    return NextResponse.json({
      success: true,
      suggestions: [],
      notice: 'Address lookup failed; you can still type the full address.',
    });
  }
}
