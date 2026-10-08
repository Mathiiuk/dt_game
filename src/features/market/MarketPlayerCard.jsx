import React from 'react'
import { Eye, Handshake, Lock, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react'
import { Card, CardBody, Badge, Button, Stat } from '../../components/ui'
import { formatMoney } from '../../lib/format'
import {
  getPositionColorTheme,
  getMarketHierarchyTag,
  getMarketPlayerTrait,
  compareWithStarter,
  calculateSigningImpact,
  marketPrice,
  isScouted,
  hiddenRange,
  offerBlockReason,
  SCOUT_COST
} from '../../domain/market'
import { scoutInsights } from '../../domain/scoutInsights'
import { playerDemands } from '../../domain/contractDemands'

const Revealed = ({ scouted, value, hidden }) => (
  scouted ? <>{value ?? '—'}</> : <span className="text-fg-subtle">{hidden}</span>
)

export default function MarketPlayerCard({
  player,
  allPlayers = [],
  ownSquad = [],
  budget = 0,
  wageBudgetWeekly = 0,
  currentPayroll = 0,
  isOpen = true,
  onScout,
  onNegotiate
}) {
  const scouted = isScouted(player)
  const theme = getPositionColorTheme(player.position)
  const hierarchy = getMarketHierarchyTag(player, allPlayers)
  const trait = getMarketPlayerTrait(player)
  const comparison = compareWithStarter(player, ownSquad)
  const price = marketPrice(player)
  const demands = playerDemands(player)
  const weeklyWage = demands.expectedWage || Math.round(price * 0.05)
  const blocked = offerBlockReason(player, { isOpen, budget })

  const financialImpact = calculateSigningImpact({
    fee: price,
    budget,
    weeklyWage,
    currentPayroll,
    wageBudgetWeekly
  })

  const insights = scouted
    ? scoutInsights({ player, squad: ownSquad, price })
    : []

  return (
    <Card
      as="article"
      className={`group relative flex flex-col overflow-hidden border transition-all duration-200 hover:shadow-lg ${
        hierarchy?.tone === 'gold'
          ? 'border-amber-500/60 shadow-amber-500/10'
          : 'border-line hover:border-line-focus'
      } bg-surface`}
    >
      {/* 1. Cabecera Figurita Panini con color temático */}
      <div className={`relative px-4 py-3 border-b flex items-center justify-between ${theme.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-sm tracking-wide uppercase px-2 py-0.5 rounded bg-surface/80 border border-current shadow-xs">
            {player.position}
          </span>
          {hierarchy && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${hierarchy.className}`}>
              {hierarchy.label}
            </span>
          )}
        </div>

        {/* OVR Principal con marco arcade */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Nivel</span>
          <div className="flex items-center justify-center size-9 rounded-full bg-surface text-fg font-display text-lg font-black shadow-md border-2 border-current">
            {player.attr_overall || player.overall || '—'}
          </div>
        </div>
      </div>

      <CardBody className="flex flex-1 flex-col justify-between p-4 space-y-3.5">
        {/* 2. Identidad del Jugador y Rasgo Cómico */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-fg group-hover:text-accent transition-colors">
                {player.first_name} {player.last_name}
              </h3>
              <p className="truncate text-xs text-fg-muted">
                {player.clubs?.name || 'Agente libre'} · {player.age} años
              </p>
            </div>
          </div>

          {/* Micro-badge de rasgo de personalidad cómico */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-2 border border-line text-xs font-medium text-fg">
            <span aria-hidden="true">{trait.icon}</span>
            <span className="font-semibold">{trait.label}:</span>
            <span className="text-fg-subtle truncate max-w-[190px]">{trait.desc}</span>
          </div>
        </div>

        {/* 3. Comparación con el Titular Actual del Plantel */}
        <div className="rounded-lg bg-surface-2/60 border border-line/60 p-2 text-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-fg-muted font-medium">Comparativa de puesto:</span>
            <span
              className={`font-semibold ${
                comparison.status === 'improves'
                  ? 'text-emerald-400'
                  : comparison.status === 'rotates'
                  ? 'text-amber-400'
                  : comparison.status === 'uncovered'
                  ? 'text-sky-400'
                  : 'text-fg-muted'
              }`}
            >
              {comparison.text}
            </span>
          </div>
        </div>

        {/* 4. Atributos Técnicos (Scouted vs Rango oculto) */}
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-surface-2/40 border border-line/40 p-2 text-center">
          <div>
            <dt className="eyebrow text-[10px]">Nivel</dt>
            <dd className="num font-display text-xl font-bold leading-tight text-fg">
              {player.attr_overall || player.overall || '—'}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-[10px]">Ritmo</dt>
            <dd className="num font-display text-xl font-bold leading-tight text-fg">
              <Revealed
                scouted={scouted}
                value={player.attr_pace}
                hidden={<span className="text-sm font-semibold">{hiddenRange(player.attr_pace)}</span>}
              />
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-[10px]">Potencial</dt>
            <dd className="num font-display text-xl font-bold leading-tight text-fg">
              <Revealed
                scouted={scouted}
                value={player.attr_potential}
                hidden={<span className="text-sm font-semibold text-fg-subtle">?</span>}
              />
            </dd>
          </div>
        </dl>

        {/* 5. Lectura del Ojeador (si fue ojeado) */}
        {scouted && insights.length > 0 && (
          <ul className="space-y-1 text-xs border-t border-line/60 pt-2" aria-label="Lectura del ojeador">
            {insights.map((line) => (
              <li
                key={line.text}
                className={`truncate ${
                  line.tone === 'good'
                    ? 'text-accent'
                    : line.tone === 'warn'
                    ? 'text-warning'
                    : 'text-fg-muted'
                }`}
              >
                • {line.text}
              </li>
            ))}
          </ul>
        )}

        {/* 6. Economía: Precio + Sueldo + Caja después */}
        <div className="border-t border-line pt-3 space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="eyebrow text-[10px]">Cotización</span>
              <p className="font-display text-lg font-bold text-fg">
                {scouted ? formatMoney(price) : 'Desconocida'}
              </p>
              <p className="text-[11px] text-fg-subtle">
                Sueldo aprox: {formatMoney(weeklyWage)}/sem
              </p>
            </div>

            <div className="text-right">
              <span className="eyebrow text-[10px]">Caja después</span>
              <p
                className={`font-display text-sm font-bold ${
                  financialImpact.isTight ? 'text-warning' : 'text-fg-muted'
                }`}
              >
                {formatMoney(Math.max(0, financialImpact.cashLeft))}
              </p>
              {financialImpact.isTight && (
                <span className="text-[10px] text-warning font-medium block">
                  Caja ajustada
                </span>
              )}
            </div>
          </div>

          {/* 7. Botón de Acción Principal */}
          <div className="pt-1">
            {!scouted ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs font-semibold gap-1.5"
                onClick={() => onScout(player)}
                aria-label={`Ojear a ${player.first_name} ${player.last_name}`}
              >
                <Eye className="size-3.5" />
                Ojear a {player.first_name} {player.last_name} · {formatMoney(SCOUT_COST)}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                disabled={!!blocked}
                className="w-full text-xs font-semibold gap-1.5 shadow-sm"
                onClick={() => onNegotiate(player)}
                aria-label={`Ofertar por ${player.first_name} ${player.last_name}`}
              >
                {blocked ? <Lock className="size-3.5" /> : <Handshake className="size-3.5" />}
                {blocked || 'Negociar fichaje'}
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
