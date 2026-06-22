'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/require-admin'

export async function agregarIngreso(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const mes = formData.get('mes') as string
  const fecha = formData.get('fecha') as string
  const categoria = (formData.get('categoria') as string)?.toUpperCase() || null
  const nombre = (formData.get('nombre') as string)?.toUpperCase() || null
  const detalle = (formData.get('detalle') as string)?.toUpperCase() || null
  const forma_pago = formData.get('forma_pago') as string || null
  const monto_gs = parseFloat(formData.get('monto_gs') as string) || 0
  const monto_usd = parseFloat(formData.get('monto_usd') as string) || 0
  const nro_cbte = formData.get('nro_cbte') as string || null

  if (!fecha || !mes) throw new Error('Fecha y mes son requeridos')

  const { error } = await supabase.from('caja_ingresos').insert({
    fecha, categoria, nombre, detalle, forma_pago, monto_gs, monto_usd, nro_cbte, mes
  })
  if (error) throw new Error(error.message)

  revalidatePath('/reportes')
}

export async function agregarEgreso(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const mes = formData.get('mes') as string
  const fecha = formData.get('fecha') as string
  const nro_recibo = formData.get('nro_recibo') as string || null
  const nro_factura = formData.get('nro_factura') as string || null
  const detalle = (formData.get('detalle') as string)?.toUpperCase() || null
  const monto_gs = parseFloat(formData.get('monto_gs') as string) || 0
  const monto_usd = parseFloat(formData.get('monto_usd') as string) || 0

  if (!fecha || !mes) throw new Error('Fecha y mes son requeridos')

  const { error } = await supabase.from('caja_egresos').insert({
    fecha, nro_recibo, nro_factura, detalle, monto_gs, monto_usd, mes
  })
  if (error) throw new Error(error.message)

  revalidatePath('/reportes')
}

export async function agregarRetiro(formData: FormData) {
  await requireAdmin()
  const supabase = await createClient()

  const mes = formData.get('mes') as string
  const fecha = formData.get('fecha') as string
  const retiro_gs = parseFloat(formData.get('retiro_gs') as string) || 0
  const retiro_usd = parseFloat(formData.get('retiro_usd') as string) || 0
  const descripcion = (formData.get('descripcion') as string)?.toUpperCase() || null

  if (!fecha || !mes) throw new Error('Fecha y mes son requeridos')

  const { error } = await supabase.from('caja_administracion').insert({
    fecha, retiro_gs, retiro_usd, descripcion, mes
  })
  if (error) throw new Error(error.message)

  revalidatePath('/reportes')
}

export async function borrarIngreso(id: number) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('caja_ingresos').delete().eq('id', id)
  revalidatePath('/reportes')
}

export async function borrarEgreso(id: number) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('caja_egresos').delete().eq('id', id)
  revalidatePath('/reportes')
}

export async function borrarRetiro(id: number) {
  await requireAdmin()
  const supabase = await createClient()
  await supabase.from('caja_administracion').delete().eq('id', id)
  revalidatePath('/reportes')
}
