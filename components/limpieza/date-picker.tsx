'use client'

export default function LimpiezaDatePicker({
  selectedDate,
  today,
}: {
  selectedDate: string
  today: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        defaultValue={selectedDate}
        onChange={e => {
          if (e.target.value) window.location.href = `/limpieza?date=${e.target.value}`
        }}
        className="bg-white border border-stone-200 text-stone-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 cursor-pointer shadow-sm"
      />
      {selectedDate !== today && (
        <a href="/limpieza" className="text-xs text-amber-600 hover:text-amber-700 transition font-medium">
          Hoy
        </a>
      )}
    </div>
  )
}
