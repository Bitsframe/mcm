"use client"

import { useEffect, useState } from "react"
// only use DB fetch for bonus rows on page load
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'
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
  // Keep an original copy of bonuses loaded from DB so we can send only changed rows on save
  const [originalBonuses, setOriginalBonuses] = useState<any[]>([])
  // searchTerm and searchBy removed (global search input removed)
  // Default the table to yesterday's date (YYYY-MM-DD) so current date rows are not shown
  const getYesterdayYMD = () => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  }
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({ date: getYesterdayYMD() })
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [patientsPerPage] = useState(6)
  const [bonusTypeByPatient, setBonusTypeByPatient] = useState<Record<string, string>>({})
  const [bonusValueByPatient, setBonusValueByPatient] = useState<Record<string, string>>({})
  const [bonusLimitByPatient, setBonusLimitByPatient] = useState<Record<string, string>>({})
  const [paidByPatient, setPaidByPatient] = useState<Record<string, boolean>>({})
  const [editedByPatient, setEditedByPatient] = useState<Record<string, boolean>>({})
  const [saveMessage, setSaveMessage] = useState<string>("")
  const [activeTab, setActiveTab] = useState<'calculation' | 'transactions'>('calculation')
  

  // Extracted data loader so it can be called on mount, after save, and when switching tabs
  const fetchData = async () => {
    setLoadingPatients(true)
    try {
      // fetch all locations (table name: "Locations")
      const locRows: any[] = await fetch_content_service({ table: 'Locations' }).catch(() => [])
      const patientsFromLocations: any[] = locRows.map(r => {
        const rawId = r.id ?? r.location_id ?? r.locationid ?? r.location
        const idNum = Number(rawId)
        const id = Number.isNaN(idNum) ? String(rawId) : idNum
        return {
          id,
          title: r.name ?? r.title ?? r.location_name ?? r.location_title ?? `Location ${rawId}`,
        }
      })

      // fetch bonus rows and map by location id
      const bonusRows: any[] = await fetch_content_service({ table: 'bonus' }).catch(() => [])
      const map: Record<string, any> = {}
      bonusRows.forEach(r => {
        const locKey = String(r.location_id ?? r.locationid ?? r.location)
        if (locKey) map[locKey] = r
      })

      setPatients(patientsFromLocations)
      setBonusRowsByLocation(map)

      // build originalBonuses array for change detection
      try {
        const selectedDate = columnFilters.date ?? new Date().toISOString().slice(0, 10)
        const orig: any[] = patientsFromLocations.map((p) => {
          const key = String(p.id)
          const r = map[key]
          return {
            location_id: Number(p.id),
            bonus_limit: r?.bonus_limit !== undefined && r?.bonus_limit !== null ? Number(r.bonus_limit) : 0,
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
        limitMap[k] = r?.bonus_limit !== undefined && r?.bonus_limit !== null ? String(r.bonus_limit) : ''
        const val = r?.value ?? r?.val ?? r?.v ?? r?.value_amount
        valueMap[k] = val !== undefined && val !== null ? String(val) : ''
        typeMap[k] = (r?.flat_percentage ?? '').toString() || 'FLAT'
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
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // When the user switches to 'transactions', refetch data so updates are shown quickly
  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchData()
    }
  }, [activeTab])

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
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient)
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  useEffect(() => {
    setCurrentPage(1)
  }, [columnFilters])

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const { t } = useTranslation(translationConstant.TRANSACTION)

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
    const limitStr = (bonusLimitByPatient[patient.id] ?? '')

    const value = valStr === '' ? 0 : Number(valStr)
    const limit = limitStr === '' ? null : Number(limitStr)
    let amount = 0

    if (type === 'FLAT') {
      amount = isNaN(value) ? 0 : value
    } else {
      // PERCENTAGE
      const pct = isNaN(value) ? 0 : value
      amount = total * (pct / 100)
    }

    // If a bonus limit is provided, only allow bonus when total > limit
    // and cap the bonus to at most (total - limit). If total <= limit,
    // allowed bonus is 0.
    if (limit !== null && !isNaN(limit)) {
      const allowed = total > limit ? Math.max(0, total - limit) : 0
      amount = Math.min(amount, allowed)
    }

    return amount
  }

  // Today's display string for the Date column
  const todayStr = new Date().toLocaleDateString()

  // Save current bonus settings (temporary client-side persistence)
  const handleSave = () => {
    // Build array of bonus rows keyed by patient (location) id
    const locIds = patients.map(p => String(p.id))
    const selectedDate = columnFilters.date ?? new Date().toISOString().slice(0, 10)
    const bonusesAll: any[] = locIds.map((locId) => {
      const locationId = Number(locId)
      const bonus_limit = Number(bonusLimitByPatient[locId] ?? bonusRowsByLocation[locId]?.bonus_limit ?? 0) || 0
      const flat_percentage = (bonusTypeByPatient[locId] ?? bonusRowsByLocation[locId]?.flat_percentage ?? 'FLAT')
      const value = Number(bonusValueByPatient[locId] ?? bonusRowsByLocation[locId]?.value ?? bonusRowsByLocation[locId]?.val ?? 0) || 0
      // Prefer the UI-computed bonus amount when the row has been edited; otherwise keep DB value if present, else computed fallback
      const computedAmount = computeBonusAmount({ id: locId })
      const bonus_amount = !!editedByPatient[locId]
        ? computedAmount
        : (bonusRowsByLocation[locId]?.bonus_amount ?? computedAmount)
      const date = bonusRowsByLocation[locId]?.date ?? selectedDate
      const paid = !!(paidByPatient[locId] ?? false)

      return {
        bonus_limit,
        flat_percentage,
        value,
        bonus_amount: Number(Number(bonus_amount || 0).toFixed(2)),
        date,
        paid,
        location_id: locationId,
      }
    })

    // Only send rows that changed (or were edited) to reduce DB writes
    const changed = bonusesAll.filter((b) => {
      const locKey = String(b.location_id)
      const orig = originalBonuses.find(o => Number(o.location_id) === Number(b.location_id) && String(o.date || '') === String(b.date || ''))

      // If user explicitly edited this row, always include it
      if (editedByPatient[locKey]) return true

      if (!orig) {
        // no original row existed — include if any non-default value present
        return (b.bonus_limit !== 0) || (b.value !== 0) || (b.flat_percentage && b.flat_percentage !== 'FLAT') || b.paid === true
      }

      // compare numeric and string values
      const num = (v: any) => (v === undefined || v === null) ? 0 : Number(v)
      if (num(orig.bonus_limit) !== num(b.bonus_limit)) return true
      if ((String(orig.flat_percentage ?? '')).toUpperCase() !== (String(b.flat_percentage ?? '')).toUpperCase()) return true
      if (num(orig.value) !== num(b.value)) return true
      if (num(orig.bonus_amount) !== num(b.bonus_amount)) return true
      if (!!orig.paid !== !!b.paid) return true
      return false
    })

    if (changed.length === 0) {
      try { toast.info('No changes detected') } catch(_) {}
      return
    }

    // POST to server API to persist changed bonuses. If fails, still store locally as fallback.
    ;(async () => {
      try {
        const resp = await fetch('/api/bonuses/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bonuses: changed }),
        })
        let json = null
        try { json = await resp.json() } catch (_) {}

        if (!resp.ok) {
          // fallback: save locally
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
        // update originalBonuses so subsequent saves only send new changes
        try {
          // merge changed values into originalBonuses
          const updatedOrig = originalBonuses.map(o => {
            const match = changed.find(c => Number(c.location_id) === Number(o.location_id) && String(c.date || '') === String(o.date || ''))
            return match ? { ...o, ...match } : o
          })
          // include any new rows that were not in originalBonuses
          changed.forEach(c => {
            const exists = updatedOrig.find(u => Number(u.location_id) === Number(c.location_id) && String(u.date || '') === String(c.date || ''))
            if (!exists) updatedOrig.push(c)
          })
          setOriginalBonuses(updatedOrig)
          // refresh bonus rows from server to reflect saved changes immediately
          try { fetchData() } catch (_) {}
        } catch (_) {}
      } catch (err) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('bonusSettings', JSON.stringify({ bonuses: changed }))
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
      {/* Pagination for transactions view */}
      {filteredPatients.length > 0 && (
        <div className="mt-3 flex justify-end items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

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
            className={`${activeTab === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-600 dark:text-gray-300'} py-2 px-3`}
          >
            Bonus transactions
          </button>
        </div>
      </div>

      {/* Global search removed */}

      {activeTab === 'calculation' && (
        loadingPatients ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-500 dark:text-gray-300">Loading patients...</div>
          </div>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-[#0e1725] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                  <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#0e1725] dark:border-gray-700">
                    <TableHead className="font-semibold w-[200px] text-gray-500 dark:text-gray-400">Name</TableHead>
                    <TableHead className="font-semibold w-[180px] text-gray-500 dark:text-gray-400">Total Sales</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Bonus Limit</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Flat/Percentage</TableHead>
                    <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Value</TableHead>
                    <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Bonus amount</TableHead>
                    <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Date</TableHead>
                    <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">Actions</TableHead>
                  </TableRow>
                  {/* Filter inputs row */}
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
                        max={getYesterdayYMD()}
                        aria-label="Filter by date (up to yesterday)"
                      />
                    </TableCell>
                    <TableCell className="py-2 px-3"></TableCell>
                  </TableRow>
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
                          <TableCell className="dark:text-white">
                            {/* Total sales: read from bonus DB when available, otherwise show - */}
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              { (() => {
                                  const b = bonusRowsByLocation[String(patient.id)]
                                  if (b && (b.total_sales !== undefined && b.total_sales !== null)) {
                                    return `$${Number(b.total_sales).toFixed(2)}`
                                  }
                                  return '-'
                                })()
                              }
                            </span>
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Bonus limit: editable input (initialized from DB when present) */}
                            <input
                              className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                              placeholder="Min"
                              inputMode="numeric"
                              value={bonusLimitByPatient[String(patient.id)] ?? ''}
                              onChange={(e) => {
                                const key = String(patient.id)
                                setBonusLimitByPatient((s) => ({ ...s, [key]: e.target.value }))
                                setEditedByPatient((s) => ({ ...s, [key]: true }))
                              }}
                            />
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Flat/Percentage: editable select (initialized from DB) */}
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
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Value: editable input (initialized from DB) */}
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
                          </TableCell>
                          <TableCell className="dark:text-white">
                            {/* Bonus amount: if user edited inputs show computed, otherwise prefer DB value then computed fallback */}
                            {(() => {
                              const key = String(patient.id)
                              const b = bonusRowsByLocation[key]
                              const isEdited = !!editedByPatient[key]
                              if (isEdited) {
                                const computed = computeBonusAmount(patient)
                                if (computed && computed > 0) return <span className="font-semibold text-blue-600 dark:text-blue-400">${computed.toFixed(2)}</span>
                                return <span className="text-gray-400">-</span>
                              }
                              if (b && (b.bonus_amount !== undefined && b.bonus_amount !== null)) {
                                return <span className="font-semibold text-blue-600 dark:text-blue-400">${Number(b.bonus_amount).toFixed(2)}</span>
                              }
                              const computed = computeBonusAmount(patient)
                              if (computed && computed > 0) return <span className="font-semibold text-blue-600 dark:text-blue-400">${computed.toFixed(2)}</span>
                              return <span className="text-gray-400">-</span>
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const b = bonusRowsByLocation[String(patient.id)]
                              if (b && (b.date !== undefined && b.date !== null)) {
                                return <span className="text-gray-500 dark:text-gray-300">{String(b.date)}</span>
                              }
                              return <span className="text-gray-400">-</span>
                            })()}
                          </TableCell>
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
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-400 dark:text-gray-300">
                        No bonuses found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Save button (saves current bonus settings locally) */}
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
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">Total Sales:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{ bonusRowsByLocation[String(patient.id)]?.total_sales !== undefined ? `$${Number(bonusRowsByLocation[String(patient.id)].total_sales).toFixed(2)}` : '-' }</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Flat/Percentage:</span>
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
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Value:</span>
                          <span className="ml-2 dark:text-white">
                            <span className="mr-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '' : '$'}</span>
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
                            <span className="ml-2 text-gray-700 dark:text-gray-300">{(String(bonusTypeByPatient[String(patient.id)] ?? 'FLAT').toUpperCase() === 'PERCENTAGE') ? '%' : ''}</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Bonus Limit:</span>
                          <input
                            className="ml-2 w-28 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-transparent dark:text-white"
                            value={bonusLimitByPatient[String(patient.id)] ?? (bonusRowsByLocation[String(patient.id)]?.bonus_limit ?? '')}
                            onChange={(e) => {
                              const key = String(patient.id)
                              setBonusLimitByPatient((s) => ({ ...s, [key]: e.target.value }))
                              setEditedByPatient((s) => ({ ...s, [key]: true }))
                            }}
                            inputMode="numeric"
                          />
                        </div>
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
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <span className="ml-2 dark:text-white">{ bonusRowsByLocation[String(patient.id)]?.date ?? '-' }</span>
                        </div>
                      </div>
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
                <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Bonus Limit</TableHead>
                <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Flat/Percentage</TableHead>
                <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Value</TableHead>
                <TableHead className="font-semibold w-[150px] text-gray-500 dark:text-gray-400">Bonus amount</TableHead>
                <TableHead className="font-semibold w-[140px] text-gray-500 dark:text-gray-400">Date</TableHead>
                <TableHead className="font-semibold w-[160px] text-gray-500 dark:text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="dark:bg-[#0e1725]">
              {currentPatients.length > 0 ? (
                currentPatients.map((patient) => {
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
                        <span className="text-gray-700 dark:text-white">{ bonusRowsByLocation[locId] && Object.prototype.hasOwnProperty.call(bonusRowsByLocation[locId], 'bonus_limit') ? Number(bonusRowsByLocation[locId].bonus_limit).toFixed(2) : '-' }</span>
                      </TableCell>
                      <TableCell className="dark:text-white">
                        <span className="text-gray-700 dark:text-white">{ bonusRowsByLocation[locId]?.flat_percentage ?? '-' }</span>
                      </TableCell>
                      <TableCell className="dark:text-white">
                        <div className="flex items-center">
                          <span className="mr-2 text-gray-700 dark:text-gray-300">{ (String(bonusRowsByLocation[locId]?.flat_percentage ?? '').toUpperCase() === 'PERCENTAGE') ? '' : '$' }</span>
                          <span className="text-gray-700 dark:text-white">{ (() => { const b = bonusRowsByLocation[locId]; const val = b?.value ?? b?.val ?? null; return (val !== undefined && val !== null) ? (Number(val).toFixed ? Number(val).toFixed(2) : String(val)) : '-' })() }</span>
                          <span className="ml-2 text-gray-700 dark:text-gray-300">{ (String(bonusRowsByLocation[locId]?.flat_percentage ?? '').toUpperCase() === 'PERCENTAGE') ? '%' : '' }</span>
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