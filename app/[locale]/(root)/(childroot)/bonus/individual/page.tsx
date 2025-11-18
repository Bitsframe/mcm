"use client"

import React, { useEffect, useState } from 'react'
import { fetch_content_service, update_content_service } from '@/utils/supabase/data_services/data_services'
import supabase from '@/utils/supabaseClient'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function IndividualBonusPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [calcRunning, setCalcRunning] = useState(false)

  const fetchRows = async () => {
    try {
      setLoading(true)

      // Try the expected table name first, fall back to a generic 'individual' table
      let bonusRows: any[] = []
      try {
        bonusRows = await fetch_content_service({ table: 'individual_bonus' })
      } catch (e) {
        // fallback
        try {
          bonusRows = await fetch_content_service({ table: 'individual' })
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

      const mapped = (bonusRows || []).map((r: any) => ({
        id: r.id,
        staff_id: r.staff_id,
        sales_team_id: r.sales_team_id ?? null,
        staff_name: staffMap[Number(r.staff_id)] || String(r.staff_id),
        bonus: r.bonus ?? r.amount ?? r.bonus_amount ?? 0,
        paid: Boolean(r.paid),
        // Use the canonical `bonus_date` column when present. Do not fall back to created_at.
        bonus_date: r.bonus_date ?? r.date ?? null,
      }))

      console.log('mapped individual bonuses:', mapped)
      setRows(mapped)
    } catch (e) {
      console.error('Error loading individual bonuses', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRows() }, [])

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
        <h1 className="text-xl font-semibold">Individual Bonus</h1>
        <div>
          <button
            className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 rounded ${calcRunning ? 'opacity-60 cursor-wait' : ''}`}
            disabled={calcRunning}
            onClick={async () => {
              setCalcRunning(true)
              try {
                const { data: distributeBonusData, error: distributeBonusError } = await supabase.rpc('distribute_individual_bonus_daily')
                if (distributeBonusError) {
                  console.error('RPC distribute_individual_bonus_daily error:', distributeBonusError)
                  toast.error('Failed to trigger distribution')
                } else {
                  toast.success('Distribution triggered')
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

      <div className="mt-6">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1 border-b">ID</th>
              <th className="px-2 py-1 border-b">Staff</th>
              <th className="px-2 py-1 border-b">Bonus Team ID</th>
              <th className="px-2 py-1 border-b">Bonus amount</th>
              <th className="px-2 py-1 border-b">DATE</th>
                 <th className="px-2 py-1 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-2 border-b">{r.id}</td>
                <td className="px-2 py-2 border-b">{r.staff_name}</td>
                <td className="px-2 py-2 border-b">{r.sales_team_id ?? ''}</td>
                <td className="px-2 py-2 border-b">{Number(r.bonus).toFixed(2)}</td>
                <td className="px-2 py-2 border-b">{r.bonus_date ? new Date(r.bonus_date).toLocaleDateString() : ''}</td>
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
                    title={r.paid ? 'Already paid' : r.paying ? 'Processing payment' : 'Pay bonus'}
                  >
                    {r.paid ? 'Paid' : r.paying ? 'Paying...' : 'Pay'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-sm text-gray-500 mt-2">Loading individual bonuses...</div>}
        {!loading && rows.length === 0 && <div className="text-sm text-gray-500 mt-2">No individual bonuses found.</div>}
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </main>
  )
}
