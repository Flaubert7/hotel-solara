'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Room = {
  id: number
  number: string
  floor: number
  type: string
  is_permanent_coliving: boolean
  coliving_guest: string | null
}

type Reservation = {
  id: number
  room_id: number
  guest_name: string
  check_in: string
  check_out: string
  modality: string
}

type RangeMode = 'semana' | 'mes'

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeek(d: Date) {
  const r = new Date(d)
  const day = r.getDay() // 0 = domingo
  r.setDate(r.getDate() - day)
  return r
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInRange(start: Date, mode: RangeMode) {
  if (mode === 'semana') {
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }
  const last = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  return Array.from({ length: last }, (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
}

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const GUEST_COLORS = [
  'bg-sky-100 text-sky-800 border-sky-300',
  'bg-violet-100 text-violet-800 border-violet-300',
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-orange-100 text-orange-800 border-orange-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-teal-100 text-teal-800 border-teal-300',
  'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
]

function colorForGuest(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return GUEST_COLORS[hash % GUEST_COLORS.length]
}

export default function CalendarView({
  rooms,
  reservations,
  anchorDate,
  mode,
}: {
  rooms: Room[]
  reservations: Reservation[]
  anchorDate: string
  mode: RangeMode
}) {
  const router = useRouter()
  const anchor = new Date(anchorDate + 'T12:00:00')
  const today = toISO(new Date())

  const rangeStart = mode === 'semana' ? startOfWeek(anchor) : startOfMonth(anchor)
  const days = daysInRange(rangeStart, mode)

  function navigate(delta: number) {
    const next = mode === 'semana' ? addDays(rangeStart, delta * 7) : new Date(rangeStart.getFullYear(), rangeStart.getMonth() + delta, 1)
    router.push(`/disposicion?view=${mode}&date=${toISO(next)}`)
  }

  function setMode(m: RangeMode) {
    router.push(`/disposicion?view=${m}&date=${anchorDate}`)
  }

  const sortedRooms = [...rooms].sort((a, b) => a.number.localeCompare(b.number))

  // Para cada habitación, calcular los "bloques" de huésped dentro del rango visible
  function blocksForRoom(roomId: number) {
    const relevant = reservations.filter(r => r.room_id === roomId)
    return relevant.map(r => {
      const ci = new Date(r.check_in + 'T12:00:00')
      const co = new Date(r.check_out + 'T12:00:00')
      const startIdx = days.findIndex(d => toISO(d) >= toISO(ci))
      const endIdx = days.findIndex(d => toISO(d) >= toISO(co))
      const from = startIdx === -1 ? 0 : startIdx
      const to = endIdx === -1 ? days.length : endIdx
      return { ...r, from: Math.max(0, from), to: Math.min(days.length, to) }
    }).filter(b => b.to > b.from)
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0">
      {/* Controles */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-stone-700 transition p-1.5 rounded hover:bg-stone-200 cursor-pointer">←</button>
          <span className="text-stone-700 font-semibold text-sm min-w-[160px] text-center">
            {mode === 'semana'
              ? `${days[0].toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })} – ${days[6].toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}`
              : anchor.toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => navigate(1)} className="text-stone-400 hover:text-stone-700 transition p-1.5 rounded hover:bg-stone-200 cursor-pointer">→</button>
        </div>

        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
          {(['semana', 'mes'] as RangeMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                mode === m ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla calendario */}
      <div className="flex-1 overflow-auto rounded-xl border border-stone-200 shadow-sm bg-white">
        <table className="border-collapse w-full" style={{ minWidth: `${120 + days.length * (mode === 'mes' ? 34 : 64)}px` }}>
          <thead>
            <tr className="sticky top-0 z-10 bg-stone-50">
              <th className="sticky left-0 z-20 bg-stone-50 border-b-2 border-r border-stone-300 px-3 py-2 text-left text-xs font-semibold text-stone-500 uppercase">
                Hab
              </th>
              {days.map(d => {
                const iso = toISO(d)
                const isToday = iso === today
                return (
                  <th
                    key={iso}
                    className={`border-b-2 border-stone-300 px-1 py-2 text-[10px] font-medium text-center whitespace-nowrap ${
                      isToday ? 'bg-amber-100 text-amber-800' : 'text-stone-400'
                    }`}
                  >
                    {mode === 'semana' && <div>{WEEKDAYS_ES[d.getDay()]}</div>}
                    <div>{d.getDate()}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRooms.map(room => {
              const blocks = blocksForRoom(room.id)
              const cellWidth = mode === 'mes' ? 34 : 64

              return (
                <tr key={room.id} className="border-b border-stone-100">
                  <td className="sticky left-0 z-10 bg-white border-r border-stone-200 px-3 py-2 text-xs font-bold text-stone-700 whitespace-nowrap">
                    {room.number}
                    {room.is_permanent_coliving && (
                      <div className="text-[9px] text-blue-500 font-normal">{room.coliving_guest}</div>
                    )}
                  </td>
                  <td colSpan={days.length} className="relative p-0" style={{ height: '38px' }}>
                    {room.is_permanent_coliving ? (
                      <div className="absolute inset-0 bg-blue-100 flex items-center px-2">
                        <span className="text-[10px] text-blue-700 font-medium truncate">{room.coliving_guest} (coliving)</span>
                      </div>
                    ) : (
                      blocks.map(b => (
                        <div
                          key={b.id}
                          className={`absolute top-0.5 bottom-0.5 rounded-md border px-1.5 flex items-center overflow-hidden ${colorForGuest(b.guest_name)}`}
                          style={{
                            left: `${b.from * cellWidth}px`,
                            width: `${(b.to - b.from) * cellWidth - 3}px`,
                          }}
                          title={`${b.guest_name} (${b.check_in} → ${b.check_out})`}
                        >
                          <span className="text-[10px] font-medium truncate">{b.guest_name}</span>
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
