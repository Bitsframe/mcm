"use client"

import { useEffect, useState, useRef } from "react"
import { fetchLocations, fetchBonusRowsForDate, fetchActiveThresholds, subscribeToBonusChanges, startPolling, stopPolling } from './fetch'
// only use DB fetch for bonus rows on page load
// data fetching helpers moved to ./fetch
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// Input removed - search UI removed from this page
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { translationConstant } from "@/utils/translationConstants"
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Phone, Mail, User, DollarSign } from "lucide-react"
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const BonusPage = () => {
  // We'll fetch locations and today's totals and show them in the table
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientCreditBalances, setPatientCreditBalances] = useState<{[key: number]: number}>({})
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [totalsByLocation, setTotalsByLocation] = useState<Record<string, { locationId: string | number, total: number, count: number }>>({})
  const [bonusRowsByLocation, setBonusRowsByLocation] = useState<Record<string, any>>({})
  const [thresholdsByLocation, setThresholdsByLocation] = useState<Record<string, any>>({})
  // Keep an original copy of bonuses loaded from DB so we can send only changed rows on save
  const [originalBonuses, setOriginalBonuses] = useState<any[]>([])
  // searchTerm and searchBy removed (global search input removed)
  // Default the table to yesterday's date (YYYY-MM-DD) so current date rows are not shown
  const getYesterdayYMD = () => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  }
  const getTodayYMD = () => {
    return new Date().toISOString().slice(0, 10)
  }
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({ date: getTodayYMD() })
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(6)
  const [bonusTypeByPatient, setBonusTypeByPatient] = useState<Record<string, string>>({})
  const [bonusValueByPatient, setBonusValueByPatient] = useState<Record<string, string>>({})
  const [bonusLimitByPatient, setBonusLimitByPatient] = useState<Record<string, string>>({})
  const [paidByPatient, setPaidByPatient] = useState<Record<string, boolean>>({})
  const [editedByPatient, setEditedByPatient] = useState<Record<string, boolean>>({})
  const [saveMessage, setSaveMessage] = useState<string>("")
  // Avoid JSX/TSX generic parsing edge-cases by creating a named type and
  // reusing it with useState<T>(). This prevents the parser from treating
  // the middle union member as JSX and dropping it from the inferred type.
  type ActiveTab = 'calculation' | 'transactions' | 'set-limits'
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculation')
  

  // Extracted data loader so it can be called on mount, after save, and when switching tabs
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
  // fetch all locations (table name: "Locations")
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

      // Fetch active thresholds for the selected date and map by location_id
      // Declare thrMap in outer scope so it can be referenced later when
      // initializing editable fields (TypeScript needs the name in this scope).
      let thrMap: Record<string, any> | undefined
      try {
        const thrList = await fetchActiveThresholds(selectedDate).catch(() => [])
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
        const selectedDate = columnFilters.date ?? new Date().toISOString().slice(0, 10)
        const orig: any[] = patientsFromLocations.map((p) => {
          const key = String(p.id)
          const r = map[key]
      return {
        location_id: Number(p.id),
        // prefer new `bonus_threshold` column, fall back to legacy `bonus_limit`
        bonus_limit: (r?.bonus_threshold !== undefined && r?.bonus_threshold !== null) ? Number(r.bonus_threshold) : (r?.bonus_limit !== undefined && r?.bonus_limit !== null ? Number(r.bonus_limit) : 0),
            flat_percentage: (r?.flat_percentage ?? r?.flat_percentage === '' ? r?.flat_percentage : (r?.flat_percentage ?? r?.flat_percentage ?? 'FLAT')) || 'FLAT',
            value: (r?.value ?? r?.val ?? 0) !== undefined && (r?.value ?? r?.val ?? 0) !== null ? Number(r?.value ?? r?.val ?? 0) : 0,
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
    // Avoid double-fetch on mount by only fetching when date changes after initial load.
    // Calling fetchData() here is acceptable; it will fetch bonus rows for the selected date.
    fetchData()
    // reset pagination to first page when date changes
    setCurrentPage(1)
  }, [columnFilters.date])

  // Real-time updates: subscribe to Supabase realtime changes on `bonus` for the
  // currently selected date so the UI updates the "Not generated" pill and
  // values as soon as total_sales/threshold change in the DB. Also provide a
  // polling fallback (every 30s) for environments where realtime is unavailable.
  useEffect(() => {
    if (typeof window === 'undefined') return

  const selectedDate = columnFilters.date ?? getTodayYMD()
    // Use helper subscription function from fetch.ts
    const sub = subscribeToBonusChanges(selectedDate, () => fetchData())
    let pollHandle: any = null
    if (!sub || !sub.success) {
      // Realtime not available — start polling fallback
      pollHandle = startPolling(() => {
        console.debug('[bonus/page] polling refresh')
        fetchData()
      }, 30_000)
    }

    return () => {
      try { sub && sub.unsubscribe && sub.unsubscribe() } catch (e) { console.warn('[bonus/page] unsubscribe error', e) }
      try { stopPolling(pollHandle) } catch (e) { console.warn('[bonus/page] stopPolling error', e) }
    }
  }, [columnFilters.date])

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
      const limitVal = Number(bonusLimitByPatient[patient.id] ?? 0)
      if (isNaN(limitMin) ? false : limitVal < limitMin) return false
    }

    // Flat/Percentage filter
    const typeFilter = (columnFilters.type ?? '').toUpperCase()
    if (typeFilter) {
      const type = (bonusTypeByPatient[patient.id] ?? 'FLAT').toUpperCase()
      if (typeFilter !== 'ALL' && type !== typeFilter) return false
    }

    // Value min filter
    const valueMinStr = columnFilters.valueMin ?? ''
    if (valueMinStr !== '') {
      const valMin = Number(valueMinStr)
      const val = Number(bonusValueByPatient[patient.id] ?? 0)
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

  // For the transactions tab we only want to display locations with paid status
  const transactionPatients = currentPatients.filter((p) => {
    const locId = String(p.id)
    // prefer authoritative paid flag from DB, fall back to UI toggle
    const paidFlag = (bonusRowsByLocation[locId] && typeof bonusRowsByLocation[locId].paid !== 'undefined')
      ? !!bonusRowsByLocation[locId].paid
      : !!(paidByPatient[locId] ?? false)
    return !!paidFlag
  })

  useEffect(() => {
    setCurrentPage(1)
  }, [columnFilters])

  // Debug: log the data used for display (filtered + current page) so we can inspect why only a few rows render
  useEffect(() => {
    try {
      const selectedDate = columnFilters.date ?? new Date().toISOString().slice(0, 10)
      console.debug('[bonus/page] display data', {
        selectedDate,
        totalPatients: patients.length,
        filteredPatientsCount: filteredPatients.length,
        currentPatientsCount: currentPatients.length,
        // sample of currentPatients with resolved display fields
        sampleCurrentPatients: currentPatients.slice(0, 10).map((p) => {
          const key = String(p.id)
          const db = bonusRowsByLocation[key] || null
          const display = {
            id: p.id,
            title: p.title,
            total_sales_db: db ? (db.total_sales ?? null) : null,
            // Prefer `bonus_threshold` returned from DB
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

  // When the calculation tab is selected, run the debugging query per-location (limited sample)
  useEffect(() => {
    // cast to string to avoid TypeScript control-flow narrowing of the
    // `activeTab` union within this component function scope.
    if ((activeTab as string) !== 'calculation') return
    try {
  const selectedDate = columnFilters.date ?? getTodayYMD()
      // limit to first 10 locations to avoid flooding the server
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

  // Compute display-only bonus amount for a patient/location
  const computeBonusAmount = (patient: any) => {
    const total = bonusRowsByLocation[String(patient.id)]?.total_sales ?? (totalsByLocation[String(patient.id)]?.total) ?? 0
    const type = (bonusTypeByPatient[patient.id] ?? 'FLAT')
    const valStr = (bonusValueByPatient[patient.id] ?? '')
    // prefer authoritative threshold from threshold_history when present
    const thr = thresholdsByLocation[String(patient.id)]
    const limitStr = thr && (thr.bonus_threshold !== undefined && thr.bonus_threshold !== null)
      ? String(thr.bonus_threshold)
      : (bonusLimitByPatient[patient.id] ?? '')

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

      // If a bonus limit is provided, only allow bonus when total > limit.
      // For FLAT bonuses we cap the payout to the available amount above the threshold
      // (i.e. at most total - limit). For PERCENTAGE bonuses we apply the percent
      // to the full total once the threshold is met (so percent of total).
      if (limit !== null && !isNaN(limit)) {
        if (total <= limit) {
          amount = 0
        } else if (type === 'FLAT') {
          const allowed = Math.max(0, total - limit)
          amount = Math.min(amount, allowed)
        }
        // PERCENTAGE: amount stays as percent of total
      }

    return amount
  }

  // Render a large dash for missing DB values (used in Calculation view)
  const renderBigDash = (className = 'text-gray-400') => (
    <span className={`${className} text-2xl font-semibold`} aria-hidden>
      —
    </span>
  )

  // Today's display string for the Date column
  const todayStr = new Date().toLocaleDateString()

  // Save current bonus settings (temporary client-side persistence)
  const handleSave = () => {
    // Build array of bonus rows keyed by patient (location) id
    const locIds = patients.map(p => String(p.id))
    const selectedDate = columnFilters.date ?? new Date().toISOString().slice(0, 10)
    // Build payload differently when in Set limits tab: only send rows whose threshold/flat/value changed
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
      // In calculation (non-SetLimits) mode we only update paid status when Save is clicked.
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

    // POST to server API to persist changed bonuses. If fails, still store locally as fallback.
    ;(async () => {
      try {
        // If we're in Set limits mode, use the existing save endpoint with configOnly flag.
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
          // Merge changed into original and refresh
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
            try { fetchData() } catch (_) {}
          } catch (_) {}
          return
        }

        // Otherwise (calculation tab) only update paid flags via the dedicated endpoint
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

        // Merge paid changes into originalBonuses and refresh data
        try {
          const updatedOrig = originalBonuses.map(o => {
            const match = changed.find(c => Number(c.location_id) === Number(o.location_id) && String(c.date || '') === String(o.date || ''))
            return match ? { ...o, paid: match.paid, paid_date: match.paid ? (o.paid_date ?? new Date().toISOString().slice(0,10)) : null } : o
          })
          // include any new rows
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

    return (
    <div className="p-6 max-w-7xl mx-auto dark:bg-[#0e1725] dark:text-white">
      {/* Toast container for notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bonus</h1>
        </div>
      </div>
      {/* Pagination removed; table will show scrollbars instead */}

      {/* Tabs */}
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

  {(activeTab === 'calculation' || activeTab === 'set-limits') && (
        loadingPatients ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500 dark:text-gray-300">Loading bonuses...</div>
          </div>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-[#0e1725] rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto max-h-[60vh]">
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
                    {!isSetLimits && <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Bonus generated</TableHead>}
                    {!isSetLimits && <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">Status</TableHead>}
                  </TableRow>
                  {/* Filter inputs row - hidden in Set limits tab */}
                  {!isSetLimits && (
                    <TableRow className="bg-white dark:bg-[#0e1725]">
                      <TableCell className="py-2 px-3">
                        <input
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                          placeholder="Filter name"
                          value={columnFilters.name ?? ''}
                          onChange={(e) => setColumnFilters((s) => ({ ...s, name: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <input
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                          placeholder="Min"
                          value={columnFilters.totalMin ?? ''}
                          onChange={(e) => setColumnFilters((s) => ({ ...s, totalMin: e.target.value }))}
                          inputMode="numeric"
                        />
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <input
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                          placeholder="Min"
                          value={columnFilters.limitMin ?? ''}
                          onChange={(e) => setColumnFilters((s) => ({ ...s, limitMin: e.target.value }))}
                          inputMode="numeric"
                        />
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <select
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                          value={columnFilters.type ?? 'ALL'}
                          onChange={(e) => setColumnFilters((s) => ({ ...s, type: e.target.value }))}
                        >
                          <option value="ALL">All</option>
                          <option value="FLAT">FLAT</option>
                          <option value="PERCENTAGE">PERCENTAGE</option>
                        </select>
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <input
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                          placeholder="Min"
                          value={columnFilters.valueMin ?? ''}
                          onChange={(e) => setColumnFilters((s) => ({ ...s, valueMin: e.target.value }))}
                          inputMode="numeric"
                        />
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <input
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                          placeholder="Min"
                          value={columnFilters.bonusMin ?? ''}
                          onChange={(e) => setColumnFilters((s) => ({ ...s, bonusMin: e.target.value }))}
                          inputMode="numeric"
                        />
                      </TableCell>
                      <TableCell className="py-2 px-3">
                        <input
                          type="date"
                          className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                          value={columnFilters.date ?? ''}
                          onChange={(e) => setColumnFilters((s) => ({ ...s, date: e.target.value }))}
                          // Prevent selecting today or future dates by capping the max to yesterday
                          // allow selecting up to today (previously capped to yesterday)
                          max={getTodayYMD()}
                          aria-label="Filter by date (up to yesterday)"
                        />
                      </TableCell>
                      <TableCell className="py-2 px-3"></TableCell>
                    </TableRow>
                  )}
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
                                  inputMode="numeric"
                                  value={bonusValueByPatient[String(patient.id)] ?? ''}
                                  onChange={(e) => {
                                    const key = String(patient.id)
                                    setBonusValueByPatient((s) => ({ ...s, [key]: e.target.value }))
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
                                const dbAmt = (b && b.bonus_amount !== undefined && b.bonus_amount !== null) ? Number(b.bonus_amount) : null
                                const computed = computeBonusAmount(patient)
                                const has = (dbAmt !== null ? dbAmt > 0 : computed > 0)
                                if (has) {
                                  return (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                                      Generated
                                    </span>
                                  )
                                }
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                                    Not generated
                                  </span>
                                )
                              })()}
                            </TableCell>
                          )}
                          {!isSetLimits && (
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className={(paidByPatient[patient.id] ?? false)
                                  ? "bg-blue-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                                  : "bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700"}
                                onClick={(e) => {
                                      e.stopPropagation()
                                      setPaidByPatient((s) => ({ ...s, [String(patient.id)]: !(s?.[String(patient.id)] ?? false) }))
                                    }}
                                  aria-pressed={paidByPatient[patient.id] ?? false}
                                >
                  <Eye className={`w-4 h-4 mr-1 ${(paidByPatient[patient.id] ?? false) ? 'text-gray-700' : 'text-white'}`} />
                  <span className="text-white">{(paidByPatient[patient.id] ?? false) ? 'Paid' : 'Pay'}</span>
                              </Button>
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

          {/* Save button (saves current bonus settings locally) */}
          {isCalcOrSet && (
            <div className="mb-4 flex justify-start mt-6">
              <Button
                size="sm"
                className="w-36 px-4 py-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSave()
                }}
              >
                Save
              </Button>
              {saveMessage && <span className="ml-4 text-sm text-green-600 dark:text-green-400">{saveMessage}</span>}
            </div>
          )}

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
                                  setBonusValueByPatient((s) => ({ ...s, [key]: e.target.value }))
                                  setEditedByPatient((s) => ({ ...s, [key]: true }))
                                }}
                                inputMode="numeric"
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
                              const dbAmt = (b && b.bonus_amount !== undefined && b.bonus_amount !== null) ? Number(b.bonus_amount) : null
                              const computed = computeBonusAmount(patient)
                              const has = (dbAmt !== null ? dbAmt > 0 : computed > 0)
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
                           <Button
                             variant="outline"
                             size="sm"
                             className={(paidByPatient[patient.id] ?? false)
                               ? "bg-blue-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                               : "bg-blue-600 text-white dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 border-blue-600 dark:border-blue-700"}
                             onClick={(e) => {
                               e.stopPropagation()
                               setPaidByPatient((s) => ({ ...s, [String(patient.id)]: !(s?.[String(patient.id)] ?? false) }))
                             }}
                             aria-pressed={paidByPatient[patient.id] ?? false}
                           >
                             <Eye className={`w-4 h-4 mr-1 ${(paidByPatient[patient.id] ?? false) ? 'text-gray-700' : 'text-white'}`} />
                             <span className="text-white">{(paidByPatient[patient.id] ?? false) ? 'Paid' : 'Pay'}</span>
                           </Button>
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
                <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Date</TableHead>
                <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="dark:bg-[#0e1725]">
              {transactionPatients.length > 0 ? (
                transactionPatients.map((patient) => {
                  const balance = patientCreditBalances[patient.id] || 0
                  const locId = String(patient.id)
                  return (
                    <TableRow key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-[#0e1725]">
                      <TableCell className="font-medium dark:text-white">{patient.title || patient.name || `Location ${patient.id}`}</TableCell>
                      {/* Read values from bonus DB by location_id; show '-' when missing */}
                      <TableCell className="dark:text-white">
                        <span className="font-semibold text-green-600 dark:text-green-400">{ bonusRowsByLocation[locId]?.total_sales !== undefined ? `$${Number(bonusRowsByLocation[locId].total_sales).toFixed(2)}` : '-' }</span>
                      </TableCell>
                      <TableCell className="dark:text-white">
                        <span className="text-gray-700 dark:text-white">{ (thresholdsByLocation[locId] && typeof thresholdsByLocation[locId].bonus_threshold !== 'undefined') ? Number(thresholdsByLocation[locId].bonus_threshold).toFixed(2) : (bonusRowsByLocation[locId] && Object.prototype.hasOwnProperty.call(bonusRowsByLocation[locId], 'bonus_limit') ? Number(bonusRowsByLocation[locId].bonus_limit).toFixed(2) : '-') }</span>
                      </TableCell>
                      <TableCell className="dark:text-white">
                        <span className="text-gray-700 dark:text-white">{ (thresholdsByLocation[locId] && thresholdsByLocation[locId].flat_percentage) ? thresholdsByLocation[locId].flat_percentage : (bonusRowsByLocation[locId]?.flat_percentage ?? '-') }</span>
                      </TableCell>
                      <TableCell className="dark:text-white">
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-700 dark:text-gray-300">{ (String((thresholdsByLocation[locId]?.flat_percentage ?? bonusRowsByLocation[locId]?.flat_percentage ?? '').toUpperCase()) === 'PERCENTAGE') ? '' : '$' }</span>
                          <span className="text-gray-700 dark:text-white">{ (() => { const cfg = thresholdsByLocation[locId]; const b = bonusRowsByLocation[locId]; const val = cfg?.value ?? b?.value ?? b?.val ?? null; return (val !== undefined && val !== null) ? (Number(val).toFixed ? Number(val).toFixed(2) : String(val)) : '-' })() }</span>
                          <span className="ml-2 text-gray-700 dark:text-gray-300">{ (String((thresholdsByLocation[locId]?.flat_percentage ?? bonusRowsByLocation[locId]?.flat_percentage ?? '').toUpperCase()) === 'PERCENTAGE') ? '%' : '' }</span>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-white">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{ bonusRowsByLocation[locId]?.bonus_amount !== undefined ? `$${Number(bonusRowsByLocation[locId].bonus_amount).toFixed(2)}` : (computeBonusAmount(patient) > 0 ? `$${computeBonusAmount(patient).toFixed(2)}` : '-') }</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 dark:text-gray-300">{ bonusRowsByLocation[locId]?.date ?? '-' }</span>
                      </TableCell>
                      <TableCell>
                        {
                          (() => {
                            const paidFlag = bonusRowsByLocation[locId]?.paid ?? (paidByPatient[locId] ?? false)
                            if (paidFlag) {
                              return (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                                  Paid
                                </span>
                              )
                            }
                            return (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                                Unpaid
                              </span>
                            )
                          })()
                        }
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400 dark:text-gray-300">No business found</TableCell>
                </TableRow>
              )}
            </TableBody>
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