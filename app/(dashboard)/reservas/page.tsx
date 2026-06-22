import { createClient } from '@/lib/supabase/server'
import ReservasTable from '@/components/reservas/reservas-table'
import ReservasFiltros from '@/components/reservas/reservas-filtros'

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; status?: string; agency?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const monthStr = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = monthStr.split('-').map(Number)

  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay  = new Date(year, month, 0).toISOString().split('T')[0]

  const supabase = await createClient()

  let query = supabase
    .from('reservations')
    .select('*, rooms(number, type)')
    .gte('check_in', firstDay)
    .lte('check_in', lastDay)
    .order('check_in', { ascending: true })

  if (params.status) query = query.eq('status', params.status)
  if (params.agency) query = query.eq('agency', params.agency)

  const { data: reservations } = await query

  const prevMonth = new Date(year, month - 2, 1)
  const nextMonth = new Date(year, month, 1)
  const prevStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`
  const nextStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">Reservas</h1>

        {/* Navegación de mes */}
        <div className="flex items-center gap-2">
          <a href={`/reservas?month=${prevStr}`} className="text-stone-400 hover:text-stone-700 transition px-2 py-1 rounded hover:bg-stone-200 text-sm">←</a>
          <span className="text-stone-700 font-semibold text-sm min-w-[150px] text-center">
            {MONTHS_ES[month - 1]} {year}
          </span>
          <a href={`/reservas?month=${nextStr}`} className="text-stone-400 hover:text-stone-700 transition px-2 py-1 rounded hover:bg-stone-200 text-sm">→</a>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-stone-400 text-xs">{reservations?.length ?? 0} reservas</span>
          <a
            href="/reservas/nueva"
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nueva reserva
          </a>
        </div>
      </div>

      <ReservasFiltros currentStatus={params.status} currentAgency={params.agency} monthStr={monthStr} />

      <ReservasTable reservations={reservations ?? []} />
    </div>
  )
}
