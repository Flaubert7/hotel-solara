import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hotel Solara',
  description: 'Sistema de gestión interna',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Solara',
  },
}

export const viewport: Viewport = {
  themeColor: '#1C1917',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.className} bg-stone-100 text-stone-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
