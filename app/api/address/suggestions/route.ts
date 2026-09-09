import { NextRequest, NextResponse } from 'next/server';
import { fetchMapboxAddressSuggestions, isMapboxConfigured } from '@/utils/mapboxAddress';

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

  if (!isMapboxConfigured()) {
    return NextResponse.json({
      success: true,
      suggestions: [],
      notice: 'Address lookup is not configured; enter the address manually.',
    });
  }

  const suggestions = await fetchMapboxAddressSuggestions(search, 8);

  return NextResponse.json({
    success: true,
    suggestions,
  });
}
