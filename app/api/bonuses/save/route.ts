import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bonuses } = body
    console.log('[api/bonuses/save] received body:', JSON.stringify(body?.bonuses ? { count: body.bonuses.length } : body))
    if (!bonuses || !Array.isArray(bonuses)) {
      console.log('[api/bonuses/save] invalid payload, bonuses missing or not array')
      return NextResponse.json({ error: 'Invalid payload: bonuses array required' }, { status: 400 })
    }

    const supabase = createClient()

    // Log incoming bonuses shape for debugging
    try {
      console.log('[api/bonuses/save] inserting bonuses sample:', JSON.stringify(bonuses.slice(0, 5)))
    } catch (e) {
      console.log('[api/bonuses/save] unable to stringify bonuses for log')
    }

  // Insert rows into `bonus` table. Expect each item to have the shape:
  // { bonus_limit, flat_percentage, value, bonus_amount, date, paid, location_id }
    try {
      console.log('[api/bonuses/save] service role key present?:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      // Primary behavior: update existing rows by (location_id, date).
      // If no row exists for that (location_id, date), insert a minimal row with only location_id and date.
      const updated: any[] = []
      const inserted: any[] = []

      for (const item of bonuses) {
        try {
          const { data: upData, error: upErr } = await supabase
            .from('bonus')
            .update({
              bonus_limit: item.bonus_limit ?? null,
              flat_percentage: item.flat_percentage ?? null,
              value: item.value ?? null,
              bonus_amount: item.bonus_amount ?? null,
              paid: item.paid ?? false,
            })
            .eq('location_id', item.location_id)
            .eq('date', item.date)
            .select()

          if (upErr) {
            console.error('[api/bonuses/save] update error for location', item.location_id, 'date', item.date, upErr)
            return NextResponse.json({ error: { message: upErr?.message ?? String(upErr) } }, { status: 500 })
          }

          if (Array.isArray(upData) && upData.length > 0) {
            updated.push(...upData)
            continue
          }

          // No existing row was updated -> insert minimal row with location_id and date only
          const minimal = { location_id: item.location_id, date: item.date }
          const { data: insData, error: insErr } = await supabase.from('bonus').insert([minimal]).select()
          if (insErr) {
            console.error('[api/bonuses/save] insert error for location', item.location_id, 'date', item.date, insErr)
            return NextResponse.json({ error: { message: insErr?.message ?? String(insErr) } }, { status: 500 })
          }
          if (Array.isArray(insData) && insData.length > 0) inserted.push(...insData)
        } catch (rowEx: any) {
          console.error('[api/bonuses/save] exception processing item', item, rowEx)
          try {
            const util = await import('util')
            console.error('[api/bonuses/save] row exception (inspect):', util.inspect(rowEx, { showHidden: true, depth: null }))
          } catch (_) {}
          return NextResponse.json({ error: { message: rowEx?.message ?? String(rowEx) } }, { status: 500 })
        }
      }

      return NextResponse.json({ updated, inserted, totalProcessed: updated.length + inserted.length })
    } catch (insertEx: any) {
      console.error('[api/bonuses/save] exception during insert', insertEx)
      try {
        const util = await import('util')
        console.error('[api/bonuses/save] insert exception (inspect):', util.inspect(insertEx, { showHidden: true, depth: null }))
      } catch (_) {}
      return NextResponse.json({ error: { message: insertEx?.message ?? String(insertEx) } }, { status: 500 })
    }
  } catch (err: any) {
    console.error('API /bonuses/save error', err)
    return NextResponse.json({ error: err?.message ?? 'unknown error' }, { status: 500 })
  }
}
