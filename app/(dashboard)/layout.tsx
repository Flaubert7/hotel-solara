import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'
import MobileNav from '@/components/mobile-nav'
import MobileHeader from '@/components/mobile-header'
import AutoRefresh from '@/components/auto-refresh'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'worker'

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      <AutoRefresh intervalMs={60000} />

      {/* Sidebar — solo desktop */}
      <div className="hidden lg:flex">
        <Sidebar role={role} userEmail={user.email ?? ''} />
      </div>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <MobileHeader />
        {children}
      </main>

      {/* Nav inferior — solo móvil */}
      <MobileNav role={role} />
    </div>
  )
}
