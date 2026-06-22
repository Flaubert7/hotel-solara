import { createClient } from '@/lib/supabase/server'
import DateNavigator from '@/components/disposicion/date-navigator'
import RoomGrid from '@/components/disposicion/room-grid'

export default async function DisposicionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = date ?? today

  const supabase = await createClient()

  const [{ data: rooms }, { data: reservations }] = await Promise.all([
    supabase.from('rooms').select('*').order('floor').order('number'),
    supabase
      .from('reservations')
      .select('id, room_id, guest_name, check_in, check_out, nights, agency, pax, eta, bed_type, breakfast, rate_usd, deposit, phone, payment_method, notes, modality')
      .eq('status', 'CONFIRMADO')
      .lte('check_in', selectedDate)
      .gt('check_out', selectedDate),
  ])

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">Disposición</h1>
        <span className="text-stone-400 text-xs">
          {rooms?.length ?? 0} habitaciones · {reservations?.length ?? 0} ocupadas hoy
        </span>
      </div>

      <DateNavigator selectedDate={selectedDate} />

      <RoomGrid
        rooms={rooms ?? []}
        reservations={reservations ?? []}
      />
    </div>
  )
}
