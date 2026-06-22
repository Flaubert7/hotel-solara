'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function listarUsuarios() {
  const admin = createAdminClient()
  const supabase = await createClient()

  const { data: authData } = await admin.auth.admin.listUsers()
  const { data: profiles } = await supabase.from('user_profiles').select('id, role, hotel')

  const roleById = new Map((profiles ?? []).map(p => [p.id, p.role]))

  return authData.users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    role: roleById.get(u.id) ?? 'worker',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }))
}

export async function crearUsuario(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = String(formData.get('role') ?? 'worker')

  if (!email || !password) throw new Error('Correo y contraseña son obligatorios.')
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.')

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (error) throw new Error(error.message)

  const supabase = await createClient()
  await supabase.from('user_profiles').insert({
    id: data.user.id, role, hotel: 'Solara Paraguay',
  })

  revalidatePath('/usuarios')
}

export async function eliminarUsuario(id: string) {
  const admin = createAdminClient()
  const supabase = await createClient()

  await supabase.from('user_profiles').delete().eq('id', id)
  await admin.auth.admin.deleteUser(id)

  revalidatePath('/usuarios')
}

export async function cambiarRol(id: string, role: string) {
  const supabase = await createClient()
  await supabase.from('user_profiles').upsert({ id, role, hotel: 'Solara Paraguay' })
  revalidatePath('/usuarios')
}
