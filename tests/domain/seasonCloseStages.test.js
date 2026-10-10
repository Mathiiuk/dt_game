import { describe, it, expect } from 'vitest'
import { CLOSE_STAGES, stageIndex, isCloseIncomplete, needsStage, closePendingText, closeProgressPercent } from '../../src/domain/seasonCloseStages'

describe('etapas del cierre de temporada', () => {
  it('van en orden: base, evolución, liga y partidos, completo', () => {
    expect(CLOSE_STAGES).toEqual(['DB_DONE', 'EVOLUTION_DONE', 'LEAGUE_READY', 'COMPLETE'])
    expect(CLOSE_STAGES.map(stageIndex)).toEqual([0, 1, 2, 3])
    expect(stageIndex('INVENTADA')).toBe(0)
  })

  it('el cierre está incompleto si hay marca de avance y no llegó al final', () => {
    expect(isCloseIncomplete(null)).toBe(false)
    expect(isCloseIncomplete(undefined)).toBe(false)
    expect(isCloseIncomplete({ stage: 'DB_DONE' })).toBe(true)
    expect(isCloseIncomplete({ stage: 'LEAGUE_READY' })).toBe(true)
    expect(isCloseIncomplete({ stage: 'COMPLETE' })).toBe(false)
  })

  it('solo corre las etapas que todavía no pasó: nada se repite', () => {
    expect(needsStage({ stage: 'DB_DONE' }, 'EVOLUTION_DONE')).toBe(true)
    expect(needsStage({ stage: 'EVOLUTION_DONE' }, 'EVOLUTION_DONE')).toBe(false)
    expect(needsStage({ stage: 'EVOLUTION_DONE' }, 'LEAGUE_READY')).toBe(true)
    expect(needsStage({ stage: 'LEAGUE_READY' }, 'LEAGUE_READY')).toBe(false)
    expect(needsStage({ stage: 'LEAGUE_READY' }, 'COMPLETE')).toBe(true)
    expect(needsStage({ stage: 'COMPLETE' }, 'COMPLETE')).toBe(false)
  })

  it('dice qué falta según la etapa', () => {
    expect(closePendingText('DB_DONE')).toMatch(/evolucionar al plantel/)
    expect(closePendingText('EVOLUTION_DONE')).toMatch(/armar la liga/)
    expect(closePendingText('EVOLUTION_DONE')).not.toMatch(/evolucionar/)
    expect(closePendingText('LEAGUE_READY')).toMatch(/partidos del nuevo año/)
    expect(closePendingText('LEAGUE_READY')).not.toMatch(/liga del nuevo año y/)
  })

  it('el avance sube con cada etapa hasta 100', () => {
    expect(CLOSE_STAGES.map(closeProgressPercent)).toEqual([25, 50, 75, 100])
  })
})
