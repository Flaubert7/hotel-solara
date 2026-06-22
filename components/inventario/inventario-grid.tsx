'use client'

import { useTransition, useState } from 'react'
import { registrarMovimiento } from '@/lib/actions/inventario'

type Item = {
  id: number
  name: string
  currentStock: number
  todayRecord: { intake: number; output: number } | null
}

function ItemCard({ item, today }: { item: Item; today: string }) {
  const [pending, startTransition] = useTransition()
  const [qty, setQty] = useState(1)

  function handle(type: 'intake' | 'output') {
    startTransition(() => registrarMovimiento(item.id, type, qty, today))
  }

  const lowStock = item.currentStock <= 3

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
      <p className="text-stone-700 text-sm font-medium leading-tight">{item.name}</p>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-0.5">Stock</p>
          <p className={`text-2xl font-bold ${lowStock ? 'text-rose-500' : 'text-stone-800'}`}>
            {item.currentStock}
          </p>
        </div>

        {item.todayRecord && (
          <div className="text-right text-xs text-stone-400">
            <p className="text-emerald-600">+{item.todayRecord.intake} entrada</p>
            <p className="text-rose-400">−{item.todayRecord.output} salida</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={qty}
          onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-14 bg-stone-50 border border-stone-200 text-stone-700 text-sm rounded-lg px-2 py-1.5 outline-none focus:border-amber-500 text-center"
        />
        <button
          disabled={pending}
          onClick={() => handle('intake')}
          className="flex-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg py-1.5 transition cursor-pointer disabled:opacity-50 font-medium"
        >
          + Entrada
        </button>
        <button
          disabled={pending || item.currentStock <= 0}
          onClick={() => handle('output')}
          className="flex-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg py-1.5 transition cursor-pointer disabled:opacity-50 font-medium"
        >
          − Salida
        </button>
      </div>
    </div>
  )
}

export default function InventarioGrid({ items, today }: { items: Item[]; today: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map(item => (
        <ItemCard key={item.id} item={item} today={today} />
      ))}
    </div>
  )
}
