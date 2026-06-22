'use client'

import { useState, useTransition } from 'react'
import { crearReserva } from '@/lib/actions/reservas'

type Room = { id: number; number: string; floor: number; type: string }

const AGENCIAS = ['Booking', 'Airbnb', 'WhatsApp', 'Directo', 'Instagram', 'TikTok']
const CAMAS    = ['MATRIMONIAL', 'INDIVIDUALES']

export default function NuevaReservaForm({
  rooms,
  error,
  unavailableRoomIds = [],
}: {
  rooms: Room[]
  error?: string
  unavailableRoomIds?: number[]
}) {
  const [isPending, startTransition] = useTransition()
  const [checkIn,  setCheckIn]  = useState('')
  const [checkOut, setCheckOut] = useState('')

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0

  const availableRooms = rooms.filter(r => !unavailableRoomIds.includes(r.id))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => crearReserva(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Fila principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <Field label="Nombre del huésped *">
          <input
            name="guest_name"
            required
            placeholder="NOMBRE APELLIDO"
            onChange={e => e.target.value = e.target.value.toUpperCase()}
            className={INPUT}
          />
        </Field>

        <Field label="Habitación *">
          <select name="room_id" required className={INPUT}>
            <option value="">Seleccionar habitación…</option>
            {[1, 2, 3, 4].map(floor => (
              <optgroup key={floor} label={`Piso ${floor}`}>
                {availableRooms
                  .filter(r => r.floor === floor)
                  .sort((a, b) => a.number.localeCompare(b.number))
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.number} — {r.type}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="Check-in *">
          <input
            name="check_in"
            type="date"
            required
            value={checkIn}
            onChange={e => setCheckIn(e.target.value)}
            className={INPUT}
          />
        </Field>

        <Field label="Check-out *">
          <input
            name="check_out"
            type="date"
            required
            value={checkOut}
            min={checkIn || undefined}
            onChange={e => setCheckOut(e.target.value)}
            className={INPUT}
          />
        </Field>

      </div>

      {/* Noches calculadas */}
      {nights > 0 && (
        <p className="text-sm text-stone-500 -mt-2">
          <span className="font-semibold text-stone-700">{nights}</span> {nights === 1 ? 'noche' : 'noches'}
        </p>
      )}

      <div className="border-t border-stone-100" />

      {/* Detalles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <Field label="Modalidad">
          <select name="modality" defaultValue="HOTELERIA" className={INPUT}>
            <option value="HOTELERIA">Hotelería</option>
            <option value="COLIVING">Coliving</option>
          </select>
        </Field>

        <Field label="Agencia">
          <select name="agency" className={INPUT}>
            <option value="">Sin agencia</option>
            {AGENCIAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>

        <Field label="PAX">
          <input name="pax" type="number" min={1} max={10} placeholder="1" className={INPUT} />
        </Field>

        <Field label="ETA (hora llegada)">
          <input name="eta" type="time" className={INPUT} />
        </Field>

        <Field label="Tipo de cama">
          <select name="bed_type" className={INPUT}>
            <option value="">Sin especificar</option>
            {CAMAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Desayuno">
          <select name="breakfast" className={INPUT}>
            <option value="">Sin especificar</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </Field>

        <Field label="Tarifa (USD/noche)">
          <input name="rate_usd" type="number" min={0} step="0.01" placeholder="0.00" className={INPUT} />
        </Field>

        <Field label="Depósito (USD)">
          <input name="deposit" type="number" min={0} step="0.01" placeholder="0.00" className={INPUT} />
        </Field>

        <Field label="Teléfono">
          <input name="phone" type="tel" placeholder="+595 9xx xxx xxx" className={INPUT} />
        </Field>

        <Field label="Método de pago">
          <input name="payment_method" placeholder="Efectivo, transferencia…" className={INPUT} />
        </Field>

      </div>

      <Field label="Notas">
        <textarea
          name="notes"
          rows={3}
          placeholder="Observaciones adicionales…"
          className={`${INPUT} resize-none`}
        />
      </Field>

      {/* Acciones */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition cursor-pointer"
        >
          {isPending ? 'Guardando…' : 'Confirmar reserva'}
        </button>
        <a
          href="/reservas"
          className="text-stone-500 hover:text-stone-700 text-sm transition"
        >
          Cancelar
        </a>
      </div>

    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-stone-600 text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'bg-stone-50 border border-stone-200 text-stone-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition w-full placeholder:text-stone-300'
