import React, { useState } from 'react'
import { FastForward, Play, Trophy, Users, X, Zap } from 'lucide-react'
import { Button, Card, CardBody, Badge } from '../../../components/ui'

export default function NationalMatchModal({ fixture, team, onClose, onSimulateFast, onPlayLive }) {
  const [loading, setLoading] = useState(false)

  if (!fixture) return null

  const handleSimulate = async () => {
    setLoading(true)
    try {
      await onSimulateFast(fixture)
    } finally {
      setLoading(false)
    }
  }

  const handleLive = () => {
    onPlayLive(fixture)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-2xl space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-gold" />
            <h3 className="font-display font-bold text-base text-fg">
              Partido de Selección Nacional
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-fg-muted hover:text-fg p-1 rounded-lg"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Rival y Torneo */}
        <div className="rounded-xl border border-line bg-surface-2 p-4 text-center space-y-1">
          <Badge tone="accent">{fixture.tournament_name || 'Fecha FIFA'}</Badge>
          <div className="flex items-center justify-center gap-4 text-lg font-bold text-fg pt-2">
            <span>{team?.name || 'Selección'}</span>
            <span className="text-fg-subtle text-sm">vs</span>
            <span>{fixture.opponent_name || 'Rival'}</span>
          </div>
          <p className="text-xs text-fg-muted">
            {fixture.is_home ? 'Condición: Local' : 'Condición: Visitante'}
          </p>
        </div>

        {/* Selector Arcade: ¿Cómo querés disputarlo? */}
        <p className="text-xs font-semibold text-fg-muted text-center">
          ¿Cómo querés disputar este compromiso internacional?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opción 1: Simulación Rápida */}
          <button
            type="button"
            disabled={loading}
            onClick={handleSimulate}
            className="rounded-xl border border-line bg-surface-2 hover:bg-surface-3 p-3.5 text-left space-y-1 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between text-accent">
              <FastForward className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Arcade</span>
            </div>
            <p className="font-bold text-sm text-fg group-hover:text-accent transition-colors">
              Simular Rápido
            </p>
            <p className="text-[11px] text-fg-muted leading-tight">
              Resolución instantánea con informe de prensa y XP adicional.
            </p>
          </button>

          {/* Opción 2: En Vivo */}
          <button
            type="button"
            disabled={loading}
            onClick={handleLive}
            className="rounded-xl border border-accent/40 bg-accent/10 hover:bg-accent/20 p-3.5 text-left space-y-1 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between text-gold">
              <Play className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Completo</span>
            </div>
            <p className="font-bold text-sm text-fg group-hover:text-accent transition-colors">
              Dirigir en Vivo
            </p>
            <p className="text-[11px] text-fg-muted leading-tight">
              Control táctico con relato minuto a minuto y decisiones.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
