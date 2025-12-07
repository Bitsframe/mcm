"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  start?: string | null
  end?: string | null
  onChange: (start: string | null, end: string | null) => void
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }

function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0) }

function formatISO(d: Date) { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10) }

export default function RangeDatePicker({ start, end, onChange }: Props) {
  const [month, setMonth] = useState<Date>(() => start ? new Date(start) : new Date())
  const [selStart, setSelStart] = useState<string | null>(start ?? null)
  const [selEnd, setSelEnd] = useState<string | null>(end ?? null)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => { setSelStart(start ?? null); setSelEnd(end ?? null) }, [start, end])

  // Keep the picker visible inline; no document click listener needed.

  const weeks = useMemo(() => {
    const startM = startOfMonth(month)
    const endM = endOfMonth(month)
    const startDay = startM.getDay() // 0-6
    const days: Array<(Date | null)> = []
    // fill blanks
    for (let i=0;i<startDay;i++) days.push(null)
    for (let d=1; d<=endM.getDate(); d++) days.push(new Date(month.getFullYear(), month.getMonth(), d))
    // group into weeks
    const rows: Array<Array<Date | null>> = []
    for (let i=0;i<days.length;i+=7) rows.push(days.slice(i,i+7))
    return rows
  }, [month])

  const handleDateClick = (d: Date) => {
    const iso = formatISO(d)
    if (!selStart || (selStart && selEnd)) {
      setSelStart(iso)
      setSelEnd(null)
      // don't call onChange yet; wait for end
    } else {
      const s = new Date(selStart)
      if (d.getTime() < s.getTime()) {
        // if second click is before start, make it the new start
        setSelStart(iso)
        setSelEnd(null)
      } else {
        setSelEnd(iso)
        onChange(selStart, iso)
        // keep calendar visible (do not auto-close)
      }
    }
  }

  const isInRange = (d: Date) => {
    if (!selStart) return false
    const s = new Date(selStart)
    if (!selEnd) return d.getTime() === s.getTime()
    const e = new Date(selEnd)
    return d.getTime() >= s.getTime() && d.getTime() <= e.getTime()
  }

  const displayLabel = selStart ? (selEnd ? `${selStart} → ${selEnd}` : `${selStart}`) : ''

  return (
    <div className="relative inline-block" ref={ref}>
      <div className="w-full text-left">
        {displayLabel ? <div className="text-sm text-gray-700 truncate mb-2">{displayLabel}</div> : null}
      </div>
      <div className="bg-white p-4 rounded shadow border w-72">
        <div className="flex items-center justify-between mb-3">
          <button className="px-3 py-1.5 text-base" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}>‹</button>
          <div className="text-base font-semibold">{month.toLocaleString(undefined,{ month: 'long', year: 'numeric' })}</div>
          <button className="px-3 py-1.5 text-base" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}>›</button>
        </div>
          <div className="grid grid-cols-7 gap-2 text-sm text-center text-gray-500">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=> <div key={d}>{d}</div>)}
        </div>
          <div className="mt-3">
          {weeks.map((week, i) => (
            <div key={i} className="grid grid-cols-7 gap-2">
              {week.map((cell, idx) => (
                  <div key={idx} className="h-10">
                    {cell ? (
                      <button
                        type="button"
                        onClick={() => handleDateClick(cell)}
                        className={`w-full h-10 rounded ${isInRange(cell) ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'} flex items-center justify-center`}
                      >
                        <span className="text-base">{cell.getDate()}</span>
                      </button>
                    ) : <div />}
                  </div>
              ))}
            </div>
          ))}
        </div>
        {/* Footer buttons removed: selection is applied immediately when end date is chosen */}
      </div>
    </div>
  )
}
