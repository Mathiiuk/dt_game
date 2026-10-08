import React from 'react'
import { AlertTriangle, Award, CheckCircle2, Eye, Heart, Sparkles, TrendingUp, Users, Zap } from 'lucide-react'
import { Card, CardBody, Badge } from '../../../components/ui'
import { formatMoney } from '../../../lib/format'

export default function NationalRadarCard({ radar }) {
  const { players = [], country, calledUpCount = 0, inRadarCount = 0 } = radar || {}

  return (
    <Card className="border border-line bg-surface/90 shadow-md">
      <CardBody className="p-4 sm:p-5 space-y-4">
        {/* Cabecera del Radar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Eye className="size-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-fg sm:text-lg flex items-center gap-2">
                Radar de Convocatorias ({country?.nickname || 'Nacional'})
                {calledUpCount > 0 && (
                  <Badge tone="accent">
                    {calledUpCount} {calledUpCount === 1 ? 'Convocado' : 'Convocados'}
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-fg-muted">
                Seguimiento oficial del cuerpo técnico nacional sobre los futbolistas de tu club.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-fg-subtle">En la mira:</span>
            <span className="font-mono font-bold text-fg">{inRadarCount} promesas</span>
          </div>
        </div>

        {/* Lista de Jugadores en el Radar */}
        {players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center space-y-2">
            <p className="text-sm font-semibold text-fg">El seleccionador aún no puso los ojos en tu club</p>
            <p className="text-xs text-fg-muted max-w-md mx-auto">
              Para llamar la atención del radar, tus jugadores deben destacar en su categoría con alta media o rachas goleadoras. ¡Seguí potenciando la cantera!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {players.map((item) => {
              const p = item.player
              const isCalled = item.status === 'called_up'

              return (
                <div 
                  key={p.id}
                  className={`rounded-xl border p-3.5 space-y-2.5 transition-all ${
                    isCalled 
                      ? 'border-accent/40 bg-accent/5 shadow-sm' 
                      : 'border-line bg-surface-2'
                  }`}
                >
                  {/* Fila del Jugador */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-fg truncate">
                          {p.first_name} {p.last_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line font-mono font-semibold text-fg-muted">
                          {p.position} · {p.age} años
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-accent mt-0.5 flex items-center gap-1">
                        {isCalled ? <CheckCircle2 className="size-3 text-accent" /> : <Eye className="size-3 text-gold" />}
                        {item.headline}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-base font-black text-fg">
                        {p.attr_overall || 50}
                      </span>
                      <p className="text-[9px] uppercase font-bold text-fg-subtle">Media OVR</p>
                    </div>
                  </div>

                  {/* Impacto Dual: Beneficios vs Tensión/Costo */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60 text-[11px]">
                    {/* Beneficios */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">
                        Honor & Premio
                      </span>
                      <p className="text-fg-muted flex items-center gap-1">
                        <Sparkles className="size-3 text-gold shrink-0" />
                        +{item.benefits.valueBoost}% Valor de mercado
                      </p>
                      <p className="text-fg-muted flex items-center gap-1">
                        <TrendingUp className="size-3 text-accent shrink-0" />
                        +{formatMoney(item.benefits.allowance)} por cesión
                      </p>
                    </div>

                    {/* Costos / Tensión */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-danger uppercase tracking-wider block">
                        Costo de Fecha FIFA
                      </span>
                      <p className="text-fg-muted flex items-center gap-1">
                        <Zap className="size-3 text-gold shrink-0" />
                        -{item.costs.fatigue}% físico al volver
                      </p>
                      <p className="text-fg-muted flex items-center gap-1">
                        <AlertTriangle className="size-3 text-danger shrink-0" />
                        +{item.costs.injuryRisk}% riesgo de lesión
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
