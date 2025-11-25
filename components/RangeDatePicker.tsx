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
  const [visible, setVisible] = useState(false)
  const [month, setMonth] = useState<Date>(() => start ? new Date(start) : new Date())
  const [selStart, setSelStart] = useState<string | null>(start ?? null)
  const [selEnd, setSelEnd] = useState<string | null>(end ?? null)
  const ref = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties | undefined>(undefined)

  useEffect(() => { setSelStart(start ?? null); setSelEnd(end ?? null) }, [start, end])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!(e.target instanceof Node)) return
      if (ref.current && ref.current.contains(e.target as Node)) return
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return
      setVisible(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

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
        setVisible(false)
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
      <button ref={buttonRef} type="button" className="w-full text-left border p-2 rounded bg-white flex items-center justify-between" onClick={() => {
        // compute popup position to avoid being clipped by modal overflow
        const btn = buttonRef.current
        if (btn) {
          const r = btn.getBoundingClientRect()
          const left = Math.max(8, r.left)
          const top = r.bottom + 8
          setPopupStyle({ position: 'fixed', left: `${left}px`, top: `${top}px`, minWidth: `${Math.max(240, r.width)}px`, zIndex: 9999 })
        }
        setVisible(v => !v)
      }}>
        <div className="text-sm text-gray-700 truncate">{displayLabel || 'Select date range'}</div>
        <div className="ml-2 text-gray-400">▾</div>
      </button>
      {visible && (
        <div ref={ref} style={popupStyle} className="bg-white p-3 rounded shadow-2xl border">
          <div className="flex items-center justify-between mb-2">
            <button className="px-2 py-1 text-sm" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}>‹</button>
            <div className="text-sm font-semibold">{month.toLocaleString(undefined,{ month: 'long', year: 'numeric' })}</div>
            <button className="px-2 py-1 text-sm" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=> <div key={d}>{d}</div>)}
          </div>
          <div className="mt-2">
            {weeks.map((week, i) => (
              <div key={i} className="grid grid-cols-7 gap-1">
                {week.map((cell, idx) => (
                  <div key={idx} className="h-8">
                    {cell ? (
                        <button
                        type="button"
                        onClick={() => handleDateClick(cell)}
                        className={`w-full h-8 rounded ${isInRange(cell) ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'} flex items-center justify-center`}
                      >
                        <span className="text-sm">{cell.getDate()}</span>
                      </button>
                    ) : <div />}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => { setVisible(false); setSelStart(start ?? null); setSelEnd(end ?? null) }}>Cancel</button>
            <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => { onChange(selStart, selEnd); setVisible(false) }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}
