/**
 * Mapbox address lookup — the only address provider.
 *
 * Uses the Geocoding v6 forward endpoint (rather than Searchbox /suggest) because it
 * returns structured `context` components, which the patient / pharmacy / appointment
 * modals need broken out into street, city, state and ZIP.
 */

const MAPBOX_FORWARD_URL = "https://api.mapbox.com/search/geocode/v6/forward";

/** Shape consumed by the address autocomplete dropdowns. */
export type MapboxAddressSuggestion = {
  fullAddress: string;
  streetLine: string;
  /** Snake-case alias kept for callers that read snake_case field names. */
  street_line: string;
  secondary: string;
  city: string;
  state: string;
  zipcode: string;
};

type MapboxFeature = {
  properties?: {
    full_address?: string;
    name?: string;
    place_formatted?: string;
    context?: {
      address?: { name?: string; address_number?: string; street_name?: string };
      street?: { name?: string };
      postcode?: { name?: string };
      place?: { name?: string };
      region?: { name?: string; region_code?: string };
    };
  };
};

export function isMapboxConfigured(): boolean {
  return Boolean(process.env.MAPBOX_ACCESS_TOKEN?.trim());
}

function toSuggestion(feature: MapboxFeature): MapboxAddressSuggestion | null {
  const props = feature.properties;
  if (!props) return null;

  const ctx = props.context ?? {};
  const streetLine = (ctx.address?.name ?? props.name ?? "").trim();
  const city = (ctx.place?.name ?? "").trim();
  const state = (ctx.region?.region_code ?? ctx.region?.name ?? "").trim();
  const zipcode = (ctx.postcode?.name ?? "").trim();

  const fullAddress =
    props.full_address?.trim() ||
    [streetLine, [city, state].filter(Boolean).join(", "), zipcode]
      .filter(Boolean)
      .join(", ");

  if (!fullAddress) return null;

  return {
    fullAddress,
    streetLine,
    street_line: streetLine,
    // Mapbox folds unit/apt into the street line; there is no separate secondary field.
    secondary: "",
    city,
    state,
    zipcode,
  };
}

async function forwardGeocode(
  search: string,
  limit: number
): Promise<MapboxAddressSuggestion[]> {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    console.warn("[mapboxAddress] MAPBOX_ACCESS_TOKEN missing");
    return [];
  }

  const url = new URL(MAPBOX_FORWARD_URL);
  url.searchParams.set("q", search.slice(0, 256));
  url.searchParams.set("country", "us");
  url.searchParams.set("types", "address");
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 10)));
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[mapboxAddress] Mapbox HTTP ${res.status}:`, body.slice(0, 200));
    return [];
  }

  const data = (await res.json()) as { features?: MapboxFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];

  const seen = new Set<string>();
  return features
    .map(toSuggestion)
    .filter((s): s is MapboxAddressSuggestion => s !== null)
    .filter((s) => {
      const key = s.fullAddress.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** Autocomplete suggestions for a partial address. Returns [] on any failure. */
export async function fetchMapboxAddressSuggestions(
  search: string,
  limit = 8
): Promise<MapboxAddressSuggestion[]> {
  const query = search.trim();
  if (query.length < 3) return [];

  try {
    return await forwardGeocode(query, limit);
  } catch (error) {
    console.error("[mapboxAddress] Network error:", error);
    return [];
  }
}

/** Best single match for a full address, or null when nothing verifies. */
export async function geocodeMapboxAddress(
  query: string
): Promise<MapboxAddressSuggestion | null> {
  const results = await fetchMapboxAddressSuggestions(query, 1);
  return results[0] ?? null;
}
