import { requireAdmin } from '@/lib/require-admin'

export default async function CamarasPage() {
  await requireAdmin()

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-stone-900 mb-1">Cámaras</h1>
      <p className="text-stone-400 text-sm">Pendiente de configuración del DVR Dahua.</p>
    </div>
  )
}
