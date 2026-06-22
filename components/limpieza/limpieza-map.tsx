'use client'

type RoomInfo = {
  number: string
  floor: number
  type: string
}

type MapReserva = {
  id: number
  rooms: { number: string; type: string } | { number: string; type: string }[] | null
}

type Estado = 'sin_actividad' | 'salida_pendiente' | 'salida_lista' | 'entrada_pendiente' | 'entrada_lista' | 'rotacion'

const ESTADO_STYLES: Record<Estado, { bg: string; border: string; text: string; label: string }> = {
  sin_actividad:   { bg: 'bg-stone-100',   border: 'border-stone-200',   text: 'text-stone-400',  label: 'Sin actividad' },
  salida_pendiente:{ bg: 'bg-amber-100',   border: 'border-amber-400',   text: 'text-amber-900',  label: 'Por limpiar' },
  salida_lista:    { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900',label: 'Limpia' },
  entrada_pendiente:{ bg: 'bg-rose-100',   border: 'border-rose-400',    text: 'text-rose-900',   label: 'Entrada — pendiente' },
  entrada_lista:   { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900',label: 'Lista para entrada' },
  rotacion:        { bg: 'bg-rose-100',    border: 'border-rose-500',    text: 'text-rose-900',   label: 'Rotación urgente' },
}

function getRoomNumber(rooms: MapReserva['rooms']): string | null {
  if (!rooms) return null
  if (Array.isArray(rooms)) return rooms[0]?.number ?? null
  return rooms.number ?? null
}

export default function LimpiezaMap({
  allRooms,
  checkIns,
  checkOuts,
  cleanMap,
}: {
  allRooms: RoomInfo[]
  checkIns: MapReserva[]
  checkOuts: MapReserva[]
  cleanMap: Record<number, boolean>
}) {
  // Construir mapa room_number → estado
  const checkInByRoom = new Map<string, MapReserva>()
  const checkOutByRoom = new Map<string, MapReserva>()

  for (const r of checkIns) {
    const n = getRoomNumber(r.rooms)
    if (n) checkInByRoom.set(n, r)
  }
  for (const r of checkOuts) {
    const n = getRoomNumber(r.rooms)
    if (n) checkOutByRoom.set(n, r)
  }

  function getEstado(roomNumber: string): Estado {
    const ci = checkInByRoom.get(roomNumber)
    const co = checkOutByRoom.get(roomNumber)

    if (ci && co) return 'rotacion'

    if (co) {
      return cleanMap[co.id] ? 'salida_lista' : 'salida_pendiente'
    }
    if (ci) {
      return cleanMap[ci.id] ? 'entrada_lista' : 'entrada_pendiente'
    }
    return 'sin_actividad'
  }

  const floors = [1, 2, 3, 4]

  // Leyenda: solo estados con al menos 1 habitación
  const estadosPresentes = new Set(allRooms.map(r => getEstado(r.number)))
  const leyenda = (Object.keys(ESTADO_STYLES) as Estado[]).filter(e => e !== 'sin_actividad' && estadosPresentes.has(e))

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
      <p className="text-sm font-semibold text-stone-700">Mapa de limpieza</p>

      <div className="flex flex-col gap-2">
        {floors.map(floor => (
          <div key={floor} className="flex items-stretch gap-2">
            <span className="text-stone-400 text-xs w-8 md:w-12 shrink-0 text-right flex items-center justify-end">{floor}°</span>
            <div className="grid grid-cols-6 gap-1.5 md:gap-2 flex-1">
              {allRooms
                .filter(r => r.floor === floor)
                .sort((a, b) => a.number.localeCompare(b.number))
                .map(room => {
                  const estado = getEstado(room.number)
                  const s = ESTADO_STYLES[estado]
                  return (
                    <div
                      key={room.number}
                      title={`Hab ${room.number} — ${s.label}`}
                      className={`rounded-lg border h-10 flex items-center justify-center text-xs md:text-sm font-bold ${s.bg} ${s.border} ${s.text}`}
                    >
                      {room.number}
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      {leyenda.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1 border-t border-stone-100">
          {leyenda.map(e => (
            <div key={e} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border ${ESTADO_STYLES[e].bg} ${ESTADO_STYLES[e].border}`} />
              <span className="text-xs text-stone-500">{ESTADO_STYLES[e].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
