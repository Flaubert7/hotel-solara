'use client'

import { useState, useTransition } from 'react'
import { crearUsuario, eliminarUsuario, cambiarRol } from '@/lib/actions/usuarios'

type Usuario = {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in_at: string | null
}

const INPUT = 'bg-stone-50 border border-stone-200 text-stone-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition w-full placeholder:text-stone-300'

function fmtFecha(d: string | null) {
  if (!d) return 'Nunca'
  return new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function RoleSelect({ id, role }: { id: string; role: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={e => startTransition(() => cambiarRol(id, e.target.value))}
      className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white disabled:opacity-50 cursor-pointer"
    >
      <option value="admin">Admin</option>
      <option value="worker">Worker</option>
    </select>
  )
}

function EliminarBtn({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`¿Eliminar la cuenta ${email}? No se puede deshacer.`)) {
          startTransition(() => eliminarUsuario(id))
        }
      }}
      className="text-xs text-stone-300 hover:text-rose-500 transition cursor-pointer disabled:opacity-40"
    >
      {pending ? '…' : 'Eliminar'}
    </button>
  )
}

function NuevoUsuarioForm() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
      >
        + Nuevo usuario
      </button>
    )
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        setError(null)
        const fd = new FormData(e.currentTarget)
        startTransition(async () => {
          try {
            await crearUsuario(fd)
            setOpen(false)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear usuario.')
          }
        })
      }}
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3"
    >
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">Correo</label>
          <input name="email" type="email" required className={INPUT} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">Contraseña</label>
          <input name="password" type="password" required minLength={6} className={INPUT} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-stone-500">Rol</label>
          <select name="role" defaultValue="worker" className={INPUT}>
            <option value="worker">Worker</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
        <button type="submit" disabled={pending} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
          {pending ? 'Creando…' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}

export default function UsuariosClient({ usuarios }: { usuarios: Usuario[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <NuevoUsuarioForm />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">Correo</th>
              <th className="text-left px-4 py-3 font-medium">Rol</th>
              <th className="text-left px-4 py-3 font-medium">Último acceso</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id} className="border-b border-stone-100 hover:bg-stone-50 transition">
                <td className="px-4 py-3 text-stone-800 font-medium">{u.email}</td>
                <td className="px-4 py-3"><RoleSelect id={u.id} role={u.role} /></td>
                <td className="px-4 py-3 text-stone-400 text-xs">{fmtFecha(u.last_sign_in_at)}</td>
                <td className="px-4 py-3 text-right"><EliminarBtn id={u.id} email={u.email} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
