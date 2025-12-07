import supabase from '@/utils/supabaseClient'
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'

export async function fetchLocations() {
  const locRows: any[] = await fetch_content_service({ table: 'Locations' })
  return locRows
}

export async function fetchBonusRowsForDate(selectedDate: string) {
  const nextDay = new Date(selectedDate)
  nextDay.setDate(nextDay.getDate() + 1)
  const nextDateStr = nextDay.toISOString().slice(0, 10)
  const bonusRows: any[] = await fetch_content_service({
    table: 'bonus',
    filterOptions: [
      { column: 'date', operator: 'gte', value: selectedDate },
      { column: 'date', operator: 'lt', value: nextDateStr },
    ]
  })
  return bonusRows
}

export async function fetchPaidBonusesForDate(selectedDate: string) {
  const nextDay = new Date(selectedDate)
  nextDay.setDate(nextDay.getDate() + 1)
  const nextDateStr = nextDay.toISOString().slice(0, 10)
  // Return all bonus rows where paid === true.
  // Note: callers may still pass a selectedDate but this function now ignores date filters
  // to satisfy the requirement: "fetch only where paid == true regardless of location/date".
  const bonusRows: any[] = await fetch_content_service({
    table: 'bonus',
    matchCase: { key: 'paid', value: true },
  })
  return bonusRows
}

export async function fetchActiveThresholds(selectedDate?: string) {
  try {
    const url = selectedDate ? `/api/bonuses/active-configs?selected_date=${encodeURIComponent(selectedDate)}` : `/api/bonuses/active-configs`
    const resp = await fetch(url)
    if (!resp.ok) return []
    const json = await resp.json()
    return (json.configs || [])
  } catch (e) {
    console.error('[bonus/fetch] thresholds fetch error', e)
    return []
  }
}

export async function fetchBonusConfigHistoryByIds(ids: Array<string | number>) {
  if (!ids || ids.length === 0) return []
  try {
    const rows: any[] = await fetch_content_service({
      table: 'bonus_config_history',
      filterOptions: [
        { column: 'id', operator: 'in', value: ids }
      ]
    })
    return rows
  } catch (e) {
    console.error('[bonus/fetch] fetchBonusConfigHistoryByIds error', e)
    return []
  }
}

// Subscribe to realtime changes on bonus rows for a specific date. Returns an
// unsubscribe function that can be called to cleanup the subscription.
export function subscribeToBonusChanges(selectedDate: string, onChange: () => void) {
  if (typeof window === 'undefined') return { unsubscribe: () => {}, success: false }
  try {
    const channel = supabase.channel(`public:bonus:${selectedDate}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bonus', filter: `date=eq.${selectedDate}` }, (payload: any) => {
        try {
          console.debug('[bonus/fetch] realtime payload', payload)
          onChange()
        } catch (e) {
          console.error('[bonus/fetch] realtime handler error', e)
        }
      })
      .subscribe()

    const unsubscribe = () => {
      try {
        // v2 cleanup
        // @ts-ignore
        supabase.removeChannel?.(channel)
      } catch (e) {
        console.warn('[bonus/fetch] error removing channel', e)
      }
      try { channel.unsubscribe && channel.unsubscribe() } catch (_) {}
    }

    return { unsubscribe, success: true }
  } catch (e) {
    console.warn('[bonus/fetch] realtime subscription failed', e)
    return { unsubscribe: () => {}, success: false }
  }
}

export function startPolling(fn: () => void, intervalMs = 30_000) {
  try {
    const handle = setInterval(() => {
      try { fn() } catch (e) { console.error('[bonus/fetch] polling fn error', e) }
    }, intervalMs)
    return handle
  } catch (e) {
    console.warn('[bonus/fetch] polling setup failed', e)
    return null
  }
}

export function stopPolling(handle: any) {
  try { if (handle) clearInterval(handle) } catch (e) { console.warn('[bonus/fetch] stopPolling failed', e) }
}
