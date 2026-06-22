'use client'

import { useState, useTransition } from 'react'
import { cancelarReserva, borrarReserva, marcarPago } from '@/lib/actions/reservas'

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
  payment_status: string | null
  invoice_number: string | null
  paid_amount_usd: number | null
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

const inp = 'border border-stone-200 rounded-lg px-2 py-1.5 text-sm w-full'

function PagoBadge({ r }: { r: Reservation }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const isPagado = r.payment_status === 'PAGADO'

  if (open) {
    return (
      <div className="absolute z-20 mt-1 right-0 bg-white border border-stone-200 rounded-xl shadow-lg p-4 w-72">
        <form
          onSubmit={e => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            fd.set('id', String(r.id))
            fd.set('payment_status', 'PAGADO')
            startTransition(async () => { await marcarPago(fd); setOpen(false) })
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-xs font-semibold text-stone-600 uppercase tracking-wide">Marcar como pagado</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">Monto pagado (USD)</label>
            <input name="paid_amount_usd" type="number" step="0.01" defaultValue={r.paid_amount_usd ?? r.rate_usd ?? ''} className={inp} autoFocus />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">Nro. de factura</label>
            <input name="invoice_number" type="text" defaultValue={r.invoice_number ?? ''} className={inp} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-stone-500">Forma de pago</label>
            <select name="forma_pago" className={inp} defaultValue="">
              <option value="">—</option>
              {['EFECTIVO','TRANSFERENCIA','TARJETA','QR'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
              {pending ? 'Guardando…' : 'Confirmar pago'}
            </button>
          </div>
          {isPagado && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm('¿Marcar como pendiente otra vez? Esto elimina el ingreso generado en Caja.')) {
                  const fd = new FormData()
                  fd.set('id', String(r.id))
                  fd.set('payment_status', 'PENDIENTE')
                  startTransition(async () => { await marcarPago(fd); setOpen(false) })
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-700 cursor-pointer self-start"
            >
              Volver a pendiente
            </button>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(true)}
        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap cursor-pointer transition ${
          isPagado
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
        }`}
        title={r.invoice_number ? `Factura ${r.invoice_number}` : undefined}
      >
        {isPagado ? 'Pagado' : 'Pendiente'}
      </button>
    </div>
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
      <table className="w-full text-sm min-w-[980px]">
        <thead>
          <tr className="border-b-2 border-stone-300 bg-stone-50 sticky top-0 z-10 shadow-sm">
            {['Hab','Huésped','Entrada','Salida','Noches','Agencia','PAX','ETA','Cama','Desayuno','Tarifa','Pago','Estado',''].map(h => (
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
                <td className="px-4 py-3"><PagoBadge r={r} /></td>
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
