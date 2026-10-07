import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Segmented } from '../../components/ui'
import { DIFFICULTY } from '../../domain/consequences'
import { climateApi } from '../../api/climate'
import { friendlyError } from '../../lib/errors'

export const DIFFICULTY_DESCRIPTIONS = {
  RELAXED: 'Consecuencias más suaves y menor presión de hinchada y dirigencia.',
  NORMAL: 'Experiencia equilibrada y estándar para un DT de ascenso.',
  REALISTIC: 'Mayor exigencia: las crisis y derrotas pegan con fuerza real.'
}

export const DIFFICULTY_OPTIONS = Object.values(DIFFICULTY).map(d => ({
  value: d.key,
  label: d.label
}))

export default function DifficultySelector({ clubId, initialDifficulty = 'NORMAL', onChange }) {
  const [current, setCurrent] = useState(initialDifficulty)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clubId) return
    let alive = true
    climateApi.load(clubId).then(s => {
      if (alive && s?.difficulty) setCurrent(s.difficulty)
    }).catch(() => {})
    return () => { alive = false }
  }, [clubId])

  const handleChange = async (key) => {
    if (!key || key === current) return
    setLoading(true)
    try {
      if (clubId) {
        await climateApi.saveDifficulty(clubId, key)
      }
      setCurrent(key)
      onChange?.(key)
      toast.success(`Dificultad: ${DIFFICULTY[key]?.label || key}.`)
    } catch (e) {
      toast.error(friendlyError(e, 'No se pudo guardar la dificultad.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Dificultad de la carrera</label>
        <span className="text-xs font-medium text-accent">{DIFFICULTY[current]?.label}</span>
      </div>
      <Segmented
        label="Dificultad"
        size="sm"
        value={current}
        onChange={handleChange}
        options={DIFFICULTY_OPTIONS}
        disabled={loading}
      />
      <p className="text-xs text-fg-subtle leading-relaxed">
        {DIFFICULTY_DESCRIPTIONS[current] || ''}
      </p>
    </div>
  )
}
