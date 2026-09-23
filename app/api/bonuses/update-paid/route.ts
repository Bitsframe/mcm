import { classifyError } from '@/utils/logging/safe-log';
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { items } = body
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload: items array required' }, { status: 400 })
    }
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

        // Mark every payout for that clinic-day paid, in one statement.
        //
        // The previous version matched teams on `valid_from = date`, i.e. teams
        // CREATED that day. A team stays open for months, so any later date
        // matched nothing and the payout rows were never marked. It also filtered
        // on staff_id, which skipped the seller's own row entirely.
        try {
          const { data: indUpData, error: indErr } = await supabase
            .from('individual_bonus')
            .update({ paid: newPaid, paid_date: paidDateToSet })
            .eq('bonus_date', date)
            .is('superseded_at', null)
            .in(
              'sales_team_id',
              ((await supabase.from('sales_team').select('id').eq('location_id', loc)).data ?? [])
                .map((t: any) => t.id)
            )
            .select('id')

          if (indErr) {
            console.error('[api/bonuses/update-paid] individual_bonus update error', indErr)
          } else {
            console.log(
              '[api/bonuses/update-paid] marked individual_bonus rows for location',
              loc, date, indUpData?.length ?? 0
            )
          }
        } catch (e2) {
          console.error('[api/bonuses/update-paid] individual_bonus update failed', e2)
        }
      } catch (e) {
        console.error('[api/bonuses/update-paid] item error', classifyError(e))
        return NextResponse.json({ error: (e as any)?.message ?? String(e) }, { status: 500 })
      }
    }

    return NextResponse.json({ updated, total: updated.length })
  } catch (err: any) {
    console.error('[api/bonuses/update-paid] error', classifyError(err))
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
