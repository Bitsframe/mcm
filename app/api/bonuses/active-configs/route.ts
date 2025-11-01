import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const selectedDate = url.searchParams.get('selected_date')
    const supabase = createClient()

    // If no date provided, return active configs (effective_to IS NULL)
    // If date provided, return configs effective for that date.
    if (!selectedDate) {
      const { data, error } = await supabase
        .from('bonus_config_history')
        .select('id, location_id, flat_percentage, value, bonus_threshold, effective_from, effective_to')
        .is('effective_to', null)
      if (error) {
        console.error('[api/bonuses/active-configs] select error', error)
        return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 })
      }
      return NextResponse.json({ configs: data || [] })
    }

    // For a given selectedDate, find configs where effective_from <= selectedDate
    // and (effective_to IS NULL OR effective_to > selectedDate)
    const { data: cfgData, error: cfgErr } = await supabase
      .from('bonus_config_history')
      .select('id, location_id, flat_percentage, value, bonus_threshold, effective_from, effective_to')
      .lte('effective_from', selectedDate)
      .or(`effective_to.is.null,effective_to.gt.${selectedDate}`)

    if (cfgErr) {
      console.error('[api/bonuses/active-configs] select error', cfgErr)
      return NextResponse.json({ error: cfgErr.message ?? String(cfgErr) }, { status: 500 })
    }

    return NextResponse.json({ configs: cfgData || [] })
  } catch (err: any) {
    console.error('[api/bonuses/active-configs] error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
