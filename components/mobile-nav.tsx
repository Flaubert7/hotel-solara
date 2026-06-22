'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Inicio',      icon: '⊞', adminOnly: false },
  { href: '/disposicion', label: 'Disposición', icon: '▦',  adminOnly: false },
  { href: '/reservas',    label: 'Reservas',    icon: '📋', adminOnly: false },
  { href: '/limpieza',    label: 'Limpieza',    icon: '✓',  adminOnly: false },
  { href: '/inventario',  label: 'Inventario',  icon: '▤',  adminOnly: false },
  { href: '/usuarios',    label: 'Usuarios',    icon: '👤', adminOnly: false },
  { href: '/camaras',     label: 'Cámaras',     icon: '📷', adminOnly: true  },
  { href: '/cajas',       label: 'Cajas',       icon: '↗',  adminOnly: true  },
]

export default function MobileNav({ role }: { role: string }) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 flex lg:hidden overflow-x-auto">
      {NAV_ITEMS.map(item => {
        const locked = item.adminOnly && !isAdmin
        const active = !locked && (pathname === item.href || pathname.startsWith(item.href + '/'))

        if (locked) {
          return (
            <div
              key={item.href}
              title="Solo administrador"
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium text-stone-200 min-w-[56px] cursor-not-allowed"
            >
              <span className="text-base leading-none opacity-40">{item.icon}</span>
              <span className="leading-none opacity-40">{item.label}</span>
              <span className="text-[8px] leading-none">🔒</span>
            </div>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors min-w-[56px] ${
              active ? 'text-amber-600' : 'text-stone-400'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
