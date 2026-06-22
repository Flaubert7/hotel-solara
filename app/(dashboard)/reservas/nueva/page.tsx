import { createClient } from '@/lib/supabase/server'
import NuevaReservaForm from '@/components/reservas/nueva-reserva-form'

export default async function NuevaReservaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, number, floor, type, is_permanent_coliving')
    .eq('is_permanent_coliving', false)
    .order('floor')
    .order('number')

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <a href="/reservas" className="text-stone-400 hover:text-stone-600 transition text-sm">
            ← Reservas
          </a>
        </div>
        <h1 className="text-2xl font-semibold text-stone-900">Nueva reserva</h1>
        <p className="text-stone-400 text-sm mt-1">Los campos marcados con * son obligatorios.</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-8">
        <NuevaReservaForm
          rooms={rooms ?? []}
          error={error}
        />
      </div>
    </div>
  )
}
