"use client"

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { translationConstant } from '@/utils/translationConstants'
import BonusSummaryCards from '@/components/BonusSummaryCards'
import { fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services'
import supabase from '@/utils/supabaseClient'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import RangeDatePicker from '@/components/RangeDatePicker'

export default function IndividualBonusPage() {
  const { t } = useTranslation(translationConstant.BONUS)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [calcRunning, setCalcRunning] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [filterMode, setFilterMode] = useState<'staff' | 'location'>('staff')
  const [filterStaffName, setFilterStaffName] = useState<string>('')
  const [staffOptions, setStaffOptions] = useState<Array<{ full_name: string; location_id?: string[] }>>([])
  const [locationOptions, setLocationOptions] = useState<Array<{ id: string; title: string }>>([])
  const [allLocations, setAllLocations] = useState<Array<{ id: string; title: string }>>([])
  const [filterLocationIds, setFilterLocationIds] = useState<string[]>([])
  const [locDropdownOpen, setLocDropdownOpen] = useState<boolean>(false)
  const [staffSearchOpen, setStaffSearchOpen] = useState<boolean>(false)
  const [filterBonusStart, setFilterBonusStart] = useState<string | null>(null)
  const [filterBonusEnd, setFilterBonusEnd] = useState<string | null>(null)
  const [filterPaidStart, setFilterPaidStart] = useState<string | null>(null)
  const [filterPaidEnd, setFilterPaidEnd] = useState<string | null>(null)
  const [pickerMode, setPickerMode] = useState<'week' | 'month'>('week')
  const [weekStart, setWeekStart] = useState<string | null>(null)
  const [monthValue, setMonthValue] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)
  const [appliedFilters, setAppliedFilters] = useState<any>(null)
  const isWeekActive = (() => {
    if (pickerMode === 'week' && pickerOpen) return true
    if (!selectedRange) return false
    try {
      const s = new Date(selectedRange.start)
      const e = new Date(selectedRange.end)
      const diff = (e.getTime() - s.getTime()) / (24*3600*1000)
      return diff === 7
    } catch (e) { return false }
  })()
  const isMonthActive = (() => {
    if (pickerMode === 'month' && pickerOpen) return true
    if (!selectedRange) return false
    try {
      const s = new Date(selectedRange.start)
      const e = new Date(selectedRange.end)
      // month range: start is first of month and end is first of next month
      const diff = (e.getTime() - s.getTime()) / (24*3600*1000)
      // Treat either a calendar-month range (1st -> 1st of next month) or a 30-day range as 'month' active
      const isCalendarMonth = s.getUTCDate() === 1 && e.getUTCDate() === 1 && (e.getUTCMonth() !== s.getUTCMonth() || e.getUTCFullYear() !== s.getUTCFullYear())
      return isCalendarMonth || diff === 30
    } catch (e) { return false }
  })()

  type ClientFilters = {
    staffName?: string | null
    locationIds?: string[] | null
    bonusStart?: string | null
    bonusEnd?: string | null
    paidStart?: string | null
    paidEnd?: string | null
  }

  // keep a ref for selectedRange so fetchRows can be stable and avoid
  // being re-created on every render (helps satisfy exhaustive-deps)
  const selectedRangeRef = useRef(selectedRange)
  useEffect(() => { selectedRangeRef.current = selectedRange }, [selectedRange])

  const fetchRows = useCallback(async (clientFilters?: ClientFilters, rangeOverride?: { start: string; end: string }) => {
    try {
      setLoading(true)

      // Try the expected table name first, fall back to a generic 'individual' table
      let bonusRows: any[] = []
      try {
        // Determine which date range to use: explicit override (preferred) or current selectedRange state
        const activeRange = rangeOverride ?? selectedRangeRef.current
        // if user selected a date range (week/month), pass filterOptions
        if (activeRange) {
          bonusRows = await fetch_content_service({ table: 'individual_bonus', filterOptions: [
            { column: 'bonus_date', operator: 'gte', value: activeRange.start },
            { column: 'bonus_date', operator: 'lt', value: activeRange.end },
          ] })
        } else {
          bonusRows = await fetch_content_service({ table: 'individual_bonus' })
        }
      } catch (e) {
        // fallback — use the ref to avoid recreating fetchRows when selectedRange changes
        try {
          const activeFallbackRange = selectedRangeRef.current
          if (activeFallbackRange) {
            bonusRows = await fetch_content_service({ table: 'individual', filterOptions: [
              { column: 'bonus_date', operator: 'gte', value: activeFallbackRange.start },
              { column: 'bonus_date', operator: 'lt', value: activeFallbackRange.end },
            ] })
          } else {
            bonusRows = await fetch_content_service({ table: 'individual' })
          }
        } catch (err) {
          console.warn('Neither individual_bonus nor individual table available', err)
          bonusRows = []
        }
      }

      console.log('raw individual bonus rows:', bonusRows)

      // collect unique staff_ids
      const staffIds = Array.from(new Set((bonusRows || []).map((r: any) => Number(r.staff_id)).filter(Boolean)))
      let staffMap: Record<number, string> = {}
      if (staffIds.length > 0) {
        const staffRows = await fetch_content_service({ table: 'staff', filterOptions: [{ column: 'id', operator: 'in', value: staffIds }] })
        console.log('staff rows for individual bonuses:', staffRows)
        staffRows?.forEach((s: any) => { staffMap[Number(s.id)] = s.full_name })
      }

      // collect sales_team_ids and map to location_id
      const salesTeamIds = Array.from(new Set((bonusRows || []).map((r: any) => Number(r.sales_team_id)).filter(Boolean)))
      let salesTeamMap: Record<number, number> = {}
      let locationMap: Record<number, string> = {}
      if (salesTeamIds.length > 0) {
        const salesTeamRows = await fetch_content_service({ table: 'sales_team', filterOptions: [{ column: 'id', operator: 'in', value: salesTeamIds }], selectParam: 'location_id' })
        salesTeamRows?.forEach((s: any) => { salesTeamMap[Number(s.id)] = s.location_id })

        const locationIds = Array.from(new Set(salesTeamRows.map((st: any) => Number(st.location_id)).filter(Boolean)))
        if (locationIds.length > 0) {
          const locRows = await fetch_content_service({ table: 'Locations', filterOptions: [{ column: 'id', operator: 'in', value: locationIds }], selectParam: 'title' })
          locRows?.forEach((l: any) => { locationMap[Number(l.id)] = l.title })
        }
      }

      // collect auth_member UUIDs appearing directly on bonus (individual) rows only
      const authMemberIds = Array.from(new Set(((bonusRows || []).map((r: any) => r.auth_member).filter(Boolean) || [])))

      // fetch profiles for those auth_member ids so we can display full_name when staff_id is null
      let profileMap: Record<string, string> = {}
      if (authMemberIds.length > 0) {
        try {
          const profileRows = await fetch_content_service({ table: 'profiles', filterOptions: [{ column: 'id', operator: 'in', value: authMemberIds }], selectParam: 'id,full_name' })
          profileRows?.forEach((p: any) => { if (p && p.id) profileMap[String(p.id)] = p.full_name })
        } catch (err) {
          console.warn('Failed to load profiles for auth_member mapping', err)
        }
      }

      const mapped = (bonusRows || []).map((r: any) => ({
        id: r.id,
        staff_id: r.staff_id,
        sales_team_id: r.sales_team_id ?? null,
        // include the location_id from sales_team (if available) so client filtering can use it
        location_id: salesTeamMap[Number(r.sales_team_id)] ? String(salesTeamMap[Number(r.sales_team_id)]) : null,
        location_name: salesTeamMap[Number(r.sales_team_id)] ? (locationMap[salesTeamMap[Number(r.sales_team_id)]] || '') : '',
        staff_name: (r.staff_id ? (staffMap[Number(r.staff_id)] || String(r.staff_id)) : (r.auth_member && profileMap[String(r.auth_member)] ? profileMap[String(r.auth_member)] : '')),
        bonus: r.bonus ?? r.amount ?? r.bonus_amount ?? 0,
        paid: Boolean(r.paid),
        paid_date: r.paid_date ?? null,
        // Use the canonical `bonus_date` column when present. Do not fall back to created_at.
        bonus_date: r.bonus_date ?? r.date ?? null,
      }))

      console.log('mapped individual bonuses:', mapped)

      // apply client-side filters if provided
      let filtered = mapped
      if (clientFilters) {
        const { staffName, locationIds, bonusStart, bonusEnd, paidStart, paidEnd } = clientFilters

        if (staffName) {
          const s = staffName.toLowerCase()
          filtered = filtered.filter((r: any) => (r.staff_name || '').toLowerCase().includes(s))
        }
        if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
          // filter by the sales_team -> location_id stored on the mapped row
          filtered = filtered.filter((r: any) => (r.location_id ? locationIds.includes(String(r.location_id)) : false))
        }

        const hasBonusRange = Boolean(bonusStart || bonusEnd)
        const hasPaidRange = Boolean(paidStart || paidEnd)

        const inRange = (dateStr: any, startStr?: string | null, endStr?: string | null) => {
          if (!dateStr) return false
          try {
            const d = new Date(dateStr)
            if (startStr) {
              const s = new Date(startStr)
              if (d < s) return false
            }
            if (endStr) {
              const e = new Date(endStr)
              if (d > e) return false
            }
            return true
          } catch (e) { return false }
        }

        if (hasBonusRange && hasPaidRange) {
          // when both ranges are provided, include rows where bonus_date is in bonus range OR paid_date is in paid range
          filtered = filtered.filter((r: any) => inRange(r.bonus_date, bonusStart, bonusEnd) || inRange(r.paid_date, paidStart, paidEnd))
        } else if (hasBonusRange) {
          filtered = filtered.filter((r: any) => inRange(r.bonus_date, bonusStart, bonusEnd))
        } else if (hasPaidRange) {
          filtered = filtered.filter((r: any) => inRange(r.paid_date, paidStart, paidEnd))
        }
      }

      setRows(filtered)
    } catch (e) {
      console.error('Error loading individual bonuses', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])


  // helper to set staff name and load its locations (used by search/select)
  const handleStaffSelect = async (fullName: string) => {
    setFilterStaffName(fullName)
    // find staff record to get its location_ids
    const staffRec = staffOptions.find((s) => s.full_name === fullName)
    if (staffRec && Array.isArray(staffRec.location_id) && staffRec.location_id.length > 0) {
      try {
        const locRows = await fetch_content_service({ table: 'Locations', filterOptions: [{ column: 'id', operator: 'in', value: staffRec.location_id }], selectParam: 'id,title' })
        if (Array.isArray(locRows)) {
          setLocationOptions(locRows.map((l: any) => ({ id: String(l.id), title: l.title })))
          // reset selected locations when staff changes
          setFilterLocationIds([])
        } else {
          setLocationOptions([])
        }
      } catch (err) {
        console.error('Failed to load locations for staff', err)
        setLocationOptions([])
      }
    } else {
      setLocationOptions([])
      setFilterLocationIds([])
    }
    setStaffSearchOpen(false)
  }

  useEffect(() => { fetchRows() }, [fetchRows])

  // load staff names for dropdown
  useEffect(() => {
    const loadStaffNames = async () => {
      try {
        // fetch full_name and location_id (array) from staff
        const staffRows = await fetch_content_service({ table: 'staff', selectParam: 'full_name,location_id' })
        if (Array.isArray(staffRows)) {
          const mapped = staffRows.map((s: any) => ({ full_name: s.full_name, location_id: Array.isArray(s.location_id) ? s.location_id : (s.location_id ? [s.location_id] : []) }))
          setStaffOptions(mapped.filter((s: any) => s.full_name))
        }
      } catch (err) {
        console.error('Failed to load staff names for dropdown', err)
      }
    }
    loadStaffNames()
  }, [])

  // load all Locations (for location-mode dropdown)
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locRows = await fetch_content_service({ table: 'Locations', selectParam: 'id,title' })
        if (Array.isArray(locRows)) setAllLocations(locRows.map((l: any) => ({ id: String(l.id), title: l.title })))
      } catch (err) {
        console.error('Failed to load Locations', err)
      }
    }
    loadLocations()
  }, [])

  // when switching to location mode, clear staff and set locationOptions to allLocations
  useEffect(() => {
    if (filterMode === 'location') {
      setFilterStaffName('')
      setLocationOptions(allLocations)
      setFilterLocationIds([])
    } else {
      // when switching back to staff mode, clear any global location selection
      setFilterLocationIds([])
      // restore locationOptions to only those locations where the selected staff works
      if (filterStaffName) {
        const staffRec = staffOptions.find((s) => s.full_name === filterStaffName)
        if (staffRec && Array.isArray(staffRec.location_id) && staffRec.location_id.length > 0) {
          const staffLocIds = staffRec.location_id.map((id: any) => String(id))
          setLocationOptions(allLocations.filter((l) => staffLocIds.includes(String(l.id))))
        } else {
          setLocationOptions([])
        }
      } else {
        setLocationOptions([])
      }
    }
  }, [filterMode, allLocations, filterStaffName, staffOptions])

  const summaryCards = useMemo(() => {
    // If a location filter was applied, show stats specific to that location(s)
    if (appliedFilters && appliedFilters.mode === 'location') {
      const locTitles: string[] = Array.isArray(appliedFilters.locationTitles) ? appliedFilters.locationTitles : []
      if (locTitles.length > 0) {
        const rowsForLoc = rows.filter((r) => locTitles.includes(r.location_name))
        const totalToLocation = rowsForLoc.reduce((acc, r) => acc + Number(r.bonus || 0), 0)
        const totalPaidToLocation = rowsForLoc.reduce((acc, r) => acc + (r.paid ? Number(r.bonus || 0) : 0), 0)

        // compute total per staff within these locations
        const byStaff: Record<string, number> = {}
        rowsForLoc.forEach((r) => {
          const person = r.staff_name || String(r.staff_id || 'Unknown')
          byStaff[person] = (byStaff[person] || 0) + Number(r.bonus || 0)
        })
        let highestAmount = 0
        const highestNames = highestAmount > 0 ? Object.entries(byStaff).filter(([, amt]) => amt === highestAmount).map(([name]) => name) : []

        const titleLocation = locTitles.length === 1 ? locTitles[0] : locTitles.join(', ')

        return [
          { id: 'total', title: `Total Bonus to ${titleLocation}`, value: `$${totalToLocation.toFixed(2)}` },
          { id: 'total_paid', title: `Total Bonus Paid to ${titleLocation}`, value: `$${totalPaidToLocation.toFixed(2)}` },
          { id: 'highest_staff', title: 'Highest Bonus Staff on Location', value: `$${highestAmount.toFixed(2)}`, subtitle: highestNames.length > 0 ? highestNames.join(', ') : '-' },
        ]
      }
    }
    // If a staff filter was applied, show stats specific to that staff
    if (appliedFilters && appliedFilters.mode === 'staff' && appliedFilters.staffName) {
      const staffName = appliedFilters.staffName
      const staffRows = rows.filter((r) => (r.staff_name || '') === staffName)
      const totalToStaff = staffRows.reduce((acc, r) => acc + Number(r.bonus || 0), 0)
      const totalPaidToStaff = staffRows.reduce((acc, r) => acc + (r.paid ? Number(r.bonus || 0) : 0), 0)

      // compute highest bonus at selected location(s) if provided
      let maxAmt = 0
      let maxLoc = '-'
      const locTitles: string[] = Array.isArray(appliedFilters.locationTitles) ? appliedFilters.locationTitles : []
      let rowsForLoc: any[] = []
      if (locTitles.length > 0) {
        rowsForLoc = rows.filter((r) => locTitles.includes(r.location_name))
      } else {
        // fallback to staffRows
        rowsForLoc = staffRows
      }
      if (rowsForLoc.length > 0) {
        const maxRow = rowsForLoc.reduce((p, c) => (Number(p.bonus || 0) >= Number(c.bonus || 0) ? p : c))
        maxAmt = Number(maxRow.bonus || 0)
        maxLoc = maxRow.location_name || '-'
      }

      return [
        { id: 'total', title: `Total Bonus to ${staffName}`, value: `$${totalToStaff.toFixed(2)}` },
        { id: 'total_paid', title: `Total Bonus Paid to ${staffName}`, value: `$${totalPaidToStaff.toFixed(2)}` },
        { id: 'highest_loc', title: 'Highest Bonus at Selected Location', value: `$${maxAmt.toFixed(2)}`, subtitle: maxLoc },
      ]
    }

    // default behaviour when no staff-specific filter applied
    const totalCount = rows.length
    const totalPaid = rows.reduce((acc, r) => acc + (r.paid ? Number(r.bonus || 0) : 0), 0)
    const totalUnpaid = rows.reduce((acc, r) => acc + (!r.paid ? Number(r.bonus || 0) : 0), 0)

    // compute total paid per location
    const paidByLocation: Record<string, number> = {}
    rows.forEach((r) => {
      if (r.paid) {
        const loc = r.location_name || 'Unknown'
        paidByLocation[loc] = (paidByLocation[loc] || 0) + Number(r.bonus || 0)
      }
    })

    // find highest paid location
    let highestLocation = { name: '-', amount: 0 }
    Object.entries(paidByLocation).forEach(([loc, amt]) => {
      if (amt > highestLocation.amount) {
        highestLocation = { name: loc, amount: amt }
      }
    })

    // compute total paid per person (staff)
    const paidByPerson: Record<string, number> = {}
    rows.forEach((r) => {
      if (r.paid) {
        const person = r.staff_name || String(r.staff_id || 'Unknown')
        paidByPerson[person] = (paidByPerson[person] || 0) + Number(r.bonus || 0)
      }
    })

    // find highest paid amount among persons and collect all names with that amount
    let highestPersonAmount = 0
    Object.values(paidByPerson).forEach((amt) => { if (amt > highestPersonAmount) highestPersonAmount = amt })
    const highestPersonNames = highestPersonAmount > 0
      ? Object.entries(paidByPerson).filter(([, amt]) => amt === highestPersonAmount).map(([name]) => name)
      : []

    const highestPersonSubtitle = highestPersonNames.length > 0 ? highestPersonNames.join(', ') : '-'

    return [
      { id: 'total', title: 'Total bonus paid', value: `$${totalPaid.toFixed(2)}` },
      { id: 'highest_location_paid', title: 'Highest Location Bonus Paid', value: `$${highestLocation.amount.toFixed(2)}`, subtitle: highestLocation.name },
      { id: 'highest_person_paid', title: 'Highest Person Bonus Paid', value: `$${highestPersonAmount.toFixed(2)}`, subtitle: highestPersonSubtitle },
    ]
  }, [rows, appliedFilters])

  const handlePay = async (row: any) => {
    if (row.paid) return

    // optimistic UI: mark as paying
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, paying: true } : r)))

    try {
      // call update service to set paid = true in individual_bonus table
      console.log('Pay clicked for row (persisting):', row)
      const nowIso = new Date().toISOString()
      const res = await update_content_service({ table: 'individual_bonus', post_data: { id: row.id, paid: true, paid_date: nowIso } })
      // supabase returns updated row(s) in res; if successful, update UI
      if (res && Array.isArray(res) && res.length > 0) {
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, paid: true, paying: false, paid_date: nowIso } : r)))
      } else {
        // fallback: still mark as paid if service didn't return rows but no error thrown
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, paid: true, paying: false, paid_date: nowIso } : r)))
      }
    } catch (err) {
      console.error('Error paying bonus', err)
      // clear paying flag on error
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, paying: false } : r)))
      // Optionally: surface an error to user (toast/modal) — left as TODO
    }
  }

  return (
    <main className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">{t('Bonus_k47')}</h1>
          <button
            type="button"
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded min-w-[120px]"
            onClick={() => setFilterModalOpen(true)}
            title={t('Bonus_k6')}
          >
            {t('Bonus_k6')}
          </button>
        </div>
        <div className="relative flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className={`text-sm px-2 py-1 rounded text-orange-600 font-medium ${isWeekActive ? 'underline decoration-orange-600 underline-offset-4' : ''}`}
              onClick={() => {
                // Auto-filter to last 7 days (including today). Do not open modal.
                try {
                  const today = new Date()
                  // start = today - 6 days, at UTC 00:00:00 (inclusive start)
                  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6, 0, 0, 0))
                  // endExclusive = tomorrow UTC 00:00:00 (exclusive) — used for DB query
                  const endExclusive = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1, 0, 0, 0))
                  // Set selectedRange with exclusive end (for queries)
                  setSelectedRange({ start: start.toISOString(), end: endExclusive.toISOString() })
                  // Set weekStart so the UI shows `start → start+6` (e.g. 2025-11-23 → 2025-11-29)
                  setWeekStart(start.toISOString().slice(0,10))
                  // Ensure any open picker is closed
                  setPickerOpen(false)
                  // Refresh rows using the computed exclusive range (avoid waiting for state)
                  fetchRows(undefined, { start: start.toISOString(), end: endExclusive.toISOString() }).catch(() => {})
                } catch (err) {
                  console.error('Failed to apply week filter', err)
                }
              }}
            >
              {t('Bonus_k48')}
            </button>
            <button
              type="button"
              className={`text-sm px-2 py-1 rounded text-orange-600 font-medium ${isMonthActive ? 'underline decoration-orange-600 underline-offset-4' : ''}`}
              onClick={() => {
                // Auto-filter to past 30 days (including today). Do not open modal.
                try {
                  const today = new Date()
                  // start = today - 29 days, at UTC 00:00:00 (inclusive start)
                  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 29, 0, 0, 0))
                  // endExclusive = tomorrow UTC 00:00:00 (exclusive)
                  const endExclusive = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1, 0, 0, 0))
                  // For display, set monthValue to the month of the start (so picker shows context if opened)
                  setMonthValue(start.toISOString().slice(0,7))
                  setSelectedRange({ start: start.toISOString(), end: endExclusive.toISOString() })
                  setPickerOpen(false)
                  fetchRows(undefined, { start: start.toISOString(), end: endExclusive.toISOString() }).catch(() => {})
                } catch (err) {
                  console.error('Failed to apply month filter', err)
                }
              }}
            >
              {t('Bonus_k49')}
            </button>
          </div>

          {pickerOpen && (
            <div className="absolute right-0 z-20 mt-10 w-72 bg-white rounded border border-gray-200 p-3 shadow-lg">
              <div className="mb-2 text-sm font-medium">{pickerMode === 'week' ? t('Bonus_k50') : t('Bonus_k51')}</div>
              {pickerMode === 'week' ? (
                <div className="space-y-2">
                  <input className="w-full border p-1 rounded" type="date" value={weekStart ?? ''} onChange={(e) => setWeekStart(e.target.value)} />
                  <div className="text-xs text-gray-500">{t('Bonus_k52')} {weekStart ? `${weekStart} → ${new Date(new Date(weekStart).getTime() + 6*24*3600*1000).toISOString().slice(0,10)}` : '-'}</div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setPickerOpen(false)}>{t('Bonus_k54')}</button>
                    <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => {
                      if (weekStart) {
                        const s = new Date(weekStart)
                        const startIso = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate(), 0,0,0)).toISOString()
                        const end = new Date(s.getTime() + 7*24*3600*1000)
                        const endIso = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 0,0,0)).toISOString()
                        setSelectedRange({ start: startIso, end: endIso })
                        setPickerOpen(false)
                        // pass the same range to fetchRows to avoid relying on state update timing
                        fetchRows(undefined, { start: startIso, end: endIso }).catch(() => {})
                      }
                    }}>{t('Bonus_k27')}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input className="w-full border p-1 rounded" type="month" value={monthValue ?? ''} onChange={(e) => setMonthValue(e.target.value)} />
                  <div className="text-xs text-gray-500">{t('Bonus_k53')} {monthValue ?? '-'}</div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setPickerOpen(false)}>{t('Bonus_k54')}</button>
                    <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => {
                      if (monthValue) {
                        const [y, m] = monthValue.split('-').map(Number)
                        const start = new Date(Date.UTC(y, m-1, 1, 0,0,0))
                        const end = new Date(Date.UTC(y, m, 1, 0,0,0))
                        setSelectedRange({ start: start.toISOString(), end: end.toISOString() })
                        setPickerOpen(false)
                        // pass the same range to fetchRows to avoid relying on state update timing
                        fetchRows(undefined, { start: start.toISOString(), end: end.toISOString() }).catch(() => {})
                      }
                    }}>{t('Bonus_k27')}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          

          <button
            className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 rounded ${calcRunning ? 'opacity-60 cursor-wait' : ''}`}
            disabled={calcRunning}
            onClick={async () => {
              setCalcRunning(true)
              try {
                // First, calculate team bonuses
                const { error: teamBonusError } = await supabase.rpc('calculate_team_bonus_daily')
                if (teamBonusError) {
                  console.error('RPC calculate_team_bonus_daily error:', teamBonusError)
                  toast.error('Team bonus calculation failed')
                  return
                }

                // Then, distribute individual bonuses
                const { error: distributeBonusError } = await supabase.rpc('distribute_individual_bonus_daily')
                if (distributeBonusError) {
                  console.error('RPC distribute_individual_bonus_daily error:', distributeBonusError)
                  toast.error(t('Bonus_k57'))
                } else {
                  toast.success(t('Bonus_k58'))
                  try { await fetchRows() } catch (_) {}
                }
              } catch (err) {
                console.error('Failed to call RPC distribute_individual_bonus_daily:', err)
                toast.error('Failed to trigger distribution')
              } finally {
                setCalcRunning(false)
              }
            }}
            aria-label="Distribute individual bonuses"
            title="Distribute individual bonuses"
          >
            {calcRunning ? 'Calculating...' : 'Calculate'}
          </button>
          
        </div>
      </div>

      {appliedFilters && (
        <div className="mt-4 mb-4 p-3 bg-gray-50 rounded border">
          <div className="text-sm text-gray-600">{t('Bonus_k59')} ({appliedFilters.mode === 'staff' ? t('Bonus_k16') : t('Bonus_k38')})</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {appliedFilters.staffName && <div className="px-2 py-1 bg-blue-50 text-blue-800 rounded">{t('Bonus_k7')}: {appliedFilters.staffName}</div>}
            {appliedFilters.locationTitles && appliedFilters.locationTitles.length > 0 && (
              <div className="px-2 py-1 bg-green-50 text-green-800 rounded">{t('Bonus_k60')} {appliedFilters.locationTitles.join(', ')}</div>
            )}
            {(appliedFilters.bonusStart || appliedFilters.bonusEnd) && (
              <div className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded">{t('Bonus_k61')} {appliedFilters.bonusStart ? appliedFilters.bonusStart.slice(0,10) : '-'} → {appliedFilters.bonusEnd ? appliedFilters.bonusEnd.slice(0,10) : '-'}</div>
            )}
            {(appliedFilters.paidStart || appliedFilters.paidEnd) && (
              <div className="px-2 py-1 bg-purple-50 text-purple-800 rounded">{t('Bonus_k36')}: {appliedFilters.paidStart ? appliedFilters.paidStart.slice(0,10) : '-'} → {appliedFilters.paidEnd ? appliedFilters.paidEnd.slice(0,10) : '-'}</div>
            )}
            <button className="ml-auto text-sm text-red-600" onClick={async () => { setAppliedFilters(null); setSelectedRange(null); try { await fetchRows() } catch(_){} }}>{t('Bonus_k26')}</button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <BonusSummaryCards cards={summaryCards} />
      </div>

      <div className="flex items-center justify-start gap-4 mt-4 mb-4">
        {selectedRange && (
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-gray-50 border rounded text-sm">{selectedRange.start.slice(0,10)} → {(() => { const e = new Date(selectedRange.end); const incl = new Date(e.getTime() - 24*3600*1000); return incl.toISOString().slice(0,10) })()}</div>
            <button className="text-xs text-red-600" onClick={async () => { setSelectedRange(null); try { await fetchRows() } catch(_){} }}>{t('Bonus_k26')}</button>
          </div>
        )}
      </div>

      {/* Filter modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white rounded shadow-lg p-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">{t('Bonus_k62')}</h3>
              <button className="text-sm text-gray-600" onClick={() => setFilterModalOpen(false)}>{t('Bonus_k63')}</button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="filterMode" checked={filterMode === 'staff'} onChange={() => setFilterMode('staff')} />
                  <span>{t('Bonus_k16')}</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="filterMode" checked={filterMode === 'location'} onChange={() => setFilterMode('location')} />
                  <span>{t('Bonus_k38')}</span>
                </label>
              </div>

              {/* Staff name and Location on same row for staff-mode */}
              {filterMode === 'staff' && (
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-3">
                    <label className="w-28 text-sm">Staff name</label>
                    <div className="relative w-64">
                      <input
                        type="text"
                        className="mt-1 w-full border border-gray-200 p-2 rounded text-sm focus:outline-none focus:ring-0 focus:border-gray-300 bg-white"
                        placeholder="Search staff"
                        value={filterStaffName}
                        onChange={(e) => {
                          setFilterStaffName(e.target.value)
                          setStaffSearchOpen(true)
                          if (!e.target.value) {
                            setLocationOptions(allLocations)
                            setFilterLocationIds([])
                          }
                        }}
                        onFocus={() => setStaffSearchOpen(true)}
                        onBlur={() => setTimeout(() => setStaffSearchOpen(false), 150)}
                      />

                      {staffSearchOpen && filterStaffName !== '' && (
                        <div className="absolute z-40 mt-1 w-full max-h-48 overflow-auto bg-white border rounded shadow-lg">
                          {staffOptions.filter(s => s.full_name.toLowerCase().includes(filterStaffName.toLowerCase())).length > 0 ? (
                            staffOptions.filter(s => s.full_name.toLowerCase().includes(filterStaffName.toLowerCase())).map((s) => (
                              <div key={s.full_name} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={() => handleStaffSelect(s.full_name)}>
                                {s.full_name}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">(no matches)</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-28 text-sm">{t('Bonus_k38')}</label>
                    <div className="mt-1 w-64 border rounded p-2 cursor-pointer relative" onClick={() => setLocDropdownOpen((s) => !s)}>
                      <div className="flex flex-wrap gap-2 items-center">
                        {filterLocationIds.length === 0 && <div className="text-gray-500">{t('Bonus_k28')}</div>}
                        {filterLocationIds.map((id) => {
                          const loc = locationOptions.find((l) => l.id === id)
                          return loc ? (
                            <span key={id} className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-2">
                              <span className="text-sm">{loc.title}</span>
                              <button type="button" onClick={(ev) => { ev.stopPropagation(); setFilterLocationIds(prev => prev.filter(x => x !== id)) }} className="text-green-700 font-bold">×</button>
                            </span>
                          ) : null
                        })}
                        <div className="ml-auto text-gray-400">▾</div>
                      </div>

                      {locDropdownOpen && (
                        <div className="absolute z-40 mt-1 left-0 w-full max-h-48 overflow-auto bg-white border rounded shadow-lg">
                          {locationOptions.length > 0 ? (
                            locationOptions.map((loc) => (
                              <div key={loc.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between" onClick={(ev) => { ev.stopPropagation(); setFilterLocationIds(prev => prev.includes(loc.id) ? prev : [...prev, loc.id]); setLocDropdownOpen(false) }}>
                                  <div className="text-sm">{loc.title}</div>
                                </div>
                              ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">(no locations)</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location-only field (visible only when Location radio is selected).
                  Shows all locations and allows selecting multiple without changing
                  the existing staff-mode logic. */}
              {filterMode === 'location' && (
                <div className="flex items-center gap-6 mb-4">
                  <label className="w-28 text-sm">{t('Bonus_k38')}</label>
                  <div className="mt-1 w-96 border rounded p-2 cursor-pointer relative" onClick={() => setLocDropdownOpen((s) => !s)}>
                    <div className="flex flex-wrap gap-2 items-center">
                      {filterLocationIds.length === 0 && <div className="text-gray-500">{t('Bonus_k28')}</div>}
                      {filterLocationIds.map((id) => {
                        const loc = allLocations.find((l) => l.id === id)
                        return loc ? (
                          <span key={id} className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-2">
                            <span className="text-sm">{loc.title}</span>
                            <button type="button" onClick={(ev) => { ev.stopPropagation(); setFilterLocationIds(prev => prev.filter(x => x !== id)) }} className="text-green-700 font-bold">×</button>
                          </span>
                        ) : null
                      })}
                      <div className="ml-auto text-gray-400">▾</div>
                    </div>

                    {locDropdownOpen && (
                      <div className="absolute z-40 mt-1 left-0 w-full max-h-64 overflow-auto bg-white border rounded shadow-lg">
                        {allLocations.length > 0 ? (
                          allLocations.map((loc) => (
                            <div key={loc.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center" onClick={() => {
                              // toggle selection but do not auto-close the dropdown
                              setFilterLocationIds(prev => prev.includes(loc.id) ? prev.filter(x => x !== loc.id) : [...prev, loc.id])
                            }}>
                              <input type="checkbox" readOnly checked={filterLocationIds.includes(loc.id)} className="mr-2" />
                              <div className="text-sm">{loc.title}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">(no locations)</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="flex flex-col items-center">
                  <label className="text-sm mb-2">Bonus date</label>
                  <div className="w-full flex justify-center">
                    <RangeDatePicker
                      start={filterBonusStart}
                      end={filterBonusEnd}
                      onChange={(s, e) => {
                        setFilterBonusStart(s)
                        setFilterBonusEnd(e)
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <label className="text-sm mb-2">Paid date</label>
                  <div className="w-full flex justify-center">
                    <RangeDatePicker
                      start={filterPaidStart}
                      end={filterPaidEnd}
                      onChange={(s, e) => {
                        setFilterPaidStart(s)
                        setFilterPaidEnd(e)
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => {
                  // Reset modal fields (does not apply filters)
                  setFilterStaffName('')
                  setFilterLocationIds([])
                  setFilterBonusStart(null)
                  setFilterBonusEnd(null)
                  setFilterPaidStart(null)
                  setFilterPaidEnd(null)
                  setLocationOptions(allLocations)
                  setLocDropdownOpen(false)
                }}>Reset</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={async () => {
                  // Validate staff selection: only allow names that exist in the dropdown list.
                  if (filterMode === 'staff' && filterStaffName.trim()) {
                    const exists = staffOptions.some((s) => s.full_name === filterStaffName.trim())
                    if (!exists) {
                      toast.error('Please select a staff from the list')
                      return
                    }
                  }

                  const clientFilters = {
                    staffName: filterStaffName || null,
                    locationIds: (filterLocationIds && filterLocationIds.length > 0) ? filterLocationIds : null,
                    bonusStart: filterBonusStart ? new Date(filterBonusStart).toISOString() : null,
                    bonusEnd: filterBonusEnd ? new Date(filterBonusEnd).toISOString() : null,
                    paidStart: filterPaidStart ? new Date(filterPaidStart).toISOString() : null,
                    paidEnd: filterPaidEnd ? new Date(filterPaidEnd).toISOString() : null,
                  }
                  // compute human-readable location titles for display
                  const locTitles = (clientFilters.locationIds || []).map((id) => {
                    const found = locationOptions.find((l) => String(l.id) === String(id)) || allLocations.find((l) => String(l.id) === String(id))
                    return found ? found.title : String(id)
                  })

                  setFilterModalOpen(false)
                  // store the applied filter snapshot for UI summary
                  setAppliedFilters({ ...clientFilters, mode: filterMode, locationTitles: locTitles })
                  try {
                    await fetchRows(clientFilters)
                  } catch (e) {
                    console.error('Filter fetch error', e)
                  } finally {
                    // clear modal fields so modal is refreshed next time it's opened
                    setFilterStaffName('')
                    setFilterLocationIds([])
                    setFilterBonusStart(null)
                    setFilterBonusEnd(null)
                    setFilterPaidStart(null)
                    setFilterPaidEnd(null)
                  }
                }}>{t('Bonus_k27')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <table className="w-full table-auto border-collapse">
          <thead>
                <tr className="text-left">
              <th className="px-2 py-1 border-b">{t('Bonus_k7')}</th>
              <th className="px-2 py-1 border-b">{t('Bonus_k38')}</th>
              <th className="px-2 py-1 border-b">{t('Bonus_k12')}</th>
                <th className="px-2 py-1 border-b">{t('Bonus_k81')}</th>
                <th className="px-2 py-1 border-b">{t('Bonus_k13')}</th>
                  <th className="px-2 py-1 border-b">{t('Bonus_k40')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-2 border-b">{r.staff_name}</td>
                <td className="px-2 py-2 border-b">{r.location_name ?? ''}</td>
                <td className="px-2 py-2 border-b">{Number(r.bonus).toFixed(2)}</td>
                <td className="px-2 py-2 border-b">{r.bonus_date ? new Date(r.bonus_date).toLocaleDateString() : '-'}</td>
                <td className="px-2 py-2 border-b">{r.paid_date ? new Date(r.paid_date).toLocaleDateString() : '-'}</td>
                <td className="px-2 py-2 border-b">
                  <button
                    type="button"
                    onClick={() => handlePay(r)}
                    disabled={Boolean(r.paid) || Boolean(r.paying)}
                    className={
                      (r.paid || r.paying)
                        ? 'bg-gray-400 text-white px-3 py-1 rounded cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded'
                    }
                    aria-disabled={Boolean(r.paid) || Boolean(r.paying)}
                    title={r.paid ? t('Bonus_k72') : r.paying ? t('Bonus_k73') : t('Bonus_k71')}
                  >
                    {r.paid ? t('Bonus_k36') : r.paying ? t('Bonus_k70') : t('Bonus_k71')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-sm text-gray-500 mt-2">{t('Bonus_k68')}</div>}
        {!loading && rows.length === 0 && <div className="text-sm text-gray-500 mt-2">{t('Bonus_k69')}</div>}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </main>
  )
}
