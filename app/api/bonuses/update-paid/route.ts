import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items } = body
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload: items array required' }, { status: 400 })
    }

    const supabase = createClient()
    const todayYMD = new Date().toISOString().slice(0, 10)

    const updated: any[] = []
    for (const it of items) {
      try {
        const loc = it.location_id
        const date = it.date
        const newPaid = !!it.paid

        // fetch existing row to determine previous paid state and paid_date
        const { data: selData, error: selErr } = await supabase
          .from('bonus')
          .select('id, paid, paid_date')
          .eq('location_id', loc)
          .eq('date', date)
          .limit(1)

        if (selErr) {
          console.error('[api/bonuses/update-paid] select error', selErr)
          throw selErr
        }

        const existing = Array.isArray(selData) && selData.length > 0 ? selData[0] : null

        let paidDateToSet: string | null = null
        if (existing) {
          if (newPaid) {
            paidDateToSet = (!existing.paid) ? todayYMD : (existing.paid_date ?? todayYMD)
          } else {
            paidDateToSet = null
          }
        } else {
          paidDateToSet = newPaid ? todayYMD : null
        }

        const { data: upData, error: upErr } = await supabase
          .from('bonus')
          .update({ paid: newPaid, paid_date: paidDateToSet })
          .eq('location_id', loc)
          .eq('date', date)
          .select()

        if (upErr) {
          console.error('[api/bonuses/update-paid] update error', upErr)
          throw upErr
        }

        if (Array.isArray(upData) && upData.length > 0) {
          updated.push(upData[0])
        } else {
          // nothing updated (row might not exist) - optionally insert minimal row? we skip insert to avoid touching other fields
          updated.push({ location_id: loc, date, paid: newPaid, paid_date: paidDateToSet })
        }

        // --- Extended logic: update individual_bonus rows for members of sales_team ---
        try {
          // Find sales_team rows for this location where valid_from matches the provided date.
          // Support timestamps that start with the date string (e.g. '2025-11-16T07:51:54Z') by using ilike fallback.
          const { data: teamsByExact, error: teamExactErr } = await supabase
            .from('sales_team')
            .select('id, members')
            .eq('location_id', loc)
            .eq('valid_from', date)

          let teams = teamsByExact || []
          if (teamExactErr) {
            console.error('[api/bonuses/update-paid] sales_team select exact error', teamExactErr)
          }

          // If no exact match, try matching by date range (handles timestamp with time zone)
          if ((!teams || teams.length === 0) && typeof date === 'string') {
            try {
              // Determine day range for the provided date (supports 'YYYY-MM-DD' or full timestamp)
              let ymd = date
              const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(date)
              if (!dateOnlyMatch) {
                // parse full timestamp and extract Y-M-D
                const parsed = new Date(date)
                if (!isNaN(parsed.getTime())) {
                  ymd = parsed.toISOString().slice(0, 10)
                }
              }

              const start = new Date(ymd + 'T00:00:00.000Z')
              const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

              const { data: teamsRange, error: teamRangeErr } = await supabase
                .from('sales_team')
                .select('id, members')
                .eq('location_id', loc)
                .gte('valid_from', start.toISOString())
                .lt('valid_from', end.toISOString())

              if (teamRangeErr) {
                console.error('[api/bonuses/update-paid] sales_team select range error', teamRangeErr)
              }
              teams = teamsRange || []
            } catch (rangeErr) {
              console.error('[api/bonuses/update-paid] sales_team date range error', rangeErr)
            }
          }

          if (teams && teams.length > 0) {
            for (const team of teams) {
              try {
                // members may be stored as text[] or json array; normalize to string[]
                const membersRaw = team.members || []
                const memberIds: Array<number | string> = Array.isArray(membersRaw)
                  ? membersRaw.map((m: any) => (typeof m === 'string' ? m : String(m))).filter(Boolean)
                  : []

                if (memberIds.length === 0) continue

                // Update individual_bonus rows for this sales_team and member staff ids
                // Try to match on bonus_date if available by using ilike with date prefix
                const updQuery = supabase
                  .from('individual_bonus')
                  .update({ paid: newPaid, paid_date: paidDateToSet })
                  .in('staff_id', memberIds)
                  .eq('sales_team_id', team.id)

                // If date is string, attempt to match bonus_date within that day (handles timestamp columns)
                if (typeof date === 'string') {
                  try {
                    let ymd2 = date
                    const dateOnlyMatch2 = /^\d{4}-\d{2}-\d{2}$/.test(date)
                    if (!dateOnlyMatch2) {
                      const parsed2 = new Date(date)
                      if (!isNaN(parsed2.getTime())) ymd2 = parsed2.toISOString().slice(0, 10)
                    }
                    const start2 = new Date(ymd2 + 'T00:00:00.000Z')
                    const end2 = new Date(start2.getTime() + 24 * 60 * 60 * 1000)
                    updQuery.gte('bonus_date', start2.toISOString()).lt('bonus_date', end2.toISOString())
                  } catch (rangeErr2) {
                    console.error('[api/bonuses/update-paid] individual_bonus date range error', rangeErr2)
                  }
                }

                const { data: indUpData, error: indErr } = await updQuery.select()
                if (indErr) {
                  console.error('[api/bonuses/update-paid] individual_bonus update error', indErr)
                } else {
                  // optionally include these updates in the response under a separate key
                  // For now, just log
                  console.log('[api/bonuses/update-paid] updated individual_bonus rows for sales_team', team.id, indUpData?.length || 0)
                }
              } catch (innerErr) {
                console.error('[api/bonuses/update-paid] per-team individual update error', innerErr)
              }
            }
          }
        } catch (e2) {
          console.error('[api/bonuses/update-paid] sales_team -> individual_bonus extension error', e2)
        }
      } catch (e) {
        console.error('[api/bonuses/update-paid] item error', e)
        return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 })
      }
    }

    return NextResponse.json({ updated, total: updated.length })
  } catch (err: any) {
    console.error('[api/bonuses/update-paid] error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
