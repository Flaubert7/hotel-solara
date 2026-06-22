'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function registrarMovimiento(
  itemId: number,
  type: 'intake' | 'output',
  qty: number,
  date: string
) {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('inventory_items')
    .select('initial_stock')
    .eq('id', itemId)
    .single()

  const { data: existing } = await supabase
    .from('inventory_records')
    .select('*')
    .eq('item_id', itemId)
    .eq('date', date)
    .single()

  if (existing) {
    const newIntake = existing.intake + (type === 'intake' ? qty : 0)
    const newOutput = existing.output + (type === 'output' ? qty : 0)
    const newStock  = Math.max(0, existing.stock + (type === 'intake' ? qty : -qty))

    await supabase
      .from('inventory_records')
      .update({ intake: newIntake, output: newOutput, stock: newStock })
      .eq('id', existing.id)
  } else {
    const baseStock = item?.initial_stock ?? 0
    const newStock  = Math.max(0, baseStock + (type === 'intake' ? qty : -qty))

    await supabase.from('inventory_records').insert({
      item_id: itemId,
      date,
      intake: type === 'intake' ? qty : 0,
      output: type === 'output' ? qty : 0,
      stock: newStock,
    })
  }

  revalidatePath('/inventario')
}
