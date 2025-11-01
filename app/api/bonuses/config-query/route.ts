import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const locationId = url.searchParams.get('location_id')
    const selectedDate = url.searchParams.get('selected_date')

    if (!locationId || !selectedDate) {
      return NextResponse.json({ error: 'location_id and selected_date are required' }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch bonus row for the location and date
    const { data: bonusData, error: bonusErr } = await supabase
      .from('bonus')
      .select('id, location_id, date, total_sales, bonus_generated, bonus_amount')
      .eq('location_id', Number(locationId))
      .eq('date', selectedDate)

    if (bonusErr) {
      console.error('[api/bonuses/config-query] bonus select error', bonusErr)
      return NextResponse.json({ error: bonusErr.message ?? String(bonusErr) }, { status: 500 })
    }

    // Fetch active config (effective_to IS NULL)
    const { data: cfgData, error: cfgErr } = await supabase
      .from('bonus_config_history')
      .select('bonus_threshold, flat_percentage, value, effective_from, effective_to')
      .eq('location_id', Number(locationId))
      .is('effective_to', null)
      .order('effective_from', { ascending: false })
      .limit(1)

    if (cfgErr) {
      console.error('[api/bonuses/config-query] config select error', cfgErr)
      return NextResponse.json({ error: cfgErr.message ?? String(cfgErr) }, { status: 500 })
    }

    const bonusRow = Array.isArray(bonusData) && bonusData.length > 0 ? bonusData[0] : null
    const cfgRow = Array.isArray(cfgData) && cfgData.length > 0 ? cfgData[0] : null

    const result = {
      bonus: bonusRow,
      config: cfgRow,
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[api/bonuses/config-query] error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
