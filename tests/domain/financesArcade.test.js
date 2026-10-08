import { describe, it, expect } from 'vitest'
import {
  getFacilityROI,
  getTycoonHealth
} from '../../src/domain/finances'

describe('dominio arcade de finanzas (Tycoon ROI y Billetera)', () => {
  it('calcula el retorno de inversión (ROI) estimado para mejoras de estadio y tienda', () => {
    const stadiumRoi = getFacilityROI('stadium_level', 2, 70000)
    expect(stadiumRoi.gainText).toContain('capacidad')
    expect(stadiumRoi.paybackText).toContain('partidos')

    const storeRoi = getFacilityROI('store_level', 1, 12000)
    expect(storeRoi.gainText).toContain('/sem')
    expect(storeRoi.paybackText).toContain('semanas')

    const medicalRoi = getFacilityROI('medical_level', 1, 20000)
    expect(medicalRoi.gainText).toBeDefined()
  })

  it('devuelve el semáforo y lema tycoon según el gasto y la caja', () => {
    const dulce = getTycoonHealth('HEALTHY', 100000, 3000)
    expect(dulce.slogan).toBe('Estamos dulces')
    expect(dulce.label).toBe('Finanzas saludables')
    expect(dulce.tone).toBe('accent')

    const cuidado = getTycoonHealth('CAUTION', 15000, 3000)
    expect(cuidado.slogan).toBe('Cuidá los gastos')
    expect(cuidado.label).toBe('Alerta de liquidez')
    expect(cuidado.tone).toBe('warning')

    const critico = getTycoonHealth('CRITICAL', 2000, 4000)
    expect(critico.slogan).toBe('Hay que levantarla')
    expect(critico.label).toBe('Déficit crítico')
    expect(critico.tone).toBe('danger')
  })
})
