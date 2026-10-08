import React, { useState } from 'react'
import { Award, ChevronDown, ChevronUp, Flame, Info, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react'
import { Card, CardBody, Badge, Button } from '../../../components/ui'
import { calculateNationalGauge } from '../../../domain/nationalRadar'

export default function NationalCareerGauge({ manager, country }) {
  const [showRules, setShowRules] = useState(false)
  const gauge = calculateNationalGauge(manager)

  return (
    <Card className="border border-line bg-surface/90 shadow-md overflow-hidden relative">
      {/* Barra superior con gradiente del país */}
      <div 
        className="h-1.5 w-full bg-gradient-to-r from-accent via-accent-strong to-gold"
        style={{
          background: country?.colors?.primary 
            ? `linear-gradient(90deg, ${country.colors.primary} 0%, #EAB308 100%)`
            : undefined
        }}
      />
      
      <CardBody className="p-4 sm:p-5 space-y-4">
        {/* Encabezado del Termómetro */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="Bandera">{country?.flag || '🇦🇷'}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-fg sm:text-lg">
                  Camino al Buzo de la Selección ({country?.nickname || 'Albiceleste'})
                </h3>
                <Badge tone="accent" dot>{gauge.tierName}</Badge>
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                {gauge.description}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="font-mono text-xl sm:text-2xl font-black text-accent">
              {gauge.percentage}%
            </span>
            <p className="text-[10px] uppercase font-bold tracking-wider text-fg-subtle">
              Termómetro
            </p>
          </div>
        </div>

        {/* Barra de progreso interactiva */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-surface-2 p-0.5 border border-line overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-accent to-gold transition-all duration-500 shadow-sm"
              style={{ width: `${gauge.percentage}%` }}
              role="progressbar"
              aria-valuenow={gauge.percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-fg-muted px-1">
            <span>🎯 Próximo objetivo: <strong className="text-fg">{gauge.nextMilestone}</strong></span>
            <button 
              type="button"
              onClick={() => setShowRules(!showRules)}
              className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold"
            >
              <Info className="size-3" />
              {showRules ? 'Ocultar reglas' : '¿Cómo suma o resta?'}
              {showRules ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
          </div>
        </div>

        {/* Desglose desplegable de reglas arcade de reputación */}
        {showRules && (
          <div className="rounded-xl border border-line bg-surface-2 p-3 space-y-2 text-xs">
            <p className="font-bold text-fg flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-gold" />
              ¿Qué influye en tu consideración para la Selección?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {gauge.rules.map((rule, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-line/40 last:border-none">
                  <span className="text-fg-muted">{rule.action}</span>
                  <span className={`font-mono font-bold ${rule.impact.startsWith('+') ? 'text-accent' : 'text-danger'}`}>
                    {rule.impact}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-fg-subtle italic">
              * El seleccionador nacional valora tanto los campeonatos como los jugadores que promovés y hacés brillar.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
