'use client'

import { useState } from 'react'

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
  nights: number
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
}

type RoomState = 'disponible' | 'ocupada' | 'coliving' | 'limpieza' | 'mantenimiento'

const STATE_STYLES: Record<RoomState, { bg: string; border: string; text: string; sub: string; badge: string }> = {
  disponible:    { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900', sub: 'text-emerald-600', badge: 'bg-emerald-200 text-emerald-800' },
  ocupada:       { bg: 'bg-rose-100',    border: 'border-rose-400',    text: 'text-rose-900',    sub: 'text-rose-500',   badge: 'bg-rose-200 text-rose-800' },
  coliving:      { bg: 'bg-blue-200',    border: 'border-blue-500',    text: 'text-blue-900',    sub: 'text-blue-700',   badge: 'bg-blue-300 text-blue-900' },
  limpieza:      { bg: 'bg-amber-100',   border: 'border-amber-400',   text: 'text-amber-900',   sub: 'text-amber-600',  badge: 'bg-amber-200 text-amber-800' },
  mantenimiento: { bg: 'bg-stone-200',   border: 'border-stone-400',   text: 'text-stone-600',   sub: 'text-stone-500',  badge: 'bg-stone-300 text-stone-600' },
}

const STATE_LABELS: Record<RoomState, string> = {
  disponible:    'Disponible',
  ocupada:       'Ocupada',
  coliving:      'Coliving',
  limpieza:      'En limpieza',
  mantenimiento: 'Mantenimiento',
}

function getRoomState(room: Room, reservation?: Reservation): RoomState {
  if (room.is_permanent_coliving) return 'coliving'
  if (reservation?.modality === 'COLIVING') return 'coliving'
  if (reservation) return 'ocupada'
  return 'disponible'
}

export default function RoomGrid({
  rooms,
  reservations,
}: {
  rooms: Room[]
  reservations: Reservation[]
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)

  const reservationByRoom = new Map(reservations.map(r => [r.room_id, r]))
  const floors = [1, 2, 3, 4]

  const selectedRoom = selectedRoomId ? rooms.find(r => r.id === selectedRoomId) : null
  const selectedReservation = selectedRoomId ? reservationByRoom.get(selectedRoomId) : undefined

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">

      {/* Grid */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col gap-2">
          {floors.map(floor => (
            <div key={floor} className="flex items-stretch gap-2">
              <span className="text-stone-400 text-xs w-8 md:w-12 shrink-0 text-right flex items-center justify-end">{floor}°</span>
              <div className="grid grid-cols-6 gap-1.5 md:gap-2 flex-1">
                {rooms
                  .filter(r => r.floor === floor)
                  .sort((a, b) => a.number.localeCompare(b.number))
                  .map(room => {
                    const reservation = reservationByRoom.get(room.id)
                    const state = getRoomState(room, reservation)
                    const styles = STATE_STYLES[state]
                    const isSelected = selectedRoomId === room.id
                    const guestName = room.is_permanent_coliving
                      ? room.coliving_guest
                      : reservation?.guest_name

                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoomId(isSelected ? null : room.id)}
                        className={`rounded-xl border p-1.5 md:p-3 text-left transition cursor-pointer flex flex-col h-16 md:h-24 overflow-hidden
                          ${styles.bg} ${styles.border}
                          ${isSelected ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-stone-100' : 'hover:brightness-95'}
                        `}
                      >
                        <p className={`text-xs md:text-base font-bold leading-none ${styles.text}`}>{room.number}</p>
                        <p className={`text-[9px] md:text-[10px] mt-0.5 leading-none ${styles.sub} hidden md:block`}>{room.type}</p>
                        {guestName && (
                          <p className={`text-[9px] md:text-[11px] mt-1 leading-tight line-clamp-2 font-medium ${styles.text}`}>
                            {guestName}
                          </p>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex gap-3 mt-6 flex-wrap">
          {(Object.keys(STATE_STYLES) as RoomState[]).map(state => (
            <div key={state} className="flex items-center gap-1.5">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATE_STYLES[state].badge}`}>
                {STATE_LABELS[state]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel lateral */}
      {selectedRoom && (
        <div className="w-full lg:w-72 shrink-0 bg-white border border-stone-200 rounded-xl p-5 shadow-sm overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-stone-900">Hab {selectedRoom.number}</p>
              <p className="text-stone-400 text-sm">{selectedRoom.type}</p>
            </div>
            <button
              onClick={() => setSelectedRoomId(null)}
              className="text-stone-300 hover:text-stone-700 transition text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {(() => {
            const state = getRoomState(selectedRoom, selectedReservation)
            const styles = STATE_STYLES[state]
            return (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles.badge}`}>
                {STATE_LABELS[state]}
              </span>
            )
          })()}

          {selectedRoom.is_permanent_coliving && (
            <div className="mt-4">
              <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Huésped coliving</p>
              <p className="text-stone-800 font-semibold">{selectedRoom.coliving_guest}</p>
              <p className="text-stone-400 text-xs mt-1">Estadía permanente</p>
            </div>
          )}

          {selectedReservation && (
            <div className="mt-4 flex flex-col gap-3">
              <DetailRow label="Huésped"   value={selectedReservation.guest_name} />
              <DetailRow label="Check-in"  value={formatDate(selectedReservation.check_in)} />
              <DetailRow label="Check-out" value={formatDate(selectedReservation.check_out)} />
              <DetailRow label="Noches"    value={String(selectedReservation.nights)} />
              {selectedReservation.agency     && <DetailRow label="Agencia"    value={selectedReservation.agency} />}
              {selectedReservation.pax        && <DetailRow label="PAX"        value={String(selectedReservation.pax)} />}
              {selectedReservation.eta        && <DetailRow label="ETA"        value={selectedReservation.eta} />}
              {selectedReservation.bed_type   && <DetailRow label="Cama"       value={selectedReservation.bed_type} />}
              {selectedReservation.breakfast !== null && (
                <DetailRow label="Desayuno" value={selectedReservation.breakfast ? 'Sí' : 'No'} />
              )}
              {selectedReservation.rate_usd   && <DetailRow label="Tarifa"     value={`$${selectedReservation.rate_usd}`} />}
              {selectedReservation.phone      && <DetailRow label="Teléfono"   value={selectedReservation.phone} />}
              {selectedReservation.notes      && (
                <div>
                  <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Notas</p>
                  <p className="text-stone-600 text-sm">{selectedReservation.notes}</p>
                </div>
              )}
            </div>
          )}

          {!selectedRoom.is_permanent_coliving && !selectedReservation && (
            <div className="mt-4">
              <p className="text-stone-400 text-sm">Sin reserva para esta fecha.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-stone-400 text-xs uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-stone-700 text-sm text-right font-medium">{value}</span>
    </div>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-PY', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}
