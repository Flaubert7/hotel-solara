import { createClient } from '@/lib/supabase/server'
import InventarioGrid from '@/components/inventario/inventario-grid'

export default async function InventarioPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .order('category')
    .order('name')

  // Último registro de stock por item
  const { data: records } = await supabase
    .from('inventory_records')
    .select('item_id, stock, intake, output, date')
    .eq('date', today)

  const todayMap = new Map((records ?? []).map(r => [r.item_id, r]))

  // Stock calculado: si no hay registro hoy, usar initial_stock
  const itemsWithStock = (items ?? []).map(item => ({
    ...item,
    todayRecord: todayMap.get(item.id) ?? null,
    currentStock: todayMap.get(item.id)?.stock ?? item.initial_stock ?? 0,
  }))

  const limpieza = itemsWithStock.filter(i => i.category === 'LIMPIEZA')
  const activos  = itemsWithStock.filter(i => i.category === 'ACTIVOS')

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Inventario</h1>
        <p className="text-stone-400 text-sm mt-0.5">Stock del día — {new Date(today + 'T12:00:00').toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {items?.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-stone-400 text-sm">Sin items en inventario. Se poblarán al migrar el Excel.</p>
        </div>
      ) : (
        <>
          {limpieza.length > 0 && (
            <section>
              <h2 className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-3">Insumos de limpieza</h2>
              <InventarioGrid items={limpieza} today={today} />
            </section>
          )}
          {activos.length > 0 && (
            <section>
              <h2 className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-3">Activos</h2>
              <InventarioGrid items={activos} today={today} />
            </section>
          )}
        </>
      )}
    </div>
  )
}
