import { createClient } from '@/lib/supabase/server'
import LimpiezaList from '@/components/limpieza/limpieza-list'
import LimpiezaDatePicker from '@/components/limpieza/date-picker'
import LimpiezaMap from '@/components/limpieza/limpieza-map'

export default async function LimpiezaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = date ?? today

  const supabase = await createClient()

  const [
    { data: allRooms },
    { data: checkIns },
    { data: checkOuts },
  ] = await Promise.all([
    supabase.from('rooms').select('number, floor, type').order('floor').order('number'),
    supabase
      .from('reservations')
      .select('id, guest_name, check_in, check_out, nights, eta, pax, breakfast, bed_type, rate_usd, notes, rooms(number, type)')
      .eq('check_in', selectedDate)
      .eq('status', 'CONFIRMADO')
      .order('eta', { ascending: true, nullsFirst: false }),
    supabase
      .from('reservations')
      .select('id, guest_name, check_in, check_out, nights, eta, pax, breakfast, bed_type, rate_usd, notes, rooms(number, type)')
      .eq('check_out', selectedDate)
      .eq('status', 'CONFIRMADO')
      .order('check_in', { ascending: true }),
  ])

  const allIds = [...(checkIns ?? []), ...(checkOuts ?? [])].map(r => r.id)
  const { data: cleaningRecords } = allIds.length > 0
    ? await supabase.from('cleaning').select('reservation_id, is_clean').in('reservation_id', allIds)
    : { data: [] }

  const cleanMap = Object.fromEntries((cleaningRecords ?? []).map(c => [c.reservation_id, c.is_clean]))

  const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PY', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Limpieza</h1>
          <p className="text-stone-400 text-sm capitalize mt-0.5">{displayDate}</p>
        </div>
        <LimpiezaDatePicker selectedDate={selectedDate} today={today} />
      </div>

      <LimpiezaMap
        allRooms={allRooms ?? []}
        checkIns={checkIns ?? []}
        checkOuts={checkOuts ?? []}
        cleanMap={cleanMap}
      />

      <LimpiezaList
        checkIns={checkIns ?? []}
        checkOuts={checkOuts ?? []}
        cleanMap={cleanMap}
        selectedDate={selectedDate}
      />
    </div>
  )
}
