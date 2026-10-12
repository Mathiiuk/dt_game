import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Zap } from 'lucide-react'
import { dailyApi } from '../../api/dailyChallenge'

/** Fila del Inicio que lleva al reto del día; si ya jugaste hoy, muestra tu puntaje y puesto */
export default function DailyChallengeLink() {
  const [mine, setMine] = useState(null)

  useEffect(() => {
    let alive = true
    // Si no se puede consultar el estado, la fila igual invita a jugar
    Promise.resolve().then(() => dailyApi.get()).then(d => { if (alive) setMine(d?.mine || null) }).catch(() => {})
    return () => { alive = false }
  }, [])

  return (
    <Link to="/reto" className="flex min-h-12 items-center gap-3 border border-line bg-surface px-3 py-2 transition-colors hover:bg-surface-2">
      <Zap className="size-5 shrink-0 text-gold" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="eyebrow block">Reto del día</span>
        <span className="block text-sm font-semibold text-fg">
          {mine ? `Hiciste ${mine.score} pts${mine.rank ? ` · puesto ${mine.rank}º` : ''}` : 'Tres dilemas iguales para todos. ¿Cuántos puntos hacés?'}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
    </Link>
  )
}
