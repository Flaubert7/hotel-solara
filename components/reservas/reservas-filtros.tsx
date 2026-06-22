'use client'

import { useRouter } from 'next/navigation'

const AGENCIAS = ['Booking','Airbnb','WhatsApp','Directo','Instagram','TikTok']
const ESTADOS  = ['CONFIRMADO','CANCELADO']

export default function ReservasFiltros({
  currentStatus, currentAgency, monthStr
}: {
  currentStatus?: string
  currentAgency?: string
  monthStr: string
}) {
  const router = useRouter()

  function buildUrl(status?: string, agency?: string) {
    const p = new URLSearchParams()
    if (monthStr) p.set('month', monthStr)
    if (status)   p.set('status', status)
    if (agency)   p.set('agency', agency)
    return `/reservas?${p.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Status */}
      <div className="flex gap-1">
        <button
          onClick={() => router.push(buildUrl(undefined, currentAgency))}
          className={`text-xs px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${!currentStatus ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200'}`}
        >
          Todos
        </button>
        {ESTADOS.map(s => (
          <button
            key={s}
            onClick={() => router.push(buildUrl(currentStatus === s ? undefined : s, currentAgency))}
            className={`text-xs px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              currentStatus === s
                ? s === 'CONFIRMADO' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-600'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="w-px bg-stone-200 self-stretch" />

      {/* Agencia */}
      <div className="flex gap-1 flex-wrap">
        {AGENCIAS.map(a => (
          <button
            key={a}
            onClick={() => router.push(buildUrl(currentStatus, currentAgency === a ? undefined : a))}
            className={`text-xs px-3 py-1.5 rounded-lg transition cursor-pointer font-medium ${
              currentAgency === a
                ? 'bg-amber-100 text-amber-700'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}
