'use client'

import { useRouter } from 'next/navigation'

type View = 'dia' | 'semana' | 'mes'

export default function ViewToggle({ current, selectedDate }: { current: View; selectedDate: string }) {
  const router = useRouter()

  return (
    <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
      {(['dia', 'semana', 'mes'] as View[]).map(v => (
        <button
          key={v}
          onClick={() => router.push(v === 'dia' ? `/disposicion?date=${selectedDate}` : `/disposicion?view=${v}&date=${selectedDate}`)}
          className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
            current === v ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          {v === 'dia' ? 'Día' : v}
        </button>
      ))}
    </div>
  )
}
