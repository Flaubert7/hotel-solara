import { listarUsuarios } from '@/lib/actions/usuarios'
import UsuariosClient from '@/components/usuarios/usuarios-client'

export default async function UsuariosPage() {
  const usuarios = await listarUsuarios()

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Usuarios</h1>
        <p className="text-stone-400 text-sm mt-1">Cuentas con acceso al sistema.</p>
      </div>

      <UsuariosClient usuarios={usuarios} />
    </div>
  )
}
