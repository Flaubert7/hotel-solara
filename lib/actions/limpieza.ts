'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleClean(reservationId: number, isClean: boolean) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('cleaning')
    .select('id')
    .eq('reservation_id', reservationId)
    .single()

  if (existing) {
    await supabase
      .from('cleaning')
      .update({ is_clean: isClean })
      .eq('reservation_id', reservationId)
  } else {
    const { data: res } = await supabase
      .from('reservations')
      .select('room_id, guest_name, check_in, check_out, nights, eta, pax, breakfast, bed_type, rate_usd, rooms(type)')
      .eq('id', reservationId)
      .single()

    if (res) {
      const roomType = Array.isArray(res.rooms) ? res.rooms[0]?.type : (res.rooms as { type: string } | null)?.type
      await supabase.from('cleaning').insert({
        reservation_id: reservationId,
        room_id: res.room_id,
        guest_name: res.guest_name,
        check_in_date: res.check_in,
        check_out_date: res.check_out,
        nights: res.nights,
        eta: res.eta,
        pax: res.pax,
        breakfast: res.breakfast,
        bed_type: res.bed_type,
        room_type: roomType ?? null,
        rate_usd: res.rate_usd,
        total_usd: res.rate_usd && res.nights ? res.rate_usd * res.nights : null,
        is_clean: isClean,
      })
    }
  }

  revalidatePath('/limpieza')
}
