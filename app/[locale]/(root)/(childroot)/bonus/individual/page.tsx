"use client"

import React, { useEffect, useState } from 'react'
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'

export default function IndividualBonusPage() {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
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
          staff_name: staffMap[Number(r.staff_id)] || String(r.staff_id),
          bonus: r.bonus ?? r.amount ?? r.bonus_amount ?? 0,
          bonus_date: r.bonus_date ?? r.date ?? r.created_at ?? null,
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

    load()
  }, [])

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Individual Bonus</h1>

      <div className="mt-6">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1 border-b">ID</th>
              <th className="px-2 py-1 border-b">Staff</th>
              <th className="px-2 py-1 border-b">Bonus</th>
              <th className="px-2 py-1 border-b">Bonus Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-2 border-b">{r.id}</td>
                <td className="px-2 py-2 border-b">{r.staff_name}</td>
                <td className="px-2 py-2 border-b">{Number(r.bonus).toFixed(2)}</td>
                <td className="px-2 py-2 border-b">{r.bonus_date ? new Date(r.bonus_date).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-sm text-gray-500 mt-2">Loading individual bonuses...</div>}
        {!loading && rows.length === 0 && <div className="text-sm text-gray-500 mt-2">No individual bonuses found.</div>}
      </div>
    </main>
  )
}
