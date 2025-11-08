"use client"

import { useEffect, useState, useRef } from "react"
import { fetchLocations, fetchBonusRowsForDate, fetchActiveThresholds, subscribeToBonusChanges, startPolling, stopPolling, fetchPaidBonusesForDate, fetchBonusConfigHistoryByIds } from './fetch'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Phone, Mail, User, DollarSign } from "lucide-react"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const BonusPage = () => {
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientCreditBalances, setPatientCreditBalances] = useState<{[key: number]: number}>({})
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [totalsByLocation, setTotalsByLocation] = useState<Record<string, { locationId: string | number, total: number, count: number }>>({})
  const [bonusRowsByLocation, setBonusRowsByLocation] = useState<Record<string, any>>({})
  const [thresholdsByLocation, setThresholdsByLocation] = useState<Record<string, any>>({})

  const [paidBonusRowsByLocation, setPaidBonusRowsByLocation] = useState<Record<string, any>>({})
  // Raw list of paid bonus rows fetched for the Transactions tab (no location collapse)
  const [paidBonusRows, setPaidBonusRows] = useState<any[]>([])
  const [paidConfigById, setPaidConfigById] = useState<Record<string, any>>({})
  const [bonusConfigById, setBonusConfigById] = useState<Record<string, any>>({})

  const [originalBonuses, setOriginalBonuses] = useState<any[]>([])

  const getYesterdayYMD = () => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  }
  const getTodayYMD = () => {
    return new Date().toISOString().slice(0, 10)
  }
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({ date: getYesterdayYMD() })
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterDraft, setFilterDraft] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(6)
  const [bonusTypeByPatient, setBonusTypeByPatient] = useState<Record<string, string>>({})
  const [bonusValueByPatient, setBonusValueByPatient] = useState<Record<string, string>>({})
  const [bonusLimitByPatient, setBonusLimitByPatient] = useState<Record<string, string>>({})
  const [paidByPatient, setPaidByPatient] = useState<Record<string, boolean>>({})
  const [editedByPatient, setEditedByPatient] = useState<Record<string, boolean>>({})
  const [saveMessage, setSaveMessage] = useState<string>("")

  type ActiveTab = 'calculation' | 'transactions' | 'set-limits'
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculation')
  


  const fetchingRef = useRef(false)

  const fetchData = async () => {
    // Prevent overlapping fetches which cause rapid UI loading flashes
    if (fetchingRef.current) {
      console.debug('[bonus/page] fetchData skipped because a fetch is already in progress')
      return
    }
    fetchingRef.current = true
    setLoadingPatients(true)
    try {
      // Debug: log that fetchData started and which date/tab we're fetching for
      try {
        const sel = columnFilters.date ?? getTodayYMD()
        console.debug('[bonus/page] fetchData start', { selectedDate: sel, activeTab })
      } catch (_) {}
    // fetch all locations (table name: "Locations")
    console.debug('[bonus/page] fetching locations')
    const locRows: any[] = await fetchLocations().catch(() => [])
      const patientsFromLocations: any[] = locRows.map(r => {
        const rawId = r.id ?? r.location_id ?? r.locationid ?? r.location
        const idNum = Number(rawId)
        const id = Number.isNaN(idNum) ? String(rawId) : idNum
        return {
          id,
          title: r.name ?? r.title ?? r.location_name ?? r.location_title ?? `Location ${rawId}`,
        }
      })

    // fetch only bonus rows that match the selected date (default: yesterday)
    // This avoids pulling all historical rows and then filtering client-side.
    const selectedDate = columnFilters.date ?? getTodayYMD()
    console.debug('[bonus/page] fetching bonusRows for date', { selectedDate })
      // Build a date range: [selectedDate, nextDate) so we can query date/datetime
      const nextDay = new Date(selectedDate)
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDateStr = nextDay.toISOString().slice(0, 10)

      const bonusRows: any[] = await fetchBonusRowsForDate(selectedDate).catch(() => [])

      // Log raw bonus rows returned from the backend so we can inspect the data
      try {
        console.log('[bonus/page] raw bonusRows count=', (bonusRows || []).length, 'sample=', (bonusRows || []).slice(0, 30))
      } catch (_) {}

      // Since we're only fetching rows for the selected date, map directly by location id.
      const map: Record<string, any> = {}
      bonusRows.forEach(r => {
        const locKey = String(r.location_id ?? r.locationid ?? r.location)
        if (locKey) map[locKey] = r
      })

      setPatients(patientsFromLocations)
      setBonusRowsByLocation(map)

      // If bonus rows reference a bonus_config_history id, fetch those configs
      let cfgMapLocal: Record<string, any> | undefined = undefined
      try {
        const cfgIds = Array.from(new Set((bonusRows || []).map((r: any) => r?.bonus_config_history_id).filter((id: any) => id !== undefined && id !== null)))
        console.debug('[bonus/page] bonus rows (calculation) reference config ids', { cfgIds })
        if (cfgIds.length > 0) {
          if (typeof fetchBonusConfigHistoryByIds === 'function') {
            const cfgRows = await (fetchBonusConfigHistoryByIds as any)(cfgIds).catch(() => [])
            cfgMapLocal = {}
            ;(cfgRows || []).forEach((c: any) => { cfgMapLocal![String(c.id)] = c })
            setBonusConfigById(cfgMapLocal)
            console.debug('[bonus/page] fetched bonus_config_history rows (calculation)', { count: (cfgRows || []).length, keys: Object.keys(cfgMapLocal).slice(0,50), sample: (cfgRows || []).slice(0,10) })
          } else {
            console.warn('[bonus/page] fetchBonusConfigHistoryByIds is not a function for calculation tab', typeof fetchBonusConfigHistoryByIds)
            setBonusConfigById({})
            cfgMapLocal = {}
          }
        } else {
          setBonusConfigById({})
          cfgMapLocal = {}
        }
      } catch (e) {
        console.error('[bonus/page] fetchBonusConfigHistoryByIds (calculation) error', e)
        setBonusConfigById({})
        cfgMapLocal = {}
      }

      // Fetch active thresholds for the selected date and map by location_id
      // Declare thrMap in outer scope so it can be referenced later when
      // initializing editable fields (TypeScript needs the name in this scope).
      console.debug('[bonus/page] fetching active thresholds for date', { selectedDate })
      let thrMap: Record<string, any> | undefined
      try {
        // Request active configs with no date to prefer rows where effective_to IS NULL
        const thrList = await fetchActiveThresholds().catch(() => [])
        thrMap = {}
        ;(thrList || []).forEach((t: any) => {
          const key = String(t.location_id)
          thrMap![key] = t
        })
        console.debug('[bonus/page] active configs mapped by location', Object.keys(thrMap).length, thrMap)
        setThresholdsByLocation(thrMap)
      } catch (e) {
        console.error('[bonus/page] thresholds fetch error', e)
        thrMap = {}
        setThresholdsByLocation({})
      }

      // build originalBonuses array for change detection
      try {
  const selectedDate = columnFilters.date ?? getYesterdayYMD()
        const orig: any[] = patientsFromLocations.map((p) => {
          const key = String(p.id)
          const r = map[key]
          // If this bonus row references a config history entry, prefer config values
          const cfg = (r && r.bonus_config_history_id && cfgMapLocal) ? cfgMapLocal[String(r.bonus_config_history_id)] : null
      return {
        location_id: Number(p.id),
        // prefer config (bonus_config_history) values, then new `bonus_threshold` column, fall back to legacy `bonus_limit`
        bonus_limit: (cfg && (cfg?.bonus_threshold !== undefined && cfg?.bonus_threshold !== null)) ? Number(cfg.bonus_threshold) : ((r?.bonus_threshold !== undefined && r?.bonus_threshold !== null) ? Number(r.bonus_threshold) : (r?.bonus_limit !== undefined && r?.bonus_limit !== null ? Number(r.bonus_limit) : 0)),
            flat_percentage: (cfg && (cfg?.flat_percentage !== undefined && cfg?.flat_percentage !== null)) ? String(cfg.flat_percentage) : ((r?.flat_percentage ?? '').toString() || 'FLAT'),
            value: (cfg && (cfg?.value !== undefined && cfg?.value !== null)) ? Number(cfg.value) : ((r?.value ?? r?.val ?? 0) !== undefined && (r?.value ?? r?.val ?? 0) !== null ? Number(r?.value ?? r?.val ?? 0) : 0),
            bonus_amount: (r?.bonus_amount ?? 0) !== undefined && (r?.bonus_amount ?? 0) !== null ? Number(r?.bonus_amount ?? 0) : 0,
            paid: !!(r?.paid ?? false),
            date: (r?.date ?? selectedDate),
          }
        })
        setOriginalBonuses(orig)
      } catch (_) {}

      // initialize paid flags and editable fields from bonus rows where present
      const paidMap: Record<string, boolean> = {}
      const limitMap: Record<string, string> = {}
      const valueMap: Record<string, string> = {}
      const typeMap: Record<string, string> = {}
      const editedInit: Record<string, boolean> = {}
      Object.keys(map).forEach(k => {
        const r = map[k]
        paidMap[k] = !!r?.paid
        // prefer config from bonus_config_history (if the bonus row references one)
        const cfgFromHistory = (r && r.bonus_config_history_id && typeof cfgMapLocal !== 'undefined' && cfgMapLocal) ? cfgMapLocal[String(r.bonus_config_history_id)] : null
        if (cfgFromHistory) {
          try { console.debug('[bonus/page] using bonus_config_history for location', { location: k, configId: r.bonus_config_history_id, cfg: { bonus_threshold: cfgFromHistory.bonus_threshold, flat_percentage: cfgFromHistory.flat_percentage, value: cfgFromHistory.value } }) } catch(_) {}
        }
        if (cfgFromHistory) {
          limitMap[k] = (cfgFromHistory?.bonus_threshold !== undefined && cfgFromHistory?.bonus_threshold !== null) ? String(cfgFromHistory.bonus_threshold) : ''
          valueMap[k] = (cfgFromHistory?.value !== undefined && cfgFromHistory?.value !== null) ? String(cfgFromHistory.value) : ''
          typeMap[k] = (cfgFromHistory?.flat_percentage !== undefined && cfgFromHistory?.flat_percentage !== null) ? String(cfgFromHistory.flat_percentage) : 'FLAT'
        } else {
          // prefer active config (thresholdsByLocation map was just set) if present
          const cfg = (typeof thrMap !== 'undefined' && thrMap && thrMap[k]) ? thrMap[k] : null
          if (cfg) {
            limitMap[k] = (cfg?.bonus_threshold !== undefined && cfg?.bonus_threshold !== null) ? String(cfg.bonus_threshold) : ''
            valueMap[k] = (cfg?.value !== undefined && cfg?.value !== null) ? String(cfg.value) : ''
            typeMap[k] = (cfg?.flat_percentage !== undefined && cfg?.flat_percentage !== null) ? String(cfg.flat_percentage) : 'FLAT'
          } else {
            // initialize from bonus row when no active config
            limitMap[k] = (r?.bonus_threshold !== undefined && r?.bonus_threshold !== null) ? String(r.bonus_threshold) : (r?.bonus_limit !== undefined && r?.bonus_limit !== null ? String(r.bonus_limit) : '')
            const val = r?.value ?? r?.val ?? r?.v ?? r?.value_amount
            valueMap[k] = val !== undefined && val !== null ? String(val) : ''
            typeMap[k] = (r?.flat_percentage ?? '').toString() || 'FLAT'
          }
        }
        editedInit[k] = false
      })

      setPaidByPatient((s) => ({ ...s, ...paidMap }))
      setBonusLimitByPatient((s) => ({ ...s, ...limitMap }))
      setBonusValueByPatient((s) => ({ ...s, ...valueMap }))
      setBonusTypeByPatient((s) => ({ ...s, ...typeMap }))
      setEditedByPatient(editedInit)

    } catch (err) {
      setPatients([])
      setBonusRowsByLocation({})
    } finally {
      setLoadingPatients(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // When the user switches to 'transactions', refetch data so updates are shown quickly
  useEffect(() => {
  if ((activeTab as any) === 'transactions') {
      fetchData()
    }
  }, [activeTab])

  // Re-fetch bonus rows whenever the selected date changes so the table immediately
  // shows rows for the newly-selected date (or '-' for locations without rows).
  useEffect(() => {
    // If we're in Set limits mode, do not fetch or subscribe to any bonus rows for the selected date.
    if (activeTab === 'set-limits') {
      // still reset pagination to first page when date changes in other tabs, keep page at 1 here
      setCurrentPage(1)
      return
    }

    // Avoid double-fetch on mount by only fetching when date changes after initial load.
    // Calling fetchData() here is acceptable; it will fetch bonus rows for the selected date.
    fetchData()
    // reset pagination to first page when date changes
    setCurrentPage(1)
  }, [columnFilters.date, activeTab])

  // Real-time updates: subscribe to Supabase realtime changes on `bonus` for the
  // currently selected date so the UI updates the "Not generated" pill and
  // values as soon as total_sales/threshold change in the DB. Also provide a
  // polling fallback (every 30s) for environments where realtime is unavailable.
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Do not subscribe or poll while the user is in Set limits mode
    if (activeTab === 'set-limits') return

    const selectedDate = columnFilters.date ?? getTodayYMD()
    // Use helper subscription function from fetch.ts
    const sub = subscribeToBonusChanges(selectedDate, () => fetchData())
    let pollHandle: any = null
    if (!sub || !sub.success) {
      // Realtime not available — start polling fallback
      pollHandle = startPolling(() => {

        fetchData()
      }, 30_000)
    }

    return () => {
      try { sub && sub.unsubscribe && sub.unsubscribe() } catch (e) { console.warn('[bonus/page] unsubscribe error', e) }
      try { stopPolling(pollHandle) } catch (e) { console.warn('[bonus/page] stopPolling error', e) }
    }
  }, [columnFilters.date, activeTab])

  // (debug helper removed)

  // bonus rows are fetched in the mount effect above; no additional fetch or logs here

  // removed fetchPatientTransactions per request

  // Modal triggers removed: do not open sheet on row/card/button clicks

  // Filter patients (locations) by optional per-column filters
  const filteredPatients = patients.filter((patient) => {
      // (global search removed)
  // Name filter
    const nameFilter = (columnFilters.name ?? '').toLowerCase()
    if (nameFilter) {
      const name = `${patient.firstname || ''} ${patient.lastname || ''} ${patient.title || patient.name || ''}`.toLowerCase()
      if (!name.includes(nameFilter)) return false
    }

    // Total sales min filter (numeric)
    const totalMinStr = columnFilters.totalMin ?? ''
    if (totalMinStr !== '') {
      const totalMin = Number(totalMinStr)
      const total = (totalsByLocation[String(patient.id)]?.total) ?? 0
      if (isNaN(totalMin) ? false : total < totalMin) return false
    }

    // Bonus limit filter (min)
    const limitMinStr = columnFilters.limitMin ?? ''
    if (limitMinStr !== '') {
      const limitMin = Number(limitMinStr)
  const limitVal = Number(bonusLimitByPatient[String(patient.id)] ?? 0)
      if (isNaN(limitMin) ? false : limitVal < limitMin) return false
    }

    // Flat/Percentage filter
    const typeFilter = (columnFilters.type ?? '').toUpperCase()
    if (typeFilter) {
  const type = (bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase()
      if (typeFilter !== 'ALL' && type !== typeFilter) return false
    }

    // Value min filter
    const valueMinStr = columnFilters.valueMin ?? ''
    if (valueMinStr !== '') {
      const valMin = Number(valueMinStr)
  const val = Number(bonusValueByPatient[String(patient.id)] ?? 0)
      if (isNaN(valMin) ? false : val < valMin) return false
    }

    // Bonus amount min filter
    const bonusMinStr = columnFilters.bonusMin ?? ''
    if (bonusMinStr !== '') {
      const bonusMin = Number(bonusMinStr)
      const bonusAmt = computeBonusAmount(patient)
      if (isNaN(bonusMin) ? false : bonusAmt < bonusMin) return false
    }

    // Date filter (YYYY-MM-DD exact match-ish)
    // Keep default behavior of filtering by selected date, BUT do not hide locations that have no bonus row for that date.
    // i.e., show all locations; if a location has no bonus row for the selected date, it will render with '-' values.
    const dateFilter = (columnFilters.date ?? '')
    if (dateFilter) {
      const b = bonusRowsByLocation[String(patient.id)]
      // If a bonus row exists, enforce the date match. If no bonus row exists, include the location so it shows as '-'.
      if (b) {
        const rowDate = (b.date !== undefined && b.date !== null) ? String(b.date).slice(0, 10) : ''
        if (!rowDate || !rowDate.includes(dateFilter)) return false
      }
    }

    return true
  })

  const indexOfLastPatient = currentPage * patientsPerPage
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage
  // Show all filtered patients in a single scrollable table (pagination UI removed)
  const currentPatients = filteredPatients
  const totalPages = 1

  // For the transactions tab we want to display paid bonuses fetched from the DB
  // for the currently selected date. By default the selected date is yesterday
  // so yesterday's paid bonuses will show on first load.
  const transactionPatients = currentPatients.filter((p) => {
    const locId = String(p.id)
    const b = paidBonusRowsByLocation[locId]
    // Only include locations that have a paid bonus row in the DB for the selected date
    return !!b
  })

  // When Transactions tab or the selected date changes, fetch paid bonus rows
  useEffect(() => {
    if ((activeTab as any) !== 'transactions') return
    const selectedDate = columnFilters.date ?? getYesterdayYMD()
    let mounted = true
    ;(async () => {
      try {

        const rows = await fetchPaidBonusesForDate(selectedDate).catch(() => [])
        if (!mounted) return

        setPaidBonusRows(rows)
        const map: Record<string, any> = {}
        rows.forEach((r: any) => {
          const key = String(r.location_id ?? r.locationid ?? r.location)
          if (key) map[key] = r
        })
        setPaidBonusRowsByLocation(map)


        try {
          const cfgIds = Array.from(new Set((rows || []).map((r: any) => r?.bonus_config_history_id).filter((id: any) => id !== undefined && id !== null)))
         
          if (cfgIds.length > 0) {

            if (typeof fetchBonusConfigHistoryByIds === 'function') {
              const cfgRows = await (fetchBonusConfigHistoryByIds as any)(cfgIds).catch(() => [])
              
              const cfgMap: Record<string, any> = {}
              ;(cfgRows || []).forEach((c: any) => { cfgMap[String(c.id)] = c })
              setPaidConfigById(cfgMap)
            } else {
           
              setPaidConfigById({})
            }
          } else {
            setPaidConfigById({})
          }
        } catch (e) {
          console.error('[bonus/page] fetchBonusConfigHistoryByIds error', e)
          setPaidConfigById({})
        }
      } catch (e) {
        console.error('[bonus/page] fetchPaidBonusesForDate error', e)
        if (mounted) setPaidBonusRowsByLocation({})
        if (mounted) setPaidBonusRows([])
      }
    })()
    return () => { mounted = false }
  }, [activeTab, columnFilters.date])

  useEffect(() => {
    setCurrentPage(1)
  }, [columnFilters])


  useEffect(() => {
    try {
  const selectedDate = columnFilters.date ?? getYesterdayYMD()
      console.debug('[bonus/page] display data', {
        selectedDate,
        totalPatients: patients.length,
        filteredPatientsCount: filteredPatients.length,
        currentPatientsCount: currentPatients.length,

        sampleCurrentPatients: currentPatients.slice(0, 10).map((p) => {
          const key = String(p.id)
          const db = bonusRowsByLocation[key] || null
          const display = {
            id: p.id,
            title: p.title,
            total_sales_db: db ? (db.total_sales ?? null) : null,
       
            bonus_limit_input: bonusLimitByPatient[key] ?? (db ? (db.bonus_threshold ?? db.bonus_limit ?? null) : null),
            flat_percentage_input: bonusTypeByPatient[key] ?? (db ? (db.flat_percentage ?? null) : null),
            value_input: bonusValueByPatient[key] ?? (db ? (db.value ?? db.val ?? null) : null),
            bonus_amount_db: db ? (db.bonus_amount ?? null) : null,
            computed_bonus: computeBonusAmount(p),
            edited: !!editedByPatient[key],
            rowDate: db ? (db.date ?? null) : null,
          }
          return display
        }),
        bonusRowsSampleCount: Object.keys(bonusRowsByLocation).length,
        bonusRowsSampleKeys: Object.keys(bonusRowsByLocation).slice(0, 20),
      })
    } catch (err) {
      console.error('[bonus/page] display data error', err)
    }
  }, [patients, filteredPatients.length, currentPatients.length, columnFilters.date, bonusRowsByLocation, bonusLimitByPatient, bonusValueByPatient, bonusTypeByPatient, editedByPatient])

  

  useEffect(() => {

    if ((activeTab as string) !== 'calculation') return
    try {
  const selectedDate = columnFilters.date ?? getTodayYMD()

      const sample = patients.slice(0, 10)
      sample.forEach(async (p) => {
        try {
          const locId = p.id
          const resp = await fetch(`/api/bonuses/config-query?location_id=${encodeURIComponent(locId)}&selected_date=${encodeURIComponent(selectedDate)}`)
          const json = await resp.json()
          console.log('[bonus/page] config-query', { location_id: locId, selectedDate, result: json })
        } catch (e) {
          console.error('[bonus/page] config-query fetch error for location', p.id, e)
        }
      })
    } catch (err) {
      console.error('[bonus/page] config-query error', err)
    }
  }, [activeTab, patients, columnFilters.date])

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const { t } = useTranslation(translationConstant.TRANSACTION)
  const isSetLimits = activeTab === 'set-limits'
  const isCalcOrSet = activeTab === 'calculation' || activeTab === 'set-limits'

  const generateTransactionId = (index: number) => `TXN${String(index + 1).padStart(3, "0")}`

  const getTransactionStatus = (transaction: any) => {
    const statuses = ["Completed", "Pending", "Partial"]
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  const getPaymentMethod = (transaction: any) => {
    const methods = ["Credit Card", "Cash", "Insurance", "Bank Transfer"]
    return methods[Math.floor(Math.random() * methods.length)]
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "partial":
        return "outline"
      default:
        return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "partial":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }


  const computeBonusAmount = (patient: any) => {
    const total = bonusRowsByLocation[String(patient.id)]?.total_sales ?? (totalsByLocation[String(patient.id)]?.total) ?? 0
  const type = (bonusTypeByPatient[String(patient.id)] ?? 'FLAT')
  const valStr = (bonusValueByPatient[String(patient.id)] ?? '')

    const thr = thresholdsByLocation[String(patient.id)]
    const limitStr = thr && (thr.bonus_threshold !== undefined && thr.bonus_threshold !== null)
  ? String(thr.bonus_threshold)
  : (bonusLimitByPatient[String(patient.id)] ?? '')

    const value = valStr === '' ? 0 : Number(valStr)
    const limit = limitStr === '' ? null : Number(limitStr)
    let amount = 0

    if (type === 'FLAT') {
        amount = isNaN(value) ? 0 : value
    } else {
      // PERCENTAGE
      const pct = isNaN(value) ? 0 : value
      // percentage is applied to the total sales (not capped)
      amount = total * (pct / 100)
    }

   
      if (limit !== null && !isNaN(limit)) {
        if (total <= limit) {
          amount = 0
        } else if (type === 'FLAT') {
          const allowed = Math.max(0, total - limit)
          amount = Math.min(amount, allowed)
        }
        
      }

    return amount
  }


  const renderBigDash = (className = 'text-gray-400') => (
    <span className={`${className} text-2xl font-semibold`} aria-hidden>
      —
    </span>
  )


  const todayStr = new Date().toLocaleDateString()


  const handleSave = () => {

    const locIds = patients.map(p => String(p.id))
  const selectedDate = columnFilters.date ?? getYesterdayYMD()

    let changed: any[] = []
    if (isSetLimits) {
      const today = selectedDate
      const rows: any[] = []
      for (const locId of locIds) {
        const locationId = Number(locId)
        const key = String(locId)
        const orig = originalBonuses.find(o => Number(o.location_id) === Number(locationId))
        const currThreshold = (bonusLimitByPatient[key] !== undefined && bonusLimitByPatient[key] !== '') ? Number(bonusLimitByPatient[key]) : (bonusRowsByLocation[key]?.bonus_threshold ?? bonusRowsByLocation[key]?.bonus_limit ?? 0)
        const currFlat = (bonusTypeByPatient[key] ?? bonusRowsByLocation[key]?.flat_percentage ?? 'FLAT')
        const currValue = (bonusValueByPatient[key] !== undefined && bonusValueByPatient[key] !== '') ? Number(bonusValueByPatient[key]) : (bonusRowsByLocation[key]?.value ?? bonusRowsByLocation[key]?.val ?? 0)

        const origThreshold = orig ? Number(orig.bonus_limit ?? 0) : 0
        const origFlat = orig ? String(orig.flat_percentage ?? 'FLAT') : 'FLAT'
        const origValue = orig ? Number(orig.value ?? 0) : 0

        const thresholdChanged = Number(currThreshold || 0) !== Number(origThreshold || 0)
        const flatChanged = (String(currFlat ?? '').toUpperCase() !== String(origFlat ?? '').toUpperCase())
        const valueChanged = Number(currValue || 0) !== Number(origValue || 0)

        if (thresholdChanged || flatChanged || valueChanged) {
          rows.push({
            location_id: locationId,
            flat_percentage: currFlat,
            value: currValue,
            bonus_threshold: currThreshold,
          })
        }
      }
      changed = rows
    } else {

      const paidChanged: any[] = []
      for (const locId of locIds) {
        const key = String(locId)
        const locationId = Number(locId)
        const date = bonusRowsByLocation[key]?.date ?? selectedDate
        const orig = originalBonuses.find(o => Number(o.location_id) === Number(locationId) && String(o.date || '') === String(date || ''))
        const currPaid = !!(paidByPatient[key] ?? false)
        const origPaid = !!(orig?.paid ?? false)
        if (currPaid !== origPaid) {
          paidChanged.push({ location_id: locationId, date, paid: currPaid })
        }
      }
      changed = paidChanged
    }

    if (changed.length === 0) {
      try { toast.info('No changes detected') } catch(_) {}
      return
    }

    ;(async () => {
      try {

        if (isSetLimits) {
          const resp = await fetch('/api/bonuses/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bonuses: changed, configOnly: true }),
          })
          let json = null
          try { json = await resp.json() } catch (_) {}

          if (!resp.ok) {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('bonusSettings', JSON.stringify({ bonuses: changed }))
            }
            setSaveMessage('Save failed')
            try { toast.error('Failed to update bonuses') } catch(_) {}
            setTimeout(() => setSaveMessage(''), 3000)
            return
          }

          setSaveMessage('Saved')
          try { toast.success('Bonus updated successfully') } catch(_) {}
          setTimeout(() => setSaveMessage(''), 2000)
        
          try {
            const updatedOrig = originalBonuses.map(o => {
              const match = changed.find(c => Number(c.location_id) === Number(o.location_id) && String(c.date || '') === String(o.date || ''))
              return match ? { ...o, ...match } : o
            })
            changed.forEach(c => {
              const exists = updatedOrig.find(u => Number(u.location_id) === Number(c.location_id) && String(u.date || '') === String(c.date || ''))
              if (!exists) updatedOrig.push(c)
            })
            setOriginalBonuses(updatedOrig)

          } catch (_) {}
          return
        }


        const resp = await fetch('/api/bonuses/update-paid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: changed }),
        })
        let json = null
        try { json = await resp.json() } catch (_) {}

        if (!resp.ok) {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('bonusSettings', JSON.stringify({ paidUpdates: changed }))
          }
          setSaveMessage('Save failed')
          try { toast.error('Failed to update paid status') } catch(_) {}
          setTimeout(() => setSaveMessage(''), 3000)
          return
        }

        setSaveMessage('Saved')
        try { toast.success('Paid status updated') } catch(_) {}
        setTimeout(() => setSaveMessage(''), 2000)


        try {
          const updatedOrig = originalBonuses.map(o => {
            const match = changed.find(c => Number(c.location_id) === Number(o.location_id) && String(c.date || '') === String(o.date || ''))
            return match ? { ...o, paid: match.paid, paid_date: match.paid ? (o.paid_date ?? new Date().toISOString().slice(0,10)) : null } : o
          })
       
          changed.forEach(c => {
            const exists = updatedOrig.find(u => Number(u.location_id) === Number(c.location_id) && String(u.date || '') === String(c.date || ''))
            if (!exists) updatedOrig.push({ location_id: c.location_id, date: c.date, paid: c.paid })
          })
          setOriginalBonuses(updatedOrig)
          try { fetchData() } catch (_) {}
        } catch (_) {}
      } catch (err) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('bonusSettings', JSON.stringify({ paidUpdates: changed }))
        }
        setSaveMessage('Save failed')
        try { toast.error('Failed to update bonuses') } catch(_) {}
        setTimeout(() => setSaveMessage(''), 3000)
      }
    })()
  }


  const [setLimitLocation, setSetLimitLocation] = useState<string>('')
  const [setLimitType, setSetLimitType] = useState<'FLAT' | 'PERCENTAGE'>('FLAT')
  const [setLimitValue, setSetLimitValue] = useState<string>('')
  const [setLimitThreshold, setSetLimitThreshold] = useState<string>('')
  const [setLimitSubmitting, setSetLimitSubmitting] = useState(false)

  const [setLimitSearch, setSetLimitSearch] = useState<string>('')
  const filteredLimitPatients = (patients || []).filter((p: any) => {
    if (!setLimitSearch) return true
    const title = (p?.title ?? '').toString().toLowerCase()
    return title.includes(setLimitSearch.toLowerCase())
  })

  // Per-location editable limits for Set limits tab
  const [limitsByLocation, setLimitsByLocation] = useState<Record<string, { flat_percentage: 'FLAT' | 'PERCENTAGE', value: string, bonus_threshold: string, edited?: boolean }>>({})

  // Populate limitsByLocation when entering Set limits tab or when patients change
  useEffect(() => {
    if (activeTab !== 'set-limits') return
    const map: Record<string, { flat_percentage: 'FLAT' | 'PERCENTAGE', value: string, bonus_threshold: string }> = {}
    ;(patients || []).forEach((p: any) => {
      const key = String(p.id)
      const b = bonusRowsByLocation[key] || {}
      const thr = thresholdsByLocation[key] || {}
      map[key] = {
        // prefer explicit value from active thresholds/config if available, otherwise fall back to bonus row
        flat_percentage: (b.flat_percentage || b.flatPercentage || b.flat_percentage === 0) ? (String(b.flat_percentage).toUpperCase() === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT') : (thr.flat_percentage ? (String(thr.flat_percentage).toUpperCase() === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT') : 'FLAT'),
        value: (thr.value ?? b.value ?? b.val ?? '') !== null ? String(thr.value ?? b.value ?? b.val ?? '') : '',
        bonus_threshold: (thr.bonus_threshold ?? b.bonus_threshold ?? b.bonus_limit ?? '') !== null ? String(thr.bonus_threshold ?? b.bonus_threshold ?? b.bonus_limit ?? '') : '',
      }
    })
    setLimitsByLocation(map)
  }, [activeTab, patients, bonusRowsByLocation, thresholdsByLocation])

  const handleSetLimitSubmit = async () => {
  
    if (!setLimitLocation) {
      try { toast.error('Please enter a Location ID') } catch(_) {}
      return
    }
    const locationId = Number(setLimitLocation)
    if (Number.isNaN(locationId)) {
      try { toast.error('Location must be a numeric ID') } catch(_) {}
      return
    }
    const valueNum = Number(setLimitValue)
    if (setLimitValue !== '' && Number.isNaN(valueNum)) {
      try { toast.error('Value must be numeric') } catch(_) {}
      return
    }

    
    const thresholdNum = Number(setLimitThreshold)
    if (setLimitThreshold !== '' && Number.isNaN(thresholdNum)) {
      try { toast.error('Threshold must be numeric') } catch(_) {}
      return
    }
    const thresholdRounded = setLimitThreshold === '' ? null : (Number.isNaN(thresholdNum) ? null : Math.round(thresholdNum * 100) / 100)

    const payload = {
      bonuses: [
        {
          location_id: locationId,
          flat_percentage: setLimitType,
          value: setLimitValue === '' ? null : valueNum,
          bonus_threshold: thresholdRounded,
        },
      ],
      configOnly: true,
    }

    setSetLimitSubmitting(true)
    try {
      const resp = await fetch('/api/bonuses/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      let json = null
      try { json = await resp.json() } catch (_) {}
      if (!resp.ok) {
        try { toast.error('Failed to save configuration') } catch(_) {}
        return
      }
      try { toast.success('Configuration saved') } catch(_) {}
  
      setSetLimitLocation('')
      setSetLimitType('FLAT')
      setSetLimitValue('')
  setSetLimitThreshold('')
    } catch (e) {
      try { toast.error('Failed to save configuration') } catch(_) {}
    } finally {
      setSetLimitSubmitting(false)
    }
  }

  const handleSetLimitValueChange = (raw: string) => {
 
    if (raw === '') { setSetLimitValue(''); return }
   
    const cleaned = raw.replace(/[^0-9.\-]/g, '')
    
    const num = Number(cleaned)
    if (setLimitType === 'PERCENTAGE') {
      if (Number.isNaN(num)) {
        setSetLimitValue('')
        return
      }
      
      const clamped = Math.max(0, Math.min(100, num))
      
      setSetLimitValue(String(Math.round(clamped * 100) / 100))
      return
    }

    if (Number.isNaN(num)) {
      setSetLimitValue('')
      return
    }
    setSetLimitValue(String(cleaned))
  }

  const handleSetLimitThresholdChange = (raw: string) => {
   
    if (raw === '') { setSetLimitThreshold(''); return }
  
    let cleaned = raw.replace(/[^0-9.\-]/g, '')

    const hasLeadingMinus = raw.trim().startsWith('-')

    cleaned = cleaned.replace(/-/g, '')

    const parts = cleaned.split('.')
    cleaned = parts.shift() || ''
    if (parts.length > 0) cleaned = `${cleaned}.${parts.join('')}`
    if (hasLeadingMinus && cleaned !== '') cleaned = `-${cleaned}`

    setSetLimitThreshold(cleaned)
  }

    return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-[#0e1725] dark:text-white">

      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bonus</h1>
        </div>
      </div>



      <div className="mb-4">
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('calculation')}
            className={`${activeTab === 'calculation' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-600 dark:text-gray-300'} py-2 px-3`}
          >
            Bonus calculation
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`${(activeTab as any) === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-600 dark:text-gray-300'} py-2 px-3`}
          >
            Bonus transactions
          </button>
          <button
            onClick={() => setActiveTab('set-limits')}
            className={`${activeTab === 'set-limits' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-600 dark:text-gray-300'} py-2 px-3`}
          >
            Set limits
          </button>
        </div>
      </div>

      {/* Global search removed */}

  {activeTab === 'calculation' && (
        loadingPatients ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500 dark:text-gray-300">Loading bonuses...</div>
          </div>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-[#0e1725] rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto max-h-[60vh]">
              {/* Toolbar: right-aligned filter button */}
              <div className="flex justify-end p-4">
                <Button
                  size="sm"
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                  onClick={() => { setFilterDraft({ ...columnFilters }); setIsFilterOpen(true) }}
                  aria-label="Open filters"
                  title="Open filters"
                >
                  Filter
                </Button>
              </div>
              <Table>
                  <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#0e1725] dark:border-gray-700">
                    <TableHead className="font-semibold w-[200px] text-gray-500 dark:text-gray-400">Name</TableHead>
                    {!isSetLimits && <TableHead className="font-semibold w-[180px] text-gray-500 dark:text-gray-400">Total Sales</TableHead>}
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Bonus Threshold</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Flat/Percentage</TableHead>
                    <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Value</TableHead>
                    {!isSetLimits && <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Bonus amount</TableHead>}
                    {!isSetLimits && <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Date</TableHead>}
                    {(activeTab as any) === 'transactions' && <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Paid date</TableHead>}
                    {!isSetLimits && <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Bonus Eligibility</TableHead>}
                    {!isSetLimits && <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">Status</TableHead>}
                  </TableRow>
                  {/* Inline filters removed - use Filter modal instead */}
                </TableHeader>
                <TableBody className="dark:bg-[#0e1725]">
                  {currentPatients.length > 0 ? (
                    currentPatients.map((patient) => {
                      const balance = patientCreditBalances[patient.id] || 0
                      return (
                        <TableRow 
                          key={patient.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725]"
                        >
                          <TableCell className="font-medium dark:text-white">
                            {patient.title || patient.name || `Location ${patient.id}`}
                          </TableCell>
                          {!isSetLimits && (
                            <TableCell className="dark:text-white">
                              {/* Total sales: read from bonus DB when available, otherwise show - */}
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                { (() => {
                                    const b = bonusRowsByLocation[String(patient.id)]
                                    if (b && (b.total_sales !== undefined && b.total_sales !== null)) {
                                      return `$${Number(b.total_sales).toFixed(2)}`
                                    }
                                    return renderBigDash('text-gray-400')
                                  })()
                                }
                              </span>
                            </TableCell>
                          )}
                          <TableCell className="dark:text-white">
                            {/* Bonus Threshold: prefer active threshold (thresholdsByLocation), then authoritative bonus row value (bonus_threshold or bonus_limit), otherwise show editable input */}
                            {(() => {
                              const key = String(patient.id)
                              const thr = thresholdsByLocation[key]
                              const b = bonusRowsByLocation[key]
                              if (thr && (thr.bonus_threshold !== undefined && thr.bonus_threshold !== null)) {
                                return <span className="font-semibold">${Number(thr.bonus_threshold).toFixed(2)}</span>
                              }
                              // Prefer a stored value on the bonus row if present
                              if (b && (b.bonus_threshold !== undefined && b.bonus_threshold !== null)) {
                                return <span className="font-semibold">${Number(b.bonus_threshold).toFixed(2)}</span>
                              }
                              if (b && (b.bonus_limit !== undefined && b.bonus_limit !== null)) {
                                return <span className="font-semibold">${Number(b.bonus_limit).toFixed(2)}</span>
                              }
                              // Fallback to editable input when no authoritative value present
                              return (
                                isSetLimits ? (
                                  <input
                                    className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                                    placeholder="Min"
                                    inputMode="numeric"
                                    value={bonusLimitByPatient[String(patient.id)] ?? ''}
                                    onChange={(e) => {
                                      const key2 = String(patient.id)
                                      setBonusLimitByPatient((s) => ({ ...s, [key2]: e.target.value }))
                                      setEditedByPatient((s) => ({ ...s, [key2]: true }))
                                    }}
                                  />
                                ) : (
                                    renderBigDash('text-gray-500')
                                  )
                              )
                            })()}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Flat/Percentage: editable select (initialized from DB) */}
                            { isSetLimits ? (
                              <select
                                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                                value={bonusTypeByPatient[String(patient.id)] ?? 'FLAT'}
                                onChange={(e) => {
                                  const key = String(patient.id)
                                  setBonusTypeByPatient((s) => ({ ...s, [key]: e.target.value }))
                                  setEditedByPatient((s) => ({ ...s, [key]: true }))
                                }}
                              >
                                <option value="FLAT">FLAT</option>
                                <option value="PERCENTAGE">PERCENTAGE</option>
                              </select>
                            ) : (
                              <span className="text-gray-700 dark:text-white">{String(bonusTypeByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.flat_percentage ?? 'FLAT')).toUpperCase()}</span>
                            ) }
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Value: editable input (initialized from DB) */}
                            { isSetLimits ? (
                              <div className="flex items-center">
                                <span className="mr-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '' : '$'}</span>
                                <input
                                  className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                                  placeholder="Value"
                                  inputMode="decimal"
                                  value={bonusValueByPatient[String(patient.id)] ?? ''}
                                  onChange={(e) => {
                                    const key = String(patient.id)
                                    // allow only numbers and a single decimal point
                                    let v = String(e.target.value).replace(/[^0-9.]/g, '')
                                    const parts = v.split('.')
                                    if (parts.length > 1) v = parts.shift() + '.' + parts.join('')
                                    setBonusValueByPatient((s) => ({ ...s, [key]: v }))
                                    setEditedByPatient((s) => ({ ...s, [key]: true }))
                                  }}
                                />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '%' : ''}</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="mr-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '' : '$'}</span>
                                <span className="text-gray-700 dark:text-white">{bonusValueByPatient[String(patient.id)] ?? ((bonusRowsByLocation[String(patient.id)]?.value ?? bonusRowsByLocation[String(patient.id)]?.val) ?? renderBigDash('text-gray-700'))}</span>
                                <span className="ml-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '%' : ''}</span>
                              </div>
                            ) }
                          </TableCell>
                          {!isSetLimits && (
                            <TableCell className="dark:text-white">
                              {/* Bonus amount: if user edited inputs show computed, otherwise prefer DB value then computed fallback */}
                              {(() => {
                                const key = String(patient.id)
                                const b = bonusRowsByLocation[key]
                                const isEdited = !!editedByPatient[key]
                                if (isEdited) {
                                  const computed = computeBonusAmount(patient)
                                  if (computed && computed > 0) return <span className="font-semibold text-blue-600 dark:text-blue-400">${computed.toFixed(2)}</span>
                                  return renderBigDash('text-gray-400')
                                }
                                if (b && (b.bonus_amount !== undefined && b.bonus_amount !== null)) {
                                  return <span className="font-semibold text-blue-600 dark:text-blue-400">${Number(b.bonus_amount).toFixed(2)}</span>
                                }
                                const computed = computeBonusAmount(patient)
                                if (computed && computed > 0) return <span className="font-semibold text-blue-600 dark:text-blue-400">${computed.toFixed(2)}</span>
                                return renderBigDash('text-gray-400')
                              })()}
                            </TableCell>
                          )}
                          {!isSetLimits && (
                            <TableCell>
                              {(() => {
                                const b = bonusRowsByLocation[String(patient.id)]
                                if (b && (b.date !== undefined && b.date !== null)) {
                                  return <span className="text-gray-500 dark:text-gray-300">{String(b.date)}</span>
                                }
                                return renderBigDash('text-gray-400')
                              })()}
                            </TableCell>
                          )}
                          {(activeTab as any) === 'transactions' && (
                            <TableCell>
                              {(() => {
                                const b = bonusRowsByLocation[String(patient.id)]
                                if (b && (b.paid_date !== undefined && b.paid_date !== null)) {
                                  return <span className="text-gray-500 dark:text-gray-300">{String(b.paid_date)}</span>
                                }
                                return <span className="text-gray-400">-</span>
                              })()}
                            </TableCell>
                          )}
                          {!isSetLimits && (
                            <TableCell className="dark:text-white">
                              {/* Bonus generated: green if bonus > 0, red otherwise */}
                              {(() => {
                                const key = String(patient.id)
                                const b = bonusRowsByLocation[key]
                                // Use explicit boolean `bonus_eligibility` from the bonus row.
                                // Treat any non-true value as not eligible.
                                const has = !!(b && b.bonus_eligibility === true)
                                if (has) {
                                  return (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                      Yes
                                    </span>
                                  )
                                }
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                                    No
                                  </span>
                                )
                              })()}
                            </TableCell>
                          )}
                          {!isSetLimits && (
                            <TableCell>
                              {(() => {
                                const key = String(patient.id)
                                const b = bonusRowsByLocation[key]
                                // Use explicit boolean `bonus_eligibility` from the bonus row for button enablement
                                const isGenerated = !!(b && b.bonus_eligibility === true)
                                const isPaid = !!(paidByPatient[String(patient.id)] ?? false)
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!isGenerated}
                                    className={
                                      !isGenerated
                                        ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500 border-gray-200'
                                        : (isPaid
                                            ? 'bg-blue-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                                            : 'bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700')
                                    }
                                    onClick={async (e) => {
                                      if (!isGenerated) return
                                      e.stopPropagation()
                                      const newPaid = !isPaid
                                      // optimistic UI
                                      setPaidByPatient((s) => ({ ...s, [key]: newPaid }))
                                      try {
                                        const selectedDate = columnFilters.date ?? getYesterdayYMD()
                                        const resp = await fetch('/api/bonuses/update-paid', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ items: [{ location_id: Number(key), date: (b?.date ?? selectedDate), paid: newPaid }] })
                                        })
                                        if (!resp.ok) {
                                          // revert
                                          setPaidByPatient((s) => ({ ...s, [key]: isPaid }))
                                          toast.error('Failed to update paid status')
                                        } else {
                                          toast.success(newPaid ? 'Marked as paid' : 'Marked as unpaid')
                                          try { fetchData() } catch (_) {}
                                        }
                                      } catch (err) {
                                        setPaidByPatient((s) => ({ ...s, [key]: isPaid }))
                                        toast.error('Failed to update paid status')
                                      }
                                    }}
                                    aria-pressed={isPaid}
                                  >
                                    <span className="text-white">{isPaid ? 'Paid' : 'Pay'}</span>
                                  </Button>
                                )
                              })()}
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-400 dark:text-gray-300">
                        No bonuses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </div>

            {/* Filter Sheet / Modal for desktop */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetContent className="w-full max-w-md dark:bg-[#0e1725] m-3 rounded-lg dark:border-gray-700">
                <SheetHeader>
                  <SheetTitle className="text-xl font-semibold dark:text-white">Filters</SheetTitle>
                </SheetHeader>

                <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300">Name</label>
                      <select
                        id="filter-name-input-modal"
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                        value={filterDraft.name ?? ''}
                        onChange={(e) => setFilterDraft((s) => ({ ...s, name: e.target.value }))}
                      >
                        <option value="">All locations</option>
                        {patients && patients.map((p: any) => {
                          const display = `${p.firstname || ''} ${p.lastname || ''} ${p.title || p.name || ''}`.trim()
                          return (
                            <option key={String(p.id)} value={display}>{display || `Location ${p.id}`}</option>
                          )
                        })}
                      </select>
                    </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300">Total sales (min)</label>
                      <input
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                        placeholder="Min"
                        value={filterDraft.totalMin ?? ''}
                        onChange={(e) => setFilterDraft((s) => ({ ...s, totalMin: e.target.value }))}
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300">Bonus threshold (min)</label>
                      <input
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                        placeholder="Min"
                        value={filterDraft.limitMin ?? ''}
                        onChange={(e) => setFilterDraft((s) => ({ ...s, limitMin: e.target.value }))}
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300">Type</label>
                      <select
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                        value={filterDraft.type ?? 'ALL'}
                        onChange={(e) => setFilterDraft((s) => ({ ...s, type: e.target.value }))}
                      >
                        <option value="ALL">All</option>
                        <option value="FLAT">FLAT</option>
                        <option value="PERCENTAGE">PERCENTAGE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300">Value (min)</label>
                      <input
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                        placeholder="Min"
                        value={filterDraft.valueMin ?? ''}
                        onChange={(e) => setFilterDraft((s) => ({ ...s, valueMin: e.target.value }))}
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Bonus amount (min)</label>
                    <input
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                      placeholder="Min"
                      value={filterDraft.bonusMin ?? ''}
                      onChange={(e) => setFilterDraft((s) => ({ ...s, bonusMin: e.target.value }))}
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Bonus Eligibility</label>
                    <select
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                      value={filterDraft.bonusEligibility ?? ''}
                      onChange={(e) => setFilterDraft((s) => ({ ...s, bonusEligibility: e.target.value }))}
                      aria-label="Filter by bonus eligibility"
                    >
                      <option value="">Any</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300">Date (up to yesterday)</label>
                    <input
                      type="date"
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white mt-1"
                      value={filterDraft.date ?? ''}
                      onChange={(e) => setFilterDraft((s) => ({ ...s, date: e.target.value }))}
                      max={getYesterdayYMD()}
                      aria-label="Filter by date (up to yesterday)"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => setFilterDraft({})}>Clear</Button>
                    <Button size="sm" onClick={() => { setColumnFilters({ ...filterDraft }); setIsFilterOpen(false) }}>Apply</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

          {/* Save button removed: Pay button will persist paid status immediately. */}

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
                  {currentPatients.length > 0 ? (
                    currentPatients.map((patient) => {
                    const total = bonusRowsByLocation[String(patient.id)]?.total_sales ?? ((totalsByLocation[String(patient.id)]?.total) ?? 0)
                  
                return (
                  <Card 
                    key={patient.id} 
                    className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725]"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base font-semibold dark:text-white">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {patient.title || patient.name || `Location ${patient.id}`}
                          </div>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 gap-3 text-sm mb-4">
                        {!isSetLimits && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500 dark:text-gray-400">Total Sales:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{ bonusRowsByLocation[String(patient.id)]?.total_sales !== undefined ? `$${Number(bonusRowsByLocation[String(patient.id)].total_sales).toFixed(2)}` : '-' }</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Flat/Percentage:</span>
                          { isSetLimits ? (
                            <select
                              className="ml-2 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                              value={bonusTypeByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.flat_percentage ?? 'FLAT')}
                              onChange={(e) => {
                                const key = String(patient.id)
                                setBonusTypeByPatient((s) => ({ ...s, [key]: e.target.value }))
                                setEditedByPatient((s) => ({ ...s, [key]: true }))
                              }}
                            >
                              <option value="FLAT">FLAT</option>
                              <option value="PERCENTAGE">PERCENTAGE</option>
                            </select>
                          ) : (
                            <span className="ml-2 text-gray-700 dark:text-white">{String(bonusTypeByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.flat_percentage ?? 'FLAT')).toUpperCase()}</span>
                          ) }
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Value:</span>
                          <span className="ml-2 dark:text-white">
                            <span className="mr-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '' : '$'}</span>
                            { isSetLimits ? (
                              <input
                                className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white inline"
                                value={bonusValueByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.value ?? bonusRowsByLocation[String(patient.id)]?.val ?? '')}
                                onChange={(e) => {
                                  const key = String(patient.id)
                                  let v = String(e.target.value).replace(/[^0-9.]/g, '')
                                  const parts = v.split('.')
                                  if (parts.length > 1) v = parts.shift() + '.' + parts.join('')
                                  setBonusValueByPatient((s) => ({ ...s, [key]: v }))
                                  setEditedByPatient((s) => ({ ...s, [key]: true }))
                                }}
                                inputMode="decimal"
                              />
                            ) : (
                              <span className="text-gray-700 dark:text-white">{bonusValueByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.value ?? bonusRowsByLocation[String(patient.id)]?.val ?? '-')}</span>
                            ) }
                            <span className="ml-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '%' : ''}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Bonus Limit:</span>
                          {(() => {
                            const key = String(patient.id)
                            const thr = thresholdsByLocation[key]
                            const b = bonusRowsByLocation[String(patient.id)]
                            if (thr && (thr.bonus_threshold !== undefined && thr.bonus_threshold !== null)) {
                              return <span className="ml-2 font-semibold">${Number(thr.bonus_threshold).toFixed(2)}</span>
                            }
                            if (b && (b.bonus_threshold !== undefined && b.bonus_threshold !== null)) {
                              return <span className="ml-2 font-semibold">${Number(b.bonus_threshold).toFixed(2)}</span>
                            }
                            if (b && (b.bonus_limit !== undefined && b.bonus_limit !== null)) {
                              return <span className="ml-2 font-semibold">${Number(b.bonus_limit).toFixed(2)}</span>
                            }
                            return (isSetLimits ? (
                              <input
                                className="ml-2 w-28 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                                value={bonusLimitByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.bonus_limit ?? '')}
                                onChange={(e) => {
                                  const key2 = String(patient.id)
                                  setBonusLimitByPatient((s) => ({ ...s, [key2]: e.target.value }))
                                  setEditedByPatient((s) => ({ ...s, [key2]: true }))
                                }}
                                inputMode="numeric"
                              />
                            ) : (
                              <span className="ml-2 text-gray-700 dark:text-white">{ (bonusLimitByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.bonus_limit ?? null)) ?? renderBigDash('text-gray-700') }</span>
                            ))
                          })()}
                        </div>
                        {!isSetLimits && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Bonus amount:</span>
                            <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">{
                              (() => {
                                const key = String(patient.id)
                                const b = bonusRowsByLocation[key]
                                const isEdited = !!editedByPatient[key]
                                if (isEdited) {
                                  const c = computeBonusAmount(patient)
                                  return c && c > 0 ? `$${c.toFixed(2)}` : '-'
                                }
                                if (b && b.bonus_amount !== undefined && b.bonus_amount !== null) return `$${Number(b.bonus_amount).toFixed(2)}`
                                const c2 = computeBonusAmount(patient)
                                return c2 && c2 > 0 ? `$${c2.toFixed(2)}` : '-'
                              })()
                            }</span>
                          </div>
                        )}
                        {!isSetLimits && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Date:</span>
                            <span className="ml-2 dark:text-white">{ bonusRowsByLocation[String(patient.id)]?.date ?? renderBigDash('text-gray-400') }</span>
                          </div>
                        )}
                        {(activeTab as any) === 'transactions' && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Paid date:</span>
                            <span className="ml-2 dark:text-white">{ bonusRowsByLocation[String(patient.id)]?.paid_date ?? renderBigDash('text-gray-400') }</span>
                          </div>
                        )}
                        {!isSetLimits && (
                          <div>
                            {(() => {
                              const key = String(patient.id)
                              const b = bonusRowsByLocation[key]
                              // Use explicit boolean `bonus_eligibility` from the bonus row for display
                              const has = !!(b && b.bonus_eligibility === true)
                              return (
                                <div className="mt-1">
                                  <span className="text-gray-500 dark:text-gray-400">Bonus generated:</span>
                                  {has ? (
                                    <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">Yes</span>
                                  ) : (
                                    <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">No</span>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                        {!isSetLimits && (
                          <div className="flex justify-end">
                            {(() => {
                              const key = String(patient.id)
                              const b = bonusRowsByLocation[key]
                              // Use explicit boolean `bonus_eligibility` from the bonus row for button enablement
                              const isGenerated = !!(b && b.bonus_eligibility === true)
                              const isPaid = !!(paidByPatient[key] ?? false)
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!isGenerated}
                                  className={!isGenerated
                                    ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500 border-gray-200'
                                    : (isPaid
                                      ? 'bg-blue-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                                      : 'bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700')
                                  }
                                  onClick={async (e) => {
                                    if (!isGenerated) return
                                    e.stopPropagation()
                                    const newPaid = !isPaid
                                    setPaidByPatient((s) => ({ ...s, [key]: newPaid }))
                                    try {
                                      const selectedDate = columnFilters.date ?? getYesterdayYMD()
                                      const resp = await fetch('/api/bonuses/update-paid', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ items: [{ location_id: Number(key), date: (b?.date ?? selectedDate), paid: newPaid }] })
                                      })
                                      if (!resp.ok) {
                                        setPaidByPatient((s) => ({ ...s, [key]: isPaid }))
                                        toast.error('Failed to update paid status')
                                      } else {
                                        toast.success(newPaid ? 'Marked as paid' : 'Marked as unpaid')
                                        try { fetchData() } catch (_) {}
                                      }
                                    } catch (err) {
                                      setPaidByPatient((s) => ({ ...s, [key]: isPaid }))
                                      toast.error('Failed to update paid status')
                                    }
                                  }}
                                  aria-pressed={isPaid}
                                >
                                  <span className="text-white">{isPaid ? 'Paid' : 'Pay'}</span>
                                </Button>
                              )
                            })()}
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-400 dark:text-gray-300">No locations found</div>
            )}
          </div>

          {/* pagination removed from calculation tab (kept for transactions) */}
          </>
        )
      )}

  {/* Set limits tab intentionally does not fetch or display any bonus/transaction data */}
  {activeTab === 'set-limits' && (
    <div className="p-6 max-w-7xl mx-auto dark:bg-[#0e1725] dark:text-white">
      <div className="bg-white dark:bg-[#0e1725] rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto max-h-[60vh] p-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Set limits</h2>
        {/* Replace single-location form with a table of all locations for bulk editing */}
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Flat / Percentage</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Value</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Bonus Threshold</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(patients || []).map((p: any) => {
                const key = String(p.id)
                const row = limitsByLocation[key] || { flat_percentage: 'FLAT' as const, value: '', bonus_threshold: '' }
                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-700">{p.title ?? `Location ${p.id}`}</td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded border border-gray-200 px-2 py-1 text-sm bg-transparent"
                        value={row.flat_percentage}
                        onChange={(e) => setLimitsByLocation(s => ({ ...s, [key]: { ...(s[key] || row), flat_percentage: (e.target.value as 'FLAT' | 'PERCENTAGE'), edited: true } }))}
                      >
                        <option value="FLAT">FLAT</option>
                        <option value="PERCENTAGE">PERCENTAGE</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        {/* Prefix or suffix depending on FLAT / PERCENTAGE */}
                        {((row.flat_percentage ?? 'FLAT') === 'FLAT') && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700">$</span>
                        )}
                        <input
                          className={"w-full rounded border border-gray-200 px-2 py-1 text-sm bg-transparent " + (((row.flat_percentage ?? 'FLAT') === 'FLAT') ? 'pl-8' : 'pr-8')}
                          value={row.value ?? ''}
                          onChange={(e) => {
                            let v = String(e.target.value).replace(/[^0-9.]/g, '')
                            const parts = v.split('.')
                            if (parts.length > 1) v = parts.shift() + '.' + parts.join('')
                            // If PERCENTAGE, clamp to 0-100
                            const type = (row.flat_percentage ?? 'FLAT')
                            if (v !== '' && type === 'PERCENTAGE') {
                              const n = Number(v)
                              if (!Number.isNaN(n)) {
                                if (n < 0) v = '0'
                                else if (n > 100) v = '100'
                                else {
                                  // keep as-is but remove leading zeros except zero before decimal
                                  v = String(n)
                                }
                              }
                            }
                            setLimitsByLocation(s => ({ ...s, [key]: { ...(s[key] || row), value: v, edited: true } }))
                          }}
                          inputMode="decimal"
                        />
                        {((row.flat_percentage ?? 'FLAT') === 'PERCENTAGE') && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700">%</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm bg-transparent"
                        value={row.bonus_threshold ?? ''}
                        onChange={(e) => setLimitsByLocation(s => ({ ...s, [key]: { ...(s[key] || row), bonus_threshold: e.target.value, edited: true } }))}
                        inputMode="numeric"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Button size="sm" className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white border-green-600" onClick={async (ev) => {
                        ev.stopPropagation()
                        const toSave = { location_id: Number(key), flat_percentage: row.flat_percentage, value: row.value === '' ? null : Number(row.value), bonus_threshold: row.bonus_threshold === '' ? null : Number(row.bonus_threshold) }
                        try {
                          setSetLimitSubmitting(true)
                          const resp = await fetch('/api/bonuses/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bonuses: [toSave], configOnly: true }) })
                          if (!resp.ok) { try { toast.error('Failed to save configuration') } catch(_) {} return }
                          try { toast.success('Configuration saved') } catch(_) {}
                          setLimitsByLocation(s => ({ ...s, [key]: { ...(s[key] || row), edited: false } }))
                        } catch (err) {
                          try { toast.error('Failed to save configuration') } catch(_) {}
                        } finally { setSetLimitSubmitting(false) }
                      }}>Save</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Bulk Save removed: per-row Save is used to persist each location's config */}
        </div>
      </div>
    </div>
  )}

      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-[#0e1725] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-[#0e1725] dark:border-gray-700">
                <TableHead className="font-semibold w-[200px] text-gray-500 dark:text-gray-400">Name</TableHead>
                <TableHead className="font-semibold w-[180px] text-gray-500 dark:text-gray-400">Total Sales</TableHead>
                <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Bonus Threshold</TableHead>
                <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Flat/Percentage</TableHead>
                <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Value</TableHead>
                <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Bonus amount</TableHead>
                <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Paid Date</TableHead>
                <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            {(() => {
              // Show all paid bonus rows (ignore the date picker). The helper now returns only rows where paid === true.
              const paidRows = (paidBonusRows || []).filter((r: any) => r && r.paid)
              // Sort by paid_date desc when available so newest paid appear first
              paidRows.sort((a: any, b: any) => {
                const pa = String(a?.paid_date ?? a?.paidDate ?? a?.paid_at ?? '')
                const pb = String(b?.paid_date ?? b?.paidDate ?? b?.paid_at ?? '')
                if (!pa && !pb) return 0
                if (!pa) return 1
                if (!pb) return -1
                return pa < pb ? 1 : (pa > pb ? -1 : 0)
              })

              return (
                <TableBody className="dark:bg-[#0e1725]">
                  {paidRows.length > 0 ? (
                    paidRows.map((b: any, idx: number) => {
                      const locId = String(b.location_id ?? b.locationid ?? b.location ?? '')
                      const patient = patients.find((p) => String(p.id) === String(locId))
                      const displayName = patient ? (patient.title || patient.name || `Location ${patient.id}`) : (b.location_name ?? `Location ${locId}`)
                      // prefer explicit config referenced by the bonus row when available
                      const cfg = (b?.bonus_config_history_id ? paidConfigById[String(b.bonus_config_history_id)] : null) || thresholdsByLocation[locId] || null
                      return (
                        <TableRow key={b.id ?? `${locId}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725]">
                          <TableCell className="font-medium dark:text-white">{displayName}</TableCell>
                          <TableCell className="dark:text-white">
                            <span className="font-semibold text-green-600 dark:text-green-400">{ b?.total_sales !== undefined ? `$${Number(b.total_sales).toFixed(2)}` : '-' }</span>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <span className="text-gray-700 dark:text-white">{ (cfg && typeof cfg.bonus_threshold !== 'undefined' && cfg.bonus_threshold !== null) ? Number(cfg.bonus_threshold).toFixed(2) : (b && Object.prototype.hasOwnProperty.call(b, 'bonus_limit') ? Number(b.bonus_limit).toFixed(2) : '-') }</span>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <span className="text-gray-700 dark:text-white">{ (cfg && cfg.flat_percentage) ? cfg.flat_percentage : (b?.flat_percentage ?? '-') }</span>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <div className="flex items-center">
                              <span className="mr-2 text-gray-700 dark:text-gray-300">{ (String(((cfg && cfg.flat_percentage) ?? b?.flat_percentage ?? '').toUpperCase()) === 'PERCENTAGE') ? '' : '$' }</span>
                              <span className="text-gray-700 dark:text-white">{ (() => { const val = (cfg && (cfg.value !== undefined && cfg.value !== null)) ? cfg.value : (b?.value ?? b?.val ?? null); return (val !== undefined && val !== null) ? (Number(val).toFixed ? Number(val).toFixed(2) : String(val)) : '-' })() }</span>
                              <span className="ml-2 text-gray-700 dark:text-gray-300">{ (String(((cfg && cfg.flat_percentage) ?? b?.flat_percentage ?? '').toUpperCase()) === 'PERCENTAGE') ? '%' : '' }</span>
                            </div>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{ b?.bonus_amount !== undefined ? `$${Number(b.bonus_amount).toFixed(2)}` : (patient ? (computeBonusAmount(patient) > 0 ? `$${computeBonusAmount(patient).toFixed(2)}` : '-') : '-') }</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-500 dark:text-gray-300">{ b?.paid_date ?? '-' }</span>
                          </TableCell>
                          <TableCell>
                            { (b?.paid) ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">Paid</span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-100">Unpaid</span>
                            ) }
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-400 dark:text-gray-300">No paid bonuses</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              )
            })()}
          </Table>
        </div>
      )}

      {/* Transaction Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto dark:bg-[#0e1725] dark:border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold dark:text-white">
              {selectedPatient ? `${selectedPatient.firstname} ${selectedPatient.lastname} - Transactions` : "Transaction Details"}
            </SheetTitle>
          </SheetHeader>
          
          {selectedPatient && (
            <div className="mt-6">
              {/* Transactions List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-300">Loading transactions...</div>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx: any, index: number) => {
                    const status = getTransactionStatus(tx)
                    const paymentMethod = getPaymentMethod(tx)
                    return (
                      <div key={tx.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Transaction ID:</span>
                            <span className="font-semibold dark:text-white">{generateTransactionId(index)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{t("Transaction_k3")}:</span>
                            <span className="dark:text-white">{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "-"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{t("Transaction_k4")}:</span>
                            <span className="font-semibold dark:text-white">${tx.amount?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">{t("Transaction_k6")}:</span>
                            <span className="dark:text-white">${tx.balance?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Treatment Type:</span>
                            <span className="dark:text-white">{tx.type}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              {status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Payment Method:</span>
                            <span className="dark:text-white">{paymentMethod}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-medium text-gray-600 dark:text-gray-400">Actions:</span>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-300">
                    {t("Transaction_k8")}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default BonusPage