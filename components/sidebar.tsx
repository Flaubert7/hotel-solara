'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',    adminOnly: false },
  { href: '/disposicion',  label: 'Disposición',  adminOnly: false },
  { href: '/reservas',     label: 'Reservas',     adminOnly: false },
  { href: '/limpieza',     label: 'Limpieza',     adminOnly: false },
  { href: '/inventario',   label: 'Inventario',   adminOnly: false },
  { href: '/usuarios',     label: 'Usuarios',     adminOnly: false },
  { href: '/camaras',      label: 'Cámaras',      adminOnly: true  },
  { href: '/cajas',        label: 'Cajas',        adminOnly: true  },
]

export default function Sidebar({ role, userEmail }: { role: string; userEmail: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'

  return (
    <aside className="w-52 flex flex-col bg-white border-r border-stone-200 shrink-0">

      {/* Logo */}
      <div className="px-4 py-6 border-b border-stone-100 flex flex-col items-center gap-2">
        <Image src="/logo.png" alt="Hotel Solara" width={144} height={144} className="object-contain" />
        <p className="text-stone-400 text-[11px] uppercase tracking-widest">{role}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(item => {
          const locked = item.adminOnly && !isAdmin
          const active = !locked && (pathname === item.href || pathname.startsWith(item.href + '/'))

          if (locked) {
            return (
              <div
                key={item.href}
                title="Solo administrador"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-stone-300 cursor-not-allowed select-none"
              >
                <span>{item.label}</span>
                <span className="text-xs">🔒</span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-amber-50 text-amber-700 font-semibold border border-amber-200'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-stone-100">
        <p className="text-stone-400 text-xs truncate mb-2">{userEmail}</p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left text-stone-400 hover:text-rose-500 text-xs transition-colors cursor-pointer"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

    </aside>
  )
}
