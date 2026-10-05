/**
 * Reglas puras de la pantalla de Finanzas: instalaciones, costos de mejora, precios de entrada y salud financiera.
 */

export const TICKET_PRICES = [6, 8, 10, 14, 18]

/** Instalaciones mejorables: costo por nivel (costo = nivel actual × costPerLevel) */
export const FACILITIES = [
  {
    key: 'stadium_level',
    name: 'Tribunas del estadio',
    description: 'Más tribunas populares: sube la taquilla en los partidos de local.',
    costPerLevel: 35000,
    action: 'Ampliar tribunas'
  },
  {
    key: 'medical_level',
    name: 'Centro médico y kinesiología',
    description: 'Rehabilitación que reduce recaídas y acorta el tiempo de baja por lesión.',
    costPerLevel: 20000,
    action: 'Mejorar equipamiento'
  },
  {
    key: 'store_level',
    name: 'Tienda oficial y merchandising',
    description: 'Camisetas, bufandas y accesorios: más ingresos comerciales por semana.',
    costPerLevel: 12000,
    action: 'Expandir tienda'
  }
]

export const levelOf = (club, key) => club?.[key] || 1

export const upgradeCost = (facility, level) => (level || 1) * facility.costPerLevel

/** Ingreso semanal de la tienda por nivel */
export const storeWeeklyIncome = (level) => (level || 1) * 350

/** Etiqueta y tono de la salud financiera */
export const healthInfo = (status) => {
  if (status === 'HEALTHY') return { label: 'Finanzas saludables', tone: 'accent' }
  if (status === 'CAUTION') return { label: 'Alerta de liquidez', tone: 'warning' }
  return { label: 'Déficit crítico', tone: 'danger' }
}

export const canAfford = (budget, cost) => Number(budget || 0) >= cost
