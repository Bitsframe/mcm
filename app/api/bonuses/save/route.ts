import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
  const { bonuses, configOnly } = body
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

    // If this is a Set-limits save (configOnly), write config history records:
    // 1) close existing active config (set effective_to = tomorrow) for the location
    // 2) insert new config row with effective_from = today
    if (configOnly) {
      try {
        const updatedConfigs: any[] = []
        const insertedConfigs: any[] = []
  const todayYMD = new Date().toISOString().slice(0, 10)

        for (const item of bonuses) {
          try {
            // Close old config (effective_to = today) where effective_to IS NULL
            // This sets the previous open-ended config to end today so the new
            // config can take effect starting today.
            const { data: closeData, error: closeErr } = await supabase
              .from('bonus_config_history')
              .update({ effective_to: todayYMD })
              .eq('location_id', item.location_id)
              .is('effective_to', null)

            if (closeErr) {
              console.error('[api/bonuses/save] error closing existing config for location', item.location_id, closeErr)
            } else {
              updatedConfigs.push(...(Array.isArray(closeData) ? closeData : []))
            }

            // Insert new config row
            const toInsert = {
              location_id: item.location_id,
              flat_percentage: item.flat_percentage ?? null,
              value: item.value ?? null,
              bonus_threshold: item.bonus_threshold ?? null,
              effective_from: todayYMD,
              // created_at set explicitly to now for auditability
              created_at: new Date().toISOString(),
              // effective_to left null to indicate an open-ended config
            }
            const { data: insData, error: insErr } = await supabase
              .from('bonus_config_history')
              .insert([toInsert])
              .select()

            if (insErr) {
              console.error('[api/bonuses/save] error inserting new config for location', item.location_id, insErr)
            } else if (Array.isArray(insData)) {
              insertedConfigs.push(...insData)
            }
          } catch (cfgEx) {
            console.error('[api/bonuses/save] exception processing config item', item, cfgEx)
            return NextResponse.json({ error: { message: (cfgEx as any)?.message ?? String(cfgEx) } }, { status: 500 })
          }
        }

        return NextResponse.json({ updatedConfigs, insertedConfigs, totalProcessed: updatedConfigs.length + insertedConfigs.length })
      } catch (cfgOuterEx) {
        console.error('[api/bonuses/save] exception handling configOnly', cfgOuterEx)
        return NextResponse.json({ error: { message: (cfgOuterEx as any)?.message ?? String(cfgOuterEx) } }, { status: 500 })
      }
    }

    // Insert rows into `bonus` table. Expect each item to have the shape:
    // { bonus_limit, flat_percentage, value, bonus_amount, date, paid, location_id }
    // NOTE: This environment does not use a separate threshold_history table —
  // incoming `bonus_limit` from the client will be used when computing bonus_eligibility.
    try {
      console.log('[api/bonuses/save] service role key present?:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
      // Primary behavior: update existing rows by (location_id, date).
      // If no row exists for that (location_id, date), insert a minimal row with only location_id and date.
      const updated: any[] = []
      const inserted: any[] = []

      for (const item of bonuses) {
        try {
          const todayYMD = new Date().toISOString().slice(0, 10)
          // Use provided bonus_threshold if present, otherwise fall back to bonus_limit
          const newThreshold = (item.bonus_threshold !== undefined && item.bonus_threshold !== null)
            ? Number(item.bonus_threshold)
            : ((item.bonus_limit === undefined || item.bonus_limit === null) ? 0 : Number(item.bonus_limit))

          // Determine paid_date behaviour: fetch existing row(s) to see previous paid state
          let existingRows: any[] | null = null
          try {
            const { data: selData, error: selErr } = await supabase
              .from('bonus')
              .select('id, paid, paid_date, total_sales')
              .eq('location_id', item.location_id)
              .eq('date', item.date)
            if (selErr) {
              console.error('[api/bonuses/save] error selecting existing bonus row', selErr)
              throw selErr
            }
            existingRows = Array.isArray(selData) ? selData : null
          } catch (selEx) {
            console.error('[api/bonuses/save] select existing row exception', selEx)
            throw selEx
          }

          // compute paid_date to set on update: if previously unpaid and now paid -> today; if now unpaid -> null; otherwise keep existing paid_date
          let paidDateToSet: string | null = null
          if (Array.isArray(existingRows) && existingRows.length > 0) {
            const prev = existingRows[0]
            if (item.paid) {
              // If previously unpaid and now paid -> set to today; if already paid -> keep prev.paid_date
              paidDateToSet = (!prev.paid) ? todayYMD : (prev.paid_date ?? todayYMD)
            } else {
              // now unpaid -> clear paid_date
              paidDateToSet = null
            }
          } else {
            // No existing row -> if item.paid true, set today
            paidDateToSet = item.paid ? todayYMD : null
          }

          const { data: upData, error: upErr } = await supabase
            .from('bonus')
            .update({
              flat_percentage: item.flat_percentage ?? null,
              value: item.value ?? null,
              bonus_amount: item.bonus_amount ?? null,
              // persist the incoming bonus_threshold into the bonus table (if present)
              bonus_threshold: (item.bonus_threshold !== undefined && item.bonus_threshold !== null) ? item.bonus_threshold : (item.bonus_limit ?? null),
              paid: item.paid ?? false,
              paid_date: paidDateToSet,
            })
            .eq('location_id', item.location_id)
            .eq('date', item.date)
            .select()

          if (upErr) {
            console.error('[api/bonuses/save] update error for location', item.location_id, 'date', item.date, upErr)
            return NextResponse.json({ error: { message: upErr?.message ?? String(upErr) } }, { status: 500 })
          }

          if (Array.isArray(upData) && upData.length > 0) {
            // Recalculate bonus_eligibility based on total_sales vs threshold_amount
            const updatedRows: any[] = []
            for (const r of upData) {
              try {
                const totalSales = r.total_sales ?? 0
                const threshAmount = newThreshold
                const bonusGenerated = Number(totalSales) > Number(threshAmount)
                const { data: genData, error: genErr } = await supabase
                  .from('bonus')
                  .update({ bonus_eligibility: bonusGenerated })
                  .eq('id', r.id)
                  .select()
                if (genErr) {
                  console.error('[api/bonuses/save] error updating bonus_eligibility', genErr)
                }
                updatedRows.push({ ...(genData && genData[0] ? genData[0] : r) })
              } catch (e) {
                console.error('[api/bonuses/save] error recalculating bonus_eligibility for updated row', e)
                updatedRows.push(r)
              }
            }
            updated.push(...updatedRows)
            continue
          }

          // No existing row was updated -> insert a new row with the provided data and threshold link
          const toInsert: any = {
            location_id: item.location_id,
            date: item.date,
            flat_percentage: item.flat_percentage ?? null,
            value: item.value ?? null,
            bonus_amount: item.bonus_amount ?? null,
            // persist incoming threshold value on the bonus row
            bonus_threshold: (item.bonus_threshold !== undefined && item.bonus_threshold !== null) ? item.bonus_threshold : (item.bonus_limit ?? null),
            paid: item.paid ?? false,
            paid_date: item.paid ? todayYMD : null,
          }
          const { data: insData, error: insErr } = await supabase.from('bonus').insert([toInsert]).select()
          if (insErr) {
            console.error('[api/bonuses/save] insert error for location', item.location_id, 'date', item.date, insErr)
            return NextResponse.json({ error: { message: insErr?.message ?? String(insErr) } }, { status: 500 })
          }

          if (Array.isArray(insData) && insData.length > 0) {
            // Recalculate bonus_eligibility for the newly inserted row
            try {
              const newRow = insData[0]
              const totalSales = newRow.total_sales ?? 0
              const bonusGenerated = Number(totalSales) > Number(newThreshold)
              const { data: genData, error: genErr } = await supabase
                .from('bonus')
                .update({ bonus_eligibility: bonusGenerated })
                .eq('id', newRow.id)
                .select()
              if (genErr) console.error('[api/bonuses/save] error setting bonus_eligibility on insert', genErr)
              if (Array.isArray(genData) && genData.length > 0) inserted.push(...genData)
              else inserted.push(newRow)
              } catch (e) {
              console.error('[api/bonuses/save] error recalculating bonus_eligibility after insert', e)
              inserted.push(insData[0])
            }
          }
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
