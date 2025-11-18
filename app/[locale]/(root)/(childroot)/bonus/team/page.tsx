"use client"

import React, { useEffect, useState, useContext } from 'react'
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'
import { LocationContext } from '@/context/LocationContext'
import supabase from '@/utils/supabaseClient'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function TeamBonusPage() {
  const [loading, setLoading] = useState(false)
  const [calcRunning, setCalcRunning] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const { selectedLocation } = useContext(LocationContext)
  const fetchTeams = async () => {
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

  useEffect(() => {
    fetchTeams()
  }, [selectedLocation])

  return (
    <main className="p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team Bonus</h1>
        <div>
          <button
            className={`px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 rounded ${calcRunning ? 'opacity-60 cursor-wait' : ''}`}
            disabled={calcRunning}
            onClick={async () => {
              setCalcRunning(true)
              try {
                const { data: teamBonusData, error: teamBonusError } = await supabase.rpc('calculate_team_bonus_daily')
                if (teamBonusError) {
                  console.error('RPC calculate_team_bonus_daily error:', teamBonusError)
                  toast.error('Failed to trigger team calculation')
                } else {
                  toast.success('Team calculation triggered')
                  try { await fetchTeams() } catch (_) {}
                }
              } catch (err) {
                console.error('Failed to call RPC calculate_team_bonus_daily:', err)
                toast.error('Failed to trigger team calculation')
              } finally {
                setCalcRunning(false)
              }
            }}
            aria-label="Calculate team bonuses"
            title="Calculate team bonuses"
          >
            {calcRunning ? 'Calculating...' : 'Calculate'}
          </button>
        </div>
      </div>


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
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </main>
  )
}
