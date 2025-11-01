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
