import { login } from './actions'
import Image from 'next/image'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="Hotel Solara" width={80} height={80} className="object-contain" />
          <div>
            <h1 className="text-xl font-semibold text-stone-800 tracking-wide">Hotel Solara</h1>
            <p className="text-stone-400 text-sm mt-0.5">Sistema de gestión interna</p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-8 shadow-sm">
          <form action={login} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-stone-600 text-sm font-medium">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="bg-stone-50 border border-stone-200 text-stone-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition placeholder:text-stone-300"
                placeholder="usuario@hotelsolara.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-stone-600 text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="bg-stone-50 border border-stone-200 text-stone-800 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition placeholder:text-stone-300"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg py-2.5 text-sm transition mt-1 cursor-pointer"
            >
              Ingresar
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
