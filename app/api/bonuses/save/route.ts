import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bonuses } = body
    if (!bonuses || !Array.isArray(bonuses)) {
      return NextResponse.json({ error: 'Invalid payload: bonuses array required' }, { status: 400 })
    }

    const supabase = createClient()

    // Insert rows into `location_bonuses`. Expect each item to have the shape:
    // { bonus_limit, flat_percentage, value, bonus_amount, date, paid, location_id }
    const { data, error } = await supabase.from('location_bonuses').insert(bonuses).select()
    if (error) {
      console.error('Insert location_bonuses error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('API /bonuses/save error', err)
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 })
  }
}
