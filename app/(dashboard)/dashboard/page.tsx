import { createClient } from '@/lib/supabase/server'

async function getDashboardStats() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalRooms },
    { data: rooms },
    { data: checkInsHoy },
    { data: checkOutsHoy },
    { data: reservasActivas },
    { data: pagosPendientes },
  ] = await Promise.all([
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase.from('rooms').select('id, is_permanent_coliving'),
    supabase.from('reservations').select('id, guest_name, rooms(number)').eq('check_in', today).eq('status', 'CONFIRMADO'),
    supabase.from('reservations').select('id, guest_name, rooms(number)').eq('check_out', today).eq('status', 'CONFIRMADO'),
    supabase.from('reservations').select('room_id').eq('status', 'CONFIRMADO').lte('check_in', today).gt('check_out', today),
    supabase.from('reservations').select('id, guest_name, rooms(number)').eq('status', 'CONFIRMADO').eq('payment_status', 'PENDIENTE').lte('check_in', today),
  ])

  const colivingCount = rooms?.filter(r => r.is_permanent_coliving).length ?? 0
  const ocupadasIds = new Set(reservasActivas?.map(r => r.room_id) ?? [])
  const ocupadas = ocupadasIds.size
  const total = totalRooms ?? 24
  const disponibles = total - ocupadas - colivingCount
  const ocupacionPct = Math.round(((ocupadas + colivingCount) / total) * 100)

  return {
    total,
    disponibles: Math.max(0, disponibles),
    ocupadas,
    coliving: colivingCount,
    ocupacionPct,
    checkInsHoy: checkInsHoy ?? [],
    checkOutsHoy: checkOutsHoy ?? [],
    pagosPendientes: pagosPendientes ?? [],
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const today = new Date().toLocaleDateString('es-PY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-stone-400 text-sm capitalize mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* Donut principal */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-6 flex flex-col items-center gap-5">
          <DonutChart
            ocupadas={stats.ocupadas}
            coliving={stats.coliving}
            disponibles={stats.disponibles}
            total={stats.total}
            pct={stats.ocupacionPct}
          />
          <div className="flex flex-col gap-2 w-full">
            <LegendRow color="#e11d48" label="Ocupadas"   value={stats.ocupadas}   total={stats.total} />
            <LegendRow color="#2563eb" label="Coliving"   value={stats.coliving}   total={stats.total} />
            <LegendRow color="#059669" label="Disponibles" value={stats.disponibles} total={stats.total} />
          </div>
        </div>

        {/* Check-ins y check-outs */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <ListCard title="Check-ins hoy"  items={stats.checkInsHoy}  emptyMsg="Sin check-ins pendientes"  accent="emerald" />
          <ListCard title="Check-outs hoy" items={stats.checkOutsHoy} emptyMsg="Sin check-outs pendientes" accent="rose" />
        </div>

      </div>

      {stats.pagosPendientes.length > 0 && (
        <div className="mt-4">
          <ListCard title="Pagos pendientes" items={stats.pagosPendientes} emptyMsg="" accent="amber" />
        </div>
      )}
    </div>
  )
}

function DonutChart({
  ocupadas, coliving, disponibles, total, pct
}: {
  ocupadas: number
  coliving: number
  disponibles: number
  total: number
  pct: number
}) {
  const r = 70
  const C = 2 * Math.PI * r
  const gap = 2 // px gap between segments

  const segments = [
    { value: ocupadas,    color: '#e11d48' },
    { value: coliving,    color: '#2563eb' },
    { value: disponibles, color: '#059669' },
  ]

  let offset = 0
  const arcs = segments.map(seg => {
    const frac = total > 0 ? seg.value / total : 0
    const arc = frac * C - gap
    const dashOffset = -offset
    offset += frac * C
    return { ...seg, arc: Math.max(0, arc), dashOffset }
  })

  return (
    <div className="relative">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        {/* Track */}
        <circle cx="90" cy="90" r={r} fill="none" stroke="#f5f4f1" strokeWidth="18" />
        {/* Segments */}
        {arcs.map((seg, i) => (
          <circle
            key={i}
            cx="90" cy="90" r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="18"
            strokeDasharray={`${seg.arc} ${C}`}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-stone-800">{pct}%</span>
        <span className="text-xs text-stone-400">ocupación</span>
      </div>
    </div>
  )
}

function LegendRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span className="text-stone-600 text-sm flex-1">{label}</span>
      <span className="text-stone-800 text-sm font-semibold">{value}</span>
      <span className="text-stone-400 text-xs w-8 text-right">{pct}%</span>
    </div>
  )
}

function ListCard({
  title, items, emptyMsg, accent
}: {
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  emptyMsg: string
  accent: 'emerald' | 'rose' | 'amber'
}) {
  const badge: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose:    'bg-rose-100 text-rose-700',
    amber:   'bg-amber-100 text-amber-700',
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-700">{title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge[accent]}`}>
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-stone-400 text-sm">{emptyMsg}</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-800 font-medium">{item.guest_name}</span>
              <span className="text-stone-400 text-xs bg-stone-100 px-2 py-0.5 rounded-md">
                hab {Array.isArray(item.rooms) ? item.rooms[0]?.number : item.rooms?.number ?? '—'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
