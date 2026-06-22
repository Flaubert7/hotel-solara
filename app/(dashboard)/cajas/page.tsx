import { requireAdmin } from '@/lib/require-admin'
import { createClient } from '@/lib/supabase/server'
import CajasClient from '@/components/cajas/cajas-client'

function generateAllMonths(): string[] {
  const months: string[] = []
  const now = new Date()
  const endYear = now.getFullYear()
  const endMonth = now.getMonth() + 2 // 1 mes adelante

  for (let y = 2026; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === endYear && m > endMonth) break
      months.push(`${y}-${String(m).padStart(2, '0')}`)
    }
  }
  return months.length > 0 ? months : ['2026-01']
}

function mesActual() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function getCajaData(mes: string) {
  const supabase = await createClient()
  const [ingresosRes, egresosRes, retirosRes] = await Promise.all([
    supabase.from('caja_ingresos').select('*').eq('mes', mes).order('fecha'),
    supabase.from('caja_egresos').select('*').eq('mes', mes).order('fecha'),
    supabase.from('caja_administracion').select('*').eq('mes', mes).order('fecha'),
  ])
  return {
    ingresos: ingresosRes.data ?? [],
    egresos:  egresosRes.data ?? [],
    retiros:  retirosRes.data ?? [],
  }
}

export default async function CajasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  await requireAdmin()

  const params = await searchParams
  const allMonths = generateAllMonths()
  const mes = allMonths.includes(params.mes ?? '') ? (params.mes ?? mesActual()) : mesActual()

  const { ingresos, egresos, retiros } = await getCajaData(mes)

  return (
    <CajasClient
      mes={mes}
      allMonths={allMonths}
      ingresos={ingresos}
      egresos={egresos}
      retiros={retiros}
    />
  )
}
