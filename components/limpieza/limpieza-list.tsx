'use client'

import { useTransition } from 'react'
import { toggleClean } from '@/lib/actions/limpieza'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reserva = any

function fmt(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })
}

function Row({ r, isClean, tipo }: { r: Reserva; isClean: boolean; tipo: 'checkin' | 'checkout' }) {
  const [pending, startTransition] = useTransition()
  const roomNumber = Array.isArray(r.rooms) ? r.rooms[0]?.number : r.rooms?.number
  const roomType   = Array.isArray(r.rooms) ? r.rooms[0]?.type   : r.rooms?.type
  const total = r.rate_usd && r.nights ? (r.rate_usd * r.nights).toFixed(2) : null

  return (
    <tr className={`border-b border-stone-100 transition hover:bg-stone-50 ${isClean ? 'opacity-40' : ''}`}>
      <td className="px-4 py-3">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
          tipo === 'checkin'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-orange-100 text-orange-700'
        }`}>
          {tipo === 'checkin' ? 'Check-in' : 'Check-out'}
        </span>
      </td>
      <td className="px-4 py-3 text-stone-800 font-medium whitespace-nowrap">{r.guest_name}</td>
      <td className="px-4 py-3 text-amber-600 font-bold">{roomNumber ?? '—'}</td>
      <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{fmt(r.check_in)}</td>
      <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{fmt(r.check_out)}</td>
      <td className="px-4 py-3 text-stone-400 text-center">{r.nights}</td>
      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{r.eta ?? '—'}</td>
      <td className="px-4 py-3 text-stone-400 text-center">{r.pax ?? '—'}</td>
      <td className="px-4 py-3 text-center">
        {r.breakfast === null ? <span className="text-stone-300">—</span>
          : r.breakfast ? <span className="text-emerald-600 font-medium">Sí</span>
          : <span className="text-stone-400">No</span>}
      </td>
      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{r.bed_type ?? '—'}</td>
      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{roomType ?? '—'}</td>
      <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{r.rate_usd ? `$${r.rate_usd}` : '—'}</td>
      <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{total ? `$${total}` : '—'}</td>
      <td className="px-4 py-3">
        <button
          disabled={pending}
          onClick={() => startTransition(() => toggleClean(r.id, !isClean))}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition cursor-pointer ${
            isClean
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-stone-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
          } ${pending ? 'opacity-50' : ''}`}
        >
          ✓
        </button>
      </td>
    </tr>
  )
}

export default function LimpiezaList({
  checkIns, checkOuts, cleanMap
}: {
  checkIns: Reserva[]
  checkOuts: Reserva[]
  cleanMap: Record<number, boolean>
  selectedDate: string
}) {
  const all = [
    ...checkIns.map(r => ({ r, tipo: 'checkin' as const })),
    ...checkOuts.map(r => ({ r, tipo: 'checkout' as const })),
  ]

  if (all.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-stone-400 text-sm">Sin movimientos para esta fecha.</p>
      </div>
    )
  }

  const COLS = ['Tipo','Huésped','Hab','Entrada','Salida','Noches','ETA','PAX','Desayuno','Cama','Tipo hab','Tarifa','Total','✓']

  return (
    <div className="overflow-auto rounded-xl border border-stone-200 shadow-sm bg-white">
      <table className="w-full text-sm min-w-[1100px]">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            {COLS.map(h => (
              <th key={h} className="text-left text-stone-400 text-xs uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {all.map(({ r, tipo }) => (
            <Row key={`${tipo}-${r.id}`} r={r} isClean={cleanMap[r.id] ?? false} tipo={tipo} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
