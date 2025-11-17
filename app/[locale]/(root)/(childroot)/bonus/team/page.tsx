"use client"

import React, { useEffect, useState, useContext } from 'react'
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'
import { LocationContext } from '@/context/LocationContext'

export default function TeamBonusPage() {
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const { selectedLocation } = useContext(LocationContext)

  useEffect(() => {
    const load = async () => {
      if (!selectedLocation || !selectedLocation.id) {
        setTeams([])
        return
      }
      try {
        setLoading(true)
        // fetch sales_team rows for selected location only
        const teamRows = await fetch_content_service({ table: 'sales_team', matchCase: { key: 'location_id', value: selectedLocation.id } })
        console.log('raw sales_team rows:', teamRows)

        // collect unique member IDs
        const memberIds = Array.from(new Set((teamRows || []).flatMap((r: any) => (r.members || []).map((m: any) => Number(m))).filter(Boolean)))
        let staffMap: Record<number, string> = {}
        if (memberIds.length > 0) {
          const staffRows = await fetch_content_service({ table: 'staff', filterOptions: [{ column: 'id', operator: 'in', value: memberIds }] })
          console.log('staff rows for members:', staffRows)
          staffRows?.forEach((s: any) => {
            staffMap[Number(s.id)] = s.full_name
          })
        }

        // map teams to include resolved member names and only the requested fields
        const mapped = (teamRows || []).map((t: any) => ({
          id: t.id,
          members: (t.members || []).map((m: any) => staffMap[Number(m)] || String(m)),
          location_id: t.location_id,
          team_bonus: t.bonus_amount_overall ?? 0,
        }))

        console.log('mapped teams:', mapped)
        setTeams(mapped)
      } catch (e) {
        console.error('Error fetching sales_team:', e)
        setTeams([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedLocation])

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Team Bonus</h1>


      {/* Simple table header - rows intentionally not rendered yet; data is logged to console */}
      <div className="mt-6">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="px-2 py-1 border-b">ID</th>
              <th className="px-2 py-1 border-b">Members</th>
              <th className="px-2 py-1 border-b">Location</th>
              <th className="px-2 py-1 border-b">Team Bonus</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td className="px-2 py-2 border-b">{t.id}</td>
                <td className="px-2 py-2 border-b">{(t.members || []).join(', ')}</td>
                <td className="px-2 py-2 border-b">{selectedLocation?.title ?? t.location_id}</td>
                <td className="px-2 py-2 border-b">{Number(t.team_bonus).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-sm text-gray-500 mt-2">Loading sales team...</div>}
      </div>
    </main>
  )
}
