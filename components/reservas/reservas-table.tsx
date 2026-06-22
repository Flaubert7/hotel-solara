'use client'

import { useTransition } from 'react'
import { cancelarReserva, borrarReserva } from '@/lib/actions/reservas'

type Reservation = {
  id: number
  guest_name: string
  check_in: string
  check_out: string
  nights: number
  status: string
  agency: string | null
  pax: number | null
  eta: string | null
  bed_type: string | null
  breakfast: boolean | null
  rate_usd: number | null
  deposit: number | null
  phone: string | null
  payment_method: string | null
  notes: string | null
  modality: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rooms: any
}

function fmt(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit'
  })
}

function CancelarBtn({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm('¿Cancelar esta reserva?')) {
          startTransition(() => cancelarReserva(id))
        }
      }}
      className="text-xs text-stone-400 hover:text-amber-600 transition cursor-pointer disabled:opacity-40"
    >
      {pending ? '…' : 'Cancelar'}
    </button>
  )
}

function BorrarBtn({ id }: { id: number }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm('¿Borrar esta reserva definitivamente? No se puede deshacer.')) {
          startTransition(() => borrarReserva(id))
        }
      }}
      className="text-xs text-stone-400 hover:text-rose-600 transition cursor-pointer disabled:opacity-40"
    >
      {pending ? '…' : 'Borrar'}
    </button>
  )
}


export default function ReservasTable({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Sin reservas para este período.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto rounded-xl border border-stone-200 shadow-sm bg-white">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b-2 border-stone-300 bg-stone-50 sticky top-0 z-10 shadow-sm">
            {['Hab','Huésped','Entrada','Salida','Noches','Agencia','PAX','ETA','Cama','Desayuno','Tarifa','Estado',''].map(h => (
              <th key={h} className="text-left text-stone-400 text-xs uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reservations.map((r, i) => {
            const roomNumber = Array.isArray(r.rooms) ? r.rooms[0]?.number : r.rooms?.number
            const isConfirmed = r.status === 'CONFIRMADO'
            return (
              <tr
                key={r.id}
                className={`border-b border-stone-100 hover:bg-stone-50 transition ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}
              >
                <td className="px-4 py-3 text-amber-600 font-bold whitespace-nowrap">{roomNumber ?? '—'}</td>
                <td className="px-4 py-3 text-stone-800 font-medium whitespace-nowrap">{r.guest_name}</td>
                <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{fmt(r.check_in)}</td>
                <td className="px-4 py-3 text-stone-600 whitespace-nowrap">{fmt(r.check_out)}</td>
                <td className="px-4 py-3 text-stone-400 text-center">{r.nights}</td>
                <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{r.agency ?? '—'}</td>
                <td className="px-4 py-3 text-stone-400 text-center">{r.pax ?? '—'}</td>
                <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{r.eta ?? '—'}</td>
                <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{r.bed_type ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  {r.breakfast === null ? (
                    <span className="text-stone-300">—</span>
                  ) : r.breakfast ? (
                    <span className="text-emerald-600 font-medium">Sí</span>
                  ) : (
                    <span className="text-stone-400">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600 whitespace-nowrap">
                  {r.rate_usd ? `$${r.rate_usd}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                    isConfirmed
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-rose-100 text-rose-600'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {isConfirmed && <CancelarBtn id={r.id} />}
                    <BorrarBtn id={r.id} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
