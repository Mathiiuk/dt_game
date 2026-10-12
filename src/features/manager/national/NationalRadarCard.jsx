import React from 'react'
import { AlertTriangle, CheckCircle2, Eye, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { Card, CardBody, Badge } from '../../../components/ui'
import { formatMoney } from '../../../lib/format'

export default function NationalRadarCard({ radar }) {
  const { players = [], country, calledUpCount = 0, inRadarCount = 0 } = radar || {}

  return (
    <Card as="section" aria-label="Radar de convocatorias">
      <CardBody className="space-y-2 p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
          <div>
            <h3 className="font-slab text-base font-bold text-fg">
              Radar de convocatorias ({country?.nickname || 'Nacional'})
              {calledUpCount > 0 && <Badge tone="accent" className="ml-2 align-middle">{calledUpCount} {calledUpCount === 1 ? 'Convocado' : 'Convocados'}</Badge>}
            </h3>
            <p className="text-xs text-fg-muted">Seguimiento oficial del cuerpo técnico nacional sobre los futbolistas de tu club.</p>
          </div>
          <p className="text-xs text-fg-subtle">En la mira: <span className="num font-display text-sm font-bold text-fg">{inRadarCount} promesas</span></p>
        </div>

        {players.length === 0 ? (
          <p className="py-2 text-xs text-fg-muted"><b className="font-semibold text-fg">El seleccionador aún no puso los ojos en tu club.</b> Para llamar la atención del radar, tus jugadores deben destacar en su categoría con alta media o rachas goleadoras. ¡Seguí potenciando la cantera!</p>
        ) : (
          <ul className="divide-y divide-line">
            {players.map((item) => {
              const p = item.player
              const isCalled = item.status === 'called_up'
              return (
                <li key={p.id} className="space-y-1.5 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{p.first_name} {p.last_name} <span className="text-xs font-normal text-fg-muted">· {p.position} · {p.age} años</span></p>
                      <p className="flex items-center gap-1 text-xs font-semibold text-accent">
                        {isCalled ? <CheckCircle2 className="size-3" /> : <Eye className="size-3 text-gold" />}
                        {item.headline}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="num font-display text-2xl font-bold leading-none text-fg">{p.attr_overall || 50}</p>
                      <p className="eyebrow">Media OVR</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-0.5">
                      <span className="eyebrow block text-accent">Honor y premio</span>
                      <p className="flex items-center gap-1 text-fg-muted"><Sparkles className="size-3 shrink-0 text-gold" />+{item.benefits.valueBoost}% Valor de mercado</p>
                      <p className="flex items-center gap-1 text-fg-muted"><TrendingUp className="size-3 shrink-0 text-accent" />+{formatMoney(item.benefits.allowance)} por cesión</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="eyebrow block text-danger">Costo de la fecha FIFA</span>
                      <p className="flex items-center gap-1 text-fg-muted"><Zap className="size-3 shrink-0 text-gold" />-{item.costs.fatigue}% físico al volver</p>
                      <p className="flex items-center gap-1 text-fg-muted"><AlertTriangle className="size-3 shrink-0 text-danger" />+{item.costs.injuryRisk}% riesgo de lesión</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
