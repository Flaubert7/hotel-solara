import { createClient } from '@/lib/supabase/server'
import DateNavigator from '@/components/disposicion/date-navigator'
import RoomGrid from '@/components/disposicion/room-grid'
import CalendarView from '@/components/disposicion/calendar-view'
import ViewToggle from '@/components/disposicion/view-toggle'

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

function startOfWeek(d: Date) {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  return r
}

export default async function DisposicionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>
}) {
  const { date, view } = await searchParams
  const today = toISO(new Date())
  const selectedDate = date ?? today
  const viewMode = view === 'semana' || view === 'mes' ? view : 'dia'

  const supabase = await createClient()

  let rangeStart = selectedDate
  let rangeEnd = selectedDate

  if (viewMode === 'semana') {
    const anchor = new Date(selectedDate + 'T12:00:00')
    const start = startOfWeek(anchor)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    rangeStart = toISO(start)
    rangeEnd = toISO(end)
  } else if (viewMode === 'mes') {
    const anchor = new Date(selectedDate + 'T12:00:00')
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    rangeStart = toISO(start)
    rangeEnd = toISO(end)
  }

  const { data: rooms } = await supabase.from('rooms').select('*').order('floor').order('number')

  const reservationsDia = viewMode === 'dia'
    ? (await supabase
        .from('reservations')
        .select('id, room_id, guest_name, check_in, check_out, nights, agency, pax, eta, bed_type, breakfast, rate_usd, deposit, phone, payment_method, notes, modality')
        .eq('status', 'CONFIRMADO')
        .lte('check_in', selectedDate)
        .gt('check_out', selectedDate)).data
    : null

  const reservationsRango = viewMode !== 'dia'
    ? (await supabase
        .from('reservations')
        .select('id, room_id, guest_name, check_in, check_out, modality')
        .eq('status', 'CONFIRMADO')
        .lte('check_in', rangeEnd)
        .gt('check_out', rangeStart)).data
    : null

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-stone-900">Disposición</h1>
        <div className="flex items-center gap-3">
          <span className="text-stone-400 text-xs">
            {rooms?.length ?? 0} habitaciones{viewMode === 'dia' ? ` · ${reservationsDia?.length ?? 0} ocupadas hoy` : ''}
          </span>
          <ViewToggle current={viewMode} selectedDate={selectedDate} />
        </div>
      </div>

      {viewMode === 'dia' ? (
        <>
          <DateNavigator selectedDate={selectedDate} />
          <RoomGrid
            rooms={rooms ?? []}
            reservations={reservationsDia ?? []}
          />
        </>
      ) : (
        <CalendarView
          rooms={rooms ?? []}
          reservations={reservationsRango ?? []}
          anchorDate={selectedDate}
          mode={viewMode}
        />
      )}
    </div>
  )
}
