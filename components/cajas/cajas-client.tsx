'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  agregarIngreso, agregarEgreso, agregarRetiro,
  editarIngreso, editarEgreso, editarRetiro,
  borrarIngreso, borrarEgreso, borrarRetiro,
} from '@/lib/actions/caja'

type Ingreso = {
  id: number
  fecha: string
  categoria: string | null
  nombre: string | null
  detalle: string | null
  forma_pago: string | null
  monto_gs: number
  monto_usd: number
  nro_cbte: string | null
}

type Egreso = {
  id: number
  fecha: string
  nro_recibo: string | null
  nro_factura: string | null
  detalle: string | null
  monto_gs: number
  monto_usd: number
}

type Retiro = {
  id: number
  fecha: string
  retiro_gs: number
  retiro_usd: number
  descripcion: string | null
}

type Props = {
  mes: string
  allMonths: string[]
  ingresos: Ingreso[]
  egresos: Egreso[]
  retiros: Retiro[]
}

const MESES_ES: Record<string, string> = {
  '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
  '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
  '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre',
}

function mesLabel(mes: string) {
  const [y, m] = mes.split('-')
  return `${MESES_ES[m] ?? m} ${y}`
}

function fmtGs(n: number) {
  if (n === 0) return '₲ 0'
  return '₲ ' + Math.round(n).toLocaleString('es-PY')
}

function fmtUsd(n: number) {
  if (n === 0) return '$ 0'
  return '$ ' + n.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' })
}

// ── Donut chart (forma de pago) ─────────────────────────────────────────────
const FORMA_COLORS: Record<string, string> = {
  'EFECTIVO':       '#d97706',
  'TARJETA':        '#2563eb',
  'QR':             '#7c3aed',
  'TRANSFERENCIA':  '#0d9488',
  'TRANSFERENCIAS': '#0d9488',
}
const FALLBACK_COLORS = ['#64748b', '#a16207', '#be185d', '#065f46']

function FormaPagoDonut({ ingresos }: { ingresos: Ingreso[] }) {
  const grupos: Record<string, number> = {}
  ingresos.forEach(r => {
    const k = r.forma_pago?.toUpperCase().trim() || 'OTRO'
    grupos[k] = (grupos[k] || 0) + (r.monto_gs ?? 0)
  })

  const total = Object.values(grupos).reduce((a, b) => a + b, 0)
  const items = Object.entries(grupos)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-stone-300 text-sm">
        Sin datos
      </div>
    )
  }

  const r = 52
  const C = 2 * Math.PI * r
  const gap = 2
  let offset = 0

  const arcs = items.map(([key, val], idx) => {
    const frac = val / total
    const arc = frac * C - gap
    const dash = offset
    offset += frac * C
    const color = FORMA_COLORS[key] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
    return { key, val, arc: Math.max(0, arc), dash, color, pct: Math.round(frac * 100) }
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="relative shrink-0">
        <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#f5f4f1" strokeWidth="14" />
          {arcs.map((seg, i) => (
            <circle
              key={i}
              cx="65" cy="65" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${seg.arc} ${C}`}
              strokeDashoffset={-seg.dash}
              strokeLinecap="butt"
            />
          ))}
        </svg>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        {arcs.map(seg => (
          <div key={seg.key} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-stone-600 flex-1">{seg.key}</span>
            <span className="text-stone-800 font-semibold">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Barra de comparación ────────────────────────────────────────────────────
function BarraComparacion({
  label, valor, maximo, colorClass, labelColor,
}: {
  label: string; valor: number; maximo: number; colorClass: string; labelColor: string
}) {
  const pct = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={`font-medium ${labelColor}`}>{label}</span>
        <span className="font-semibold text-stone-800 text-xs">{fmtGs(valor)}</span>
      </div>
      <div className="h-3.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%`, minWidth: pct > 0 ? '6px' : '0' }}
        />
      </div>
    </div>
  )
}

// ── Summary card ────────────────────────────────────────────────────────────
function SummaryCard({
  label, gs, usd, borderColor, bgColor, textColor, labelColor,
}: {
  label: string; gs: number; usd: number
  borderColor: string; bgColor: string; textColor: string; labelColor: string
}) {
  return (
    <div className={`${bgColor} border border-stone-200 rounded-xl shadow-sm p-4 border-l-4 ${borderColor}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${labelColor}`}>{label}</p>
      <p className={`text-xl font-bold leading-tight ${textColor}`}>{fmtGs(gs)}</p>
      <p className="text-sm text-stone-400 mt-0.5">{fmtUsd(usd)}</p>
    </div>
  )
}

// ── Delete button ───────────────────────────────────────────────────────────
function BorrarBtn({ onBorrar }: { onBorrar: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm('¿Borrar este registro?')) startTransition(onBorrar)
      }}
      className="text-xs text-stone-300 hover:text-rose-500 transition cursor-pointer disabled:opacity-40"
    >
      {pending ? '…' : '✕'}
    </button>
  )
}

function EditarBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-stone-300 hover:text-amber-600 transition cursor-pointer"
    >
      ✎
    </button>
  )
}

// ── Editable rows ───────────────────────────────────────────────────────────
function IngresoRow({ r }: { r: Ingreso }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  if (editing) {
    return (
      <tr className="border-b border-stone-100 bg-amber-50">
        <td colSpan={8} className="px-4 py-3">
          <form
            onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              startTransition(async () => { await editarIngreso(r.id, fd); setEditing(false) })
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <Field label="Fecha *"><input name="fecha" type="date" required defaultValue={r.fecha} className={inp} /></Field>
            <Field label="Categoría"><input name="categoria" type="text" defaultValue={r.categoria ?? ''} className={`${inp} uppercase`} /></Field>
            <Field label="Nombre"><input name="nombre" type="text" defaultValue={r.nombre ?? ''} className={`${inp} uppercase`} /></Field>
            <Field label="Detalle"><input name="detalle" type="text" defaultValue={r.detalle ?? ''} className={`${inp} uppercase`} /></Field>
            <Field label="Forma de pago">
              <select name="forma_pago" defaultValue={r.forma_pago ?? ''} className={inp}>
                <option value="">—</option>
                {['EFECTIVO','TRANSFERENCIA','TARJETA','QR'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Monto Gs."><input name="monto_gs" type="number" step="1" defaultValue={r.monto_gs} className={inp} /></Field>
            <Field label="Monto USD"><input name="monto_usd" type="number" step="0.01" defaultValue={r.monto_usd} className={inp} /></Field>
            <Field label="Nro. comprobante"><input name="nro_cbte" type="text" defaultValue={r.nro_cbte ?? ''} className={inp} /></Field>
            <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={pending} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
                {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition">
      <td className="px-4 py-3 text-stone-500 text-sm">{fmtFecha(r.fecha)}</td>
      <td className="px-4 py-3 text-stone-700 text-sm">{r.categoria ?? '—'}</td>
      <td className="px-4 py-3 text-stone-800 font-medium text-sm">{r.nombre ?? '—'}</td>
      <td className="px-4 py-3 text-stone-500 text-sm hidden md:table-cell">{r.detalle ?? '—'}</td>
      <td className="px-4 py-3 text-stone-400 text-sm hidden md:table-cell">{r.forma_pago ?? '—'}</td>
      <td className="px-4 py-3 text-right font-semibold text-stone-800 text-sm">{fmtGs(r.monto_gs)}</td>
      <td className="px-4 py-3 text-right text-stone-500 text-sm">{fmtUsd(r.monto_usd)}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center gap-2 justify-end">
          <EditarBtn onClick={() => setEditing(true)} />
          <BorrarBtn onBorrar={() => borrarIngreso(r.id)} />
        </div>
      </td>
    </tr>
  )
}

function EgresoRow({ r }: { r: Egreso }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  if (editing) {
    return (
      <tr className="border-b border-stone-100 bg-amber-50">
        <td colSpan={7} className="px-4 py-3">
          <form
            onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              startTransition(async () => { await editarEgreso(r.id, fd); setEditing(false) })
            }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            <Field label="Fecha *"><input name="fecha" type="date" required defaultValue={r.fecha} className={inp} /></Field>
            <Field label="Detalle"><input name="detalle" type="text" defaultValue={r.detalle ?? ''} className={`${inp} uppercase`} /></Field>
            <Field label="Monto Gs."><input name="monto_gs" type="number" step="1" defaultValue={r.monto_gs} className={inp} /></Field>
            <Field label="Monto USD"><input name="monto_usd" type="number" step="0.01" defaultValue={r.monto_usd} className={inp} /></Field>
            <Field label="Nro. recibo"><input name="nro_recibo" type="text" defaultValue={r.nro_recibo ?? ''} className={inp} /></Field>
            <Field label="Nro. factura"><input name="nro_factura" type="text" defaultValue={r.nro_factura ?? ''} className={inp} /></Field>
            <div className="col-span-2 md:col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={pending} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
                {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition">
      <td className="px-4 py-3 text-stone-500 text-sm">{fmtFecha(r.fecha)}</td>
      <td className="px-4 py-3 text-stone-800 font-medium text-sm">{r.detalle ?? '—'}</td>
      <td className="px-4 py-3 text-stone-400 text-sm hidden md:table-cell">{r.nro_recibo ?? '—'}</td>
      <td className="px-4 py-3 text-stone-400 text-sm hidden md:table-cell">{r.nro_factura ?? '—'}</td>
      <td className="px-4 py-3 text-right font-semibold text-stone-800 text-sm">{fmtGs(r.monto_gs)}</td>
      <td className="px-4 py-3 text-right text-stone-500 text-sm">{fmtUsd(r.monto_usd)}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center gap-2 justify-end">
          <EditarBtn onClick={() => setEditing(true)} />
          <BorrarBtn onBorrar={() => borrarEgreso(r.id)} />
        </div>
      </td>
    </tr>
  )
}

function RetiroRow({ r }: { r: Retiro }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  if (editing) {
    return (
      <tr className="border-b border-stone-100 bg-amber-50">
        <td colSpan={5} className="px-4 py-3">
          <form
            onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              startTransition(async () => { await editarRetiro(r.id, fd); setEditing(false) })
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <Field label="Fecha *"><input name="fecha" type="date" required defaultValue={r.fecha} className={inp} /></Field>
            <Field label="Retiro Gs."><input name="retiro_gs" type="number" step="1" defaultValue={r.retiro_gs} className={inp} /></Field>
            <Field label="Retiro USD"><input name="retiro_usd" type="number" step="0.01" defaultValue={r.retiro_usd} className={inp} /></Field>
            <Field label="Descripción"><input name="descripcion" type="text" defaultValue={r.descripcion ?? ''} className={`${inp} uppercase`} /></Field>
            <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={pending} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
                {pending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition">
      <td className="px-4 py-3 text-stone-500 text-sm">{fmtFecha(r.fecha)}</td>
      <td className="px-4 py-3 text-stone-800 font-medium text-sm">{r.descripcion ?? '—'}</td>
      <td className="px-4 py-3 text-right font-semibold text-stone-800 text-sm">{fmtGs(r.retiro_gs)}</td>
      <td className="px-4 py-3 text-right text-stone-500 text-sm">{fmtUsd(r.retiro_usd)}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center gap-2 justify-end">
          <EditarBtn onClick={() => setEditing(true)} />
          <BorrarBtn onBorrar={() => borrarRetiro(r.id)} />
        </div>
      </td>
    </tr>
  )
}

// ── Add forms ───────────────────────────────────────────────────────────────
function AddIngresoForm({ mes }: { mes: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-emerald-700 hover:text-emerald-800 font-medium transition cursor-pointer">
      + Agregar ingreso
    </button>
  )

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        fd.set('mes', mes)
        startTransition(async () => { await agregarIngreso(fd); setOpen(false) })
      }}
      className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-3 grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      <input type="hidden" name="mes" value={mes} />
      <Field label="Fecha *"><input name="fecha" type="date" required className={inp} /></Field>
      <Field label="Categoría"><input name="categoria" type="text" className={`${inp} uppercase`} /></Field>
      <Field label="Nombre"><input name="nombre" type="text" className={`${inp} uppercase`} /></Field>
      <Field label="Detalle"><input name="detalle" type="text" className={`${inp} uppercase`} /></Field>
      <Field label="Forma de pago">
        <select name="forma_pago" className={inp}>
          <option value="">—</option>
          {['EFECTIVO','TRANSFERENCIA','TARJETA','QR'].map(o => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Monto Gs."><input name="monto_gs" type="number" step="1" defaultValue="0" className={inp} /></Field>
      <Field label="Monto USD"><input name="monto_usd" type="number" step="0.01" defaultValue="0" className={inp} /></Field>
      <Field label="Nro. comprobante"><input name="nro_cbte" type="text" className={inp} /></Field>
      <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
        <button type="submit" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

function AddEgresoForm({ mes }: { mes: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-rose-700 hover:text-rose-800 font-medium transition cursor-pointer">
      + Agregar egreso
    </button>
  )

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        fd.set('mes', mes)
        startTransition(async () => { await agregarEgreso(fd); setOpen(false) })
      }}
      className="bg-rose-50 border border-rose-200 rounded-xl p-4 mt-3 grid grid-cols-2 md:grid-cols-3 gap-3"
    >
      <input type="hidden" name="mes" value={mes} />
      <Field label="Fecha *"><input name="fecha" type="date" required className={inp} /></Field>
      <Field label="Detalle"><input name="detalle" type="text" className={`${inp} uppercase`} /></Field>
      <Field label="Monto Gs."><input name="monto_gs" type="number" step="1" defaultValue="0" className={inp} /></Field>
      <Field label="Monto USD"><input name="monto_usd" type="number" step="0.01" defaultValue="0" className={inp} /></Field>
      <Field label="Nro. recibo"><input name="nro_recibo" type="text" className={inp} /></Field>
      <Field label="Nro. factura"><input name="nro_factura" type="text" className={inp} /></Field>
      <div className="col-span-2 md:col-span-3 flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
        <button type="submit" disabled={pending} className="bg-rose-600 hover:bg-rose-700 text-white text-sm px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

function AddRetiroForm({ mes }: { mes: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-stone-600 hover:text-stone-800 font-medium transition cursor-pointer">
      + Agregar retiro
    </button>
  )

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        fd.set('mes', mes)
        startTransition(async () => { await agregarRetiro(fd); setOpen(false) })
      }}
      className="bg-stone-50 border border-stone-200 rounded-xl p-4 mt-3 grid grid-cols-2 md:grid-cols-4 gap-3"
    >
      <input type="hidden" name="mes" value={mes} />
      <Field label="Fecha *"><input name="fecha" type="date" required className={inp} /></Field>
      <Field label="Retiro Gs."><input name="retiro_gs" type="number" step="1" defaultValue="0" className={inp} /></Field>
      <Field label="Retiro USD"><input name="retiro_usd" type="number" step="0.01" defaultValue="0" className={inp} /></Field>
      <Field label="Descripción"><input name="descripcion" type="text" className={`${inp} uppercase`} /></Field>
      <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:text-stone-600 cursor-pointer">Cancelar</button>
        <button type="submit" disabled={pending} className="bg-stone-700 hover:bg-stone-800 text-white text-sm px-4 py-1.5 rounded-lg cursor-pointer disabled:opacity-50">
          {pending ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

const inp = 'border border-stone-200 rounded-lg px-2 py-1.5 text-sm w-full'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-stone-500">{label}</label>
      {children}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CajasClient({ mes, allMonths, ingresos, egresos, retiros }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'ingresos' | 'egresos' | 'admin'>('ingresos')

  const totalIngGs  = ingresos.reduce((s, r) => s + (r.monto_gs  ?? 0), 0)
  const totalIngUsd = ingresos.reduce((s, r) => s + (r.monto_usd ?? 0), 0)
  const totalEgrGs  = egresos.reduce((s, r) => s + (r.monto_gs   ?? 0), 0)
  const totalEgrUsd = egresos.reduce((s, r) => s + (r.monto_usd  ?? 0), 0)
  const totalRetGs  = retiros.reduce((s, r) => s + (r.retiro_gs  ?? 0), 0)
  const totalRetUsd = retiros.reduce((s, r) => s + (r.retiro_usd ?? 0), 0)
  const balanceGs   = totalIngGs  - totalEgrGs  - totalRetGs
  const balanceUsd  = totalIngUsd - totalEgrUsd - totalRetUsd

  const idxMes  = allMonths.indexOf(mes)
  const prevMes = idxMes > 0 ? allMonths[idxMes - 1] : null
  const nextMes = idxMes < allMonths.length - 1 ? allMonths[idxMes + 1] : null
  const navMes  = (m: string) => router.push(`/reportes?mes=${m}`)

  const maxGs = Math.max(totalIngGs, totalEgrGs, totalRetGs, 1)

  const hasDatos = ingresos.length > 0 || egresos.length > 0 || retiros.length > 0

  const tabs = [
    { key: 'ingresos' as const, label: 'Ingresos',      count: ingresos.length },
    { key: 'egresos'  as const, label: 'Egresos',        count: egresos.length  },
    { key: 'admin'    as const, label: 'Administración', count: retiros.length  },
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Caja</h1>
          <p className="text-stone-400 text-sm mt-0.5">Resumen financiero mensual</p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2 shadow-sm">
          <button
            onClick={() => prevMes && navMes(prevMes)}
            disabled={!prevMes}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-stone-600 transition text-lg font-light"
          >‹</button>
          <span className="text-sm font-semibold text-stone-800 min-w-[120px] text-center">
            {mesLabel(mes)}
          </span>
          <button
            onClick={() => nextMes && navMes(nextMes)}
            disabled={!nextMes}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-stone-600 transition text-lg font-light"
          >›</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <SummaryCard
          label="Ingresos"
          gs={totalIngGs} usd={totalIngUsd}
          borderColor="border-l-emerald-500"
          bgColor="bg-emerald-50"
          textColor="text-emerald-800"
          labelColor="text-emerald-600"
        />
        <SummaryCard
          label="Egresos"
          gs={totalEgrGs} usd={totalEgrUsd}
          borderColor="border-l-rose-500"
          bgColor="bg-rose-50"
          textColor="text-rose-800"
          labelColor="text-rose-600"
        />
        <SummaryCard
          label="Retiros admin"
          gs={totalRetGs} usd={totalRetUsd}
          borderColor="border-l-stone-400"
          bgColor="bg-stone-50"
          textColor="text-stone-700"
          labelColor="text-stone-500"
        />
        <SummaryCard
          label="Balance neto"
          gs={balanceGs} usd={balanceUsd}
          borderColor={balanceGs >= 0 ? 'border-l-amber-500' : 'border-l-red-500'}
          bgColor={balanceGs >= 0 ? 'bg-amber-50' : 'bg-red-50'}
          textColor={balanceGs >= 0 ? 'text-amber-800' : 'text-red-700'}
          labelColor={balanceGs >= 0 ? 'text-amber-600' : 'text-red-500'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

        {/* Comparación de flujos */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">¿Cuánto entró vs cuánto salió?</h2>
          {hasDatos ? (
            <div className="flex flex-col gap-3">
              <BarraComparacion label="Ingresos"      valor={totalIngGs} maximo={maxGs} colorClass="bg-emerald-500" labelColor="text-emerald-700" />
              <BarraComparacion label="Egresos"       valor={totalEgrGs} maximo={maxGs} colorClass="bg-rose-500"    labelColor="text-rose-700"    />
              <BarraComparacion label="Retiros admin" valor={totalRetGs} maximo={maxGs} colorClass="bg-stone-400"   labelColor="text-stone-600"   />
              <div className="border-t border-stone-100 pt-3 mt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-semibold ${balanceGs >= 0 ? 'text-amber-700' : 'text-red-600'}`}>Balance</span>
                  <span className={`font-bold ${balanceGs >= 0 ? 'text-amber-800' : 'text-red-700'}`}>{fmtGs(balanceGs)}</span>
                </div>
                <div className="flex justify-end mt-0.5">
                  <span className="text-xs text-stone-400">{fmtUsd(balanceUsd)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-stone-300 text-sm text-center py-8">Sin datos para este mes</p>
          )}
        </div>

        {/* Forma de pago donut */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-stone-700 mb-4">¿Cómo pagaron los huéspedes?</h2>
          <FormaPagoDonut ingresos={ingresos} />
          {ingresos.length > 0 && (
            <p className="text-xs text-stone-400 mt-3 text-right">{ingresos.length} registros · {fmtGs(totalIngGs)}</p>
          )}
        </div>
      </div>

      {/* Estado de resultados */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5 mb-5">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">Estado de resultados</h2>
        <div className="space-y-2">
          <ResultRow label="Ingresos totales"   gs={totalIngGs}  usd={totalIngUsd}  color="text-emerald-700" bold />
          <ResultRow label="(−) Egresos"        gs={-totalEgrGs} usd={-totalEgrUsd} color="text-rose-600"    />
          <ResultRow label="(−) Retiros admin"  gs={-totalRetGs} usd={-totalRetUsd} color="text-stone-500"   />
          <div className="border-t-2 border-stone-200 pt-2 mt-2">
            <ResultRow
              label="Balance neto"
              gs={balanceGs}
              usd={balanceUsd}
              color={balanceGs >= 0 ? 'text-amber-700' : 'text-red-600'}
              bold
            />
          </div>
          {totalIngGs > 0 && (
            <p className="text-xs text-stone-400 pt-1">
              Por cada ₲ 100 que entró → ₲ {((balanceGs / totalIngGs) * 100).toFixed(1)} de ganancia
            </p>
          )}
        </div>
      </div>

      {/* Tabs + tablas */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl mb-4 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
              tab === t.key ? 'bg-white shadow-sm text-stone-800' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-stone-100 text-stone-600' : 'bg-stone-200 text-stone-400'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'ingresos' && (
        <TableCard footer={<AddIngresoForm mes={mes} />}>
          <TableHead cols={['Fecha','Categoría','Nombre','Detalle','Forma pago','Gs.','USD','']}
            hiddenMd={[3,4]} />
          <tbody>
            {ingresos.length === 0 && <EmptyRow colSpan={8} />}
            {ingresos.map(r => <IngresoRow key={r.id} r={r} />)}
          </tbody>
          {ingresos.length > 0 && (
            <tfoot>
              <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                <td colSpan={5} className="px-4 py-3 text-xs font-bold text-emerald-700 uppercase">Total</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-800">{fmtGs(totalIngGs)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmtUsd(totalIngUsd)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </TableCard>
      )}

      {tab === 'egresos' && (
        <TableCard footer={<AddEgresoForm mes={mes} />}>
          <TableHead cols={['Fecha','Detalle','Nro. recibo','Nro. factura','Gs.','USD','']}
            hiddenMd={[2,3]} />
          <tbody>
            {egresos.length === 0 && <EmptyRow colSpan={7} />}
            {egresos.map(r => <EgresoRow key={r.id} r={r} />)}
          </tbody>
          {egresos.length > 0 && (
            <tfoot>
              <tr className="bg-rose-50 border-t-2 border-rose-200">
                <td colSpan={4} className="px-4 py-3 text-xs font-bold text-rose-700 uppercase">Total</td>
                <td className="px-4 py-3 text-right font-bold text-rose-800">{fmtGs(totalEgrGs)}</td>
                <td className="px-4 py-3 text-right font-bold text-rose-700">{fmtUsd(totalEgrUsd)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </TableCard>
      )}

      {tab === 'admin' && (
        <TableCard footer={<AddRetiroForm mes={mes} />}>
          <TableHead cols={['Fecha','Descripción','Retiro Gs.','Retiro USD','']} hiddenMd={[]} />
          <tbody>
            {retiros.length === 0 && <EmptyRow colSpan={5} />}
            {retiros.map(r => <RetiroRow key={r.id} r={r} />)}
          </tbody>
          {retiros.length > 0 && (
            <tfoot>
              <tr className="bg-stone-100 border-t-2 border-stone-300">
                <td colSpan={2} className="px-4 py-3 text-xs font-bold text-stone-600 uppercase">Total</td>
                <td className="px-4 py-3 text-right font-bold text-stone-800">{fmtGs(totalRetGs)}</td>
                <td className="px-4 py-3 text-right font-bold text-stone-700">{fmtUsd(totalRetUsd)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </TableCard>
      )}

    </div>
  )
}

// ── Helpers de tabla ────────────────────────────────────────────────────────
function TableCard({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
      {footer && <div className="px-4 py-3 border-t border-stone-100">{footer}</div>}
    </div>
  )
}

function TableHead({ cols, hiddenMd }: { cols: string[]; hiddenMd: number[] }) {
  return (
    <thead>
      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs uppercase tracking-wide">
        {cols.map((c, i) => (
          <th
            key={i}
            className={`px-4 py-3 font-medium ${i === cols.length - 1 ? '' : i >= cols.length - 3 ? 'text-right' : 'text-left'} ${hiddenMd.includes(i) ? 'hidden md:table-cell' : ''}`}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-stone-300 text-sm">
        Sin registros para este mes.
      </td>
    </tr>
  )
}

function ResultRow({
  label, gs, usd, color, bold,
}: {
  label: string; gs: number; usd: number; color: string; bold?: boolean
}) {
  const weight = bold ? 'font-bold' : 'font-normal'
  const absGs  = Math.abs(gs)
  const absUsd = Math.abs(usd)
  const sign   = gs < 0 ? '−' : ''
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${color} ${weight}`}>{label}</span>
      <div className="text-right">
        <span className={`text-sm ${color} ${weight}`}>
          {sign}{fmtGs(absGs)}
        </span>
        <span className="text-xs text-stone-400 ml-2">{sign}{fmtUsd(absUsd)}</span>
      </div>
    </div>
  )
}
