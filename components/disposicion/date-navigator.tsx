'use client'

import { useRouter } from 'next/navigation'

const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

export default function DateNavigator({ selectedDate }: { selectedDate: string }) {
  const router = useRouter()
  const date = new Date(selectedDate + 'T12:00:00')
  const today = new Date().toISOString().split('T')[0]

  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()

  function navigate(newDate: Date) {
    const y = newDate.getFullYear()
    const m = String(newDate.getMonth() + 1).padStart(2, '0')
    const d = String(newDate.getDate()).padStart(2, '0')
    router.push(`/disposicion?date=${y}-${m}-${d}`)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Mes */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          className="text-stone-400 hover:text-stone-700 transition p-1 rounded hover:bg-stone-200 cursor-pointer"
        >
          ←
        </button>
        <span className="text-stone-700 font-semibold text-sm min-w-[130px] text-center">
          {MONTHS_ES[date.getMonth()]} {date.getFullYear()}
        </span>
        <button
          onClick={() => navigate(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
          className="text-stone-400 hover:text-stone-700 transition p-1 rounded hover:bg-stone-200 cursor-pointer"
        >
          →
        </button>
        {selectedDate !== today && (
          <button
            onClick={() => router.push('/disposicion')}
            className="text-xs text-amber-600 hover:text-amber-700 transition ml-2 cursor-pointer font-medium"
          >
            Hoy
          </button>
        )}
      </div>

      {/* Días */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const y = date.getFullYear()
          const m = String(date.getMonth() + 1).padStart(2, '0')
          const dayStr = `${y}-${m}-${String(day).padStart(2, '0')}`
          const isSelected = date.getDate() === day
          const isToday = dayStr === today

          return (
            <button
              key={day}
              onClick={() => navigate(new Date(date.getFullYear(), date.getMonth(), day))}
              className={`flex items-center justify-center min-w-[32px] h-9 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-white shadow-sm'
                  : isToday
                  ? 'border border-amber-400 text-amber-600 hover:bg-amber-50'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-200'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
