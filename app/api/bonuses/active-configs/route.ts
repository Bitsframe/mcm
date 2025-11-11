import { NextResponse } from 'next/server'
// Force this route to be dynamic so Next doesn't attempt static prerendering
export const dynamic = 'force-dynamic'
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
        return NextResponse.json({ error: (error as any)?.message ?? String(error) }, { status: 500 })
      }
      // Reduce to one config per location: pick the row with the latest effective_from
      try {
        const cfgs: any[] = data || []
        const map: Record<string, any> = {}
        cfgs.forEach((c: any) => {
          const key = String(c.location_id)
          if (!map[key]) map[key] = c
          else {
            const prev = map[key]
            const prevFrom = prev?.effective_from ? new Date(prev.effective_from).getTime() : 0
            const curFrom = c?.effective_from ? new Date(c.effective_from).getTime() : 0
            if (curFrom >= prevFrom) map[key] = c
          }
        })
        return NextResponse.json({ configs: Object.values(map) })
      } catch (e) {
        console.error('[api/bonuses/active-configs] reduce error', e)
        return NextResponse.json({ configs: data || [] })
      }
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
      return NextResponse.json({ error: (cfgErr as any)?.message ?? String(cfgErr) }, { status: 500 })
    }

    // Reduce to one config per location (choose the latest effective_from)
    try {
      const cfgs: any[] = cfgData || []
      const map: Record<string, any> = {}
      cfgs.forEach((c: any) => {
        const key = String(c.location_id)
        if (!map[key]) map[key] = c
        else {
          const prev = map[key]
          const prevFrom = prev?.effective_from ? new Date(prev.effective_from).getTime() : 0
          const curFrom = c?.effective_from ? new Date(c.effective_from).getTime() : 0
          if (curFrom >= prevFrom) map[key] = c
        }
      })
      return NextResponse.json({ configs: Object.values(map) })
    } catch (e) {
      console.error('[api/bonuses/active-configs] reduce error', e)
      return NextResponse.json({ configs: cfgData || [] })
    }
  } catch (err: any) {
    console.error('[api/bonuses/active-configs] error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
