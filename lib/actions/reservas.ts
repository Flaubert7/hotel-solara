'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function habitacionesDisponibles(checkIn: string, checkOut: string) {
  const supabase = await createClient()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, number, floor, type')
    .eq('is_permanent_coliving', false)
    .order('floor')
    .order('number')

  if (!checkIn || !checkOut) return rooms ?? []

  const { data: conflicts } = await supabase
    .from('reservations')
    .select('room_id')
    .eq('status', 'CONFIRMADO')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)

  const ocupadas = new Set((conflicts ?? []).map(c => c.room_id))
  return (rooms ?? []).filter(r => !ocupadas.has(r.id))
}

export async function crearReserva(formData: FormData) {
  const supabase = await createClient()

  const room_id        = Number(formData.get('room_id'))
  const guest_name     = String(formData.get('guest_name') ?? '').trim().toUpperCase()
  const check_in       = String(formData.get('check_in') ?? '')
  const check_out      = String(formData.get('check_out') ?? '')
  const modality       = String(formData.get('modality') ?? 'HOTELERIA')
  const agency         = String(formData.get('agency') ?? '').trim() || null
  const pax            = Number(formData.get('pax')) || null
  const eta            = String(formData.get('eta') ?? '').trim() || null
  const bed_type       = String(formData.get('bed_type') ?? '').trim() || null
  const breakfast_raw  = formData.get('breakfast')
  const breakfast      = breakfast_raw === 'true' ? true : breakfast_raw === 'false' ? false : null
  const rate_usd       = Number(formData.get('rate_usd')) || null
  const deposit        = Number(formData.get('deposit')) || null
  const phone          = String(formData.get('phone') ?? '').trim() || null
  const payment_method = String(formData.get('payment_method') ?? '').trim() || null
  const notes          = String(formData.get('notes') ?? '').trim() || null

  function fail(msg: string) {
    redirect(`/reservas/nueva?error=${encodeURIComponent(msg)}`)
  }

  if (!guest_name) fail('El nombre del huésped es obligatorio.')
  if (!room_id)   fail('Seleccioná una habitación.')
  if (!check_in)  fail('La fecha de entrada es obligatoria.')
  if (!check_out) fail('La fecha de salida es obligatoria.')

  const nights = Math.round(
    (new Date(check_out).getTime() - new Date(check_in).getTime()) / 86400000
  )
  if (nights <= 0) fail('La fecha de salida debe ser posterior a la entrada.')

  // La habitación no puede ser coliving permanente
  const { data: room } = await supabase
    .from('rooms')
    .select('is_permanent_coliving, number')
    .eq('id', room_id)
    .single()

  if (room?.is_permanent_coliving) {
    fail(`La habitación ${room.number} es coliving permanente y no puede reservarse.`)
  }

  // Verificar disponibilidad — sin solapamiento
  const { data: conflicts } = await supabase
    .from('reservations')
    .select('id')
    .eq('room_id', room_id)
    .eq('status', 'CONFIRMADO')
    .lt('check_in', check_out)
    .gt('check_out', check_in)

  if (conflicts && conflicts.length > 0) {
    fail('La habitación ya tiene una reserva confirmada en ese período.')
  }

  // Insertar reserva
  const { data: res, error: resErr } = await supabase
    .from('reservations')
    .insert({
      room_id, guest_name, check_in, check_out, nights,
      status: 'CONFIRMADO', modality,
      agency, pax, eta, bed_type, breakfast,
      rate_usd, deposit, phone, payment_method, notes,
    })
    .select('id')
    .single()

  if (resErr || !res) fail('Error al guardar la reserva. Intentá de nuevo.')

  // Insertar registro de limpieza
  await supabase.from('cleaning').insert({
    reservation_id:  res!.id,
    room_id,
    guest_name,
    check_in_date:  check_in,
    check_out_date: check_out,
    nights,
    eta, pax, breakfast, bed_type,
    is_clean: false,
  })

  revalidatePath('/reservas')
  revalidatePath('/disposicion')
  revalidatePath('/limpieza')
  revalidatePath('/dashboard')
  redirect('/reservas')
}

export async function marcarPago(formData: FormData) {
  const supabase = await createClient()

  const id              = Number(formData.get('id'))
  const payment_status  = String(formData.get('payment_status') ?? 'PENDIENTE')
  const invoice_number  = String(formData.get('invoice_number') ?? '').trim() || null
  const paid_amount_usd = Number(formData.get('paid_amount_usd')) || null
  const forma_pago      = String(formData.get('forma_pago') ?? '').trim() || null

  const { data: reserva } = await supabase
    .from('reservations')
    .select('guest_name, check_in, caja_ingreso_id')
    .eq('id', id)
    .single()

  if (!reserva) return

  if (payment_status === 'PAGADO') {
    const mes = reserva.check_in.slice(0, 7)
    const ingresoRec = {
      fecha: reserva.check_in,
      mes,
      categoria: 'RESERVA',
      nombre: reserva.guest_name,
      detalle: invoice_number ? `FACTURA ${invoice_number}` : null,
      forma_pago,
      monto_usd: paid_amount_usd ?? 0,
      monto_gs: 0,
      nro_cbte: invoice_number,
    }

    let caja_ingreso_id = reserva.caja_ingreso_id
    if (caja_ingreso_id) {
      await supabase.from('caja_ingresos').update(ingresoRec).eq('id', caja_ingreso_id)
    } else {
      const { data: ingreso } = await supabase
        .from('caja_ingresos')
        .insert(ingresoRec)
        .select('id')
        .single()
      caja_ingreso_id = ingreso?.id ?? null
    }

    await supabase
      .from('reservations')
      .update({ payment_status, invoice_number, paid_amount_usd, caja_ingreso_id })
      .eq('id', id)
  } else {
    // Volver a pendiente: si había un ingreso generado, se borra de Caja
    if (reserva.caja_ingreso_id) {
      await supabase.from('caja_ingresos').delete().eq('id', reserva.caja_ingreso_id)
    }
    await supabase
      .from('reservations')
      .update({ payment_status: 'PENDIENTE', invoice_number: null, paid_amount_usd: null, caja_ingreso_id: null })
      .eq('id', id)
  }

  revalidatePath('/reservas')
  revalidatePath('/cajas')
  revalidatePath('/dashboard')
}

export async function cancelarReserva(id: number) {
  const supabase = await createClient()

  await supabase
    .from('reservations')
    .update({ status: 'CANCELADO' })
    .eq('id', id)

  revalidatePath('/reservas')
  revalidatePath('/disposicion')
  revalidatePath('/dashboard')
}

export async function borrarReserva(id: number) {
  const supabase = await createClient()

  await supabase.from('cleaning').delete().eq('reservation_id', id)
  await supabase.from('reservations').delete().eq('id', id)

  revalidatePath('/reservas')
  revalidatePath('/disposicion')
  revalidatePath('/limpieza')
  revalidatePath('/dashboard')
}
