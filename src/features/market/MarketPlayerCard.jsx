import React from 'react'
import { Eye, Handshake, Lock } from 'lucide-react'
import { Card, CardBody, Button, NamedIcon } from '../../components/ui'
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
    <Card as="article" className={hierarchy?.tone === 'gold' ? 'border-gold/50' : undefined}>
      <CardBody className="space-y-2 p-3">
        {/* Identidad y nivel */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold leading-snug text-fg">{player.first_name} {player.last_name}</h3>
            <p className="truncate text-xs text-fg-muted">{player.clubs?.name || 'Agente libre'} · {player.age} años</p>
          </div>
          <div className="text-right">
            <p className="num font-display text-3xl font-bold leading-none text-fg">{player.attr_overall || player.overall || '—'}</p>
            <p className="eyebrow">Nivel</p>
          </div>
        </div>

        {/* Posición, jerarquía, rasgo y atributos ojeados en una franja */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className={`rounded-sm border px-1.5 font-display text-sm font-bold uppercase tracking-wide ${theme.headerBg}`}>{player.position}</span>
          {hierarchy && (
            <span className={`rounded-full border px-2 text-[11px] font-bold ${hierarchy.className}`}>
              {hierarchy.icon && <NamedIcon name={hierarchy.icon} className="mr-1 inline size-3 align-[-1px]" />}{hierarchy.label}
            </span>
          )}
          <span className="text-fg-muted">Ritmo <b className="num font-display text-sm text-fg"><Revealed scouted={scouted} value={player.attr_pace} hidden={hiddenRange(player.attr_pace)} /></b></span>
          <span className="text-fg-muted">Potencial <b className="num font-display text-sm text-fg"><Revealed scouted={scouted} value={player.attr_potential} hidden="?" /></b></span>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-fg-muted">
          <NamedIcon name={trait.icon} className="mt-0.5 size-3.5 shrink-0 text-accent" />
          <span><b className="font-semibold text-fg">{trait.label}:</b> {trait.desc}</span>
        </p>

        <p className="text-xs">
          <span className="text-fg-muted">Comparativa de puesto: </span>
          <span className={`font-semibold ${comparison.status === 'improves' ? 'text-accent' : comparison.status === 'rotates' ? 'text-gold' : comparison.status === 'uncovered' ? 'text-primary' : 'text-fg-muted'}`}>{comparison.text}</span>
        </p>

        {scouted && insights.length > 0 && (
          <ul className="space-y-0.5 border-t border-line pt-1.5 text-xs" aria-label="Lectura del ojeador">
            {insights.map((line) => (
              <li key={line.text} className={line.tone === 'good' ? 'text-accent' : line.tone === 'warn' ? 'text-warning' : 'text-fg-muted'}>• {line.text}</li>
            ))}
          </ul>
        )}

        {/* Economía y acción */}
        <div className="flex items-end justify-between gap-3 border-t border-line pt-2">
          <div>
            <span className="eyebrow">Cotización</span>
            <p className="num font-display text-lg font-bold leading-tight text-fg">{scouted ? formatMoney(price) : 'Desconocida'}</p>
            <p className="text-[11px] text-fg-subtle">Sueldo aprox: {formatMoney(weeklyWage)}/sem</p>
          </div>
          <div className="text-right">
            <span className="eyebrow">Caja después</span>
            <p className={`num font-display text-base font-bold leading-tight ${financialImpact.isTight ? 'text-warning' : 'text-fg-muted'}`}>{formatMoney(Math.max(0, financialImpact.cashLeft))}</p>
            {financialImpact.isTight && <span className="block text-[10px] font-medium text-warning">Caja ajustada</span>}
          </div>
        </div>

        {!scouted ? (
          <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs font-semibold" onClick={() => onScout(player)} aria-label={`Ojear a ${player.first_name} ${player.last_name}`}>
            <Eye className="size-3.5" />Ojear a {player.first_name} {player.last_name} · {formatMoney(SCOUT_COST)}
          </Button>
        ) : (
          <Button size="sm" variant="primary" disabled={!!blocked} className="w-full gap-1.5 text-xs font-semibold" onClick={() => onNegotiate(player)} aria-label={`Ofertar por ${player.first_name} ${player.last_name}`}>
            {blocked ? <Lock className="size-3.5" /> : <Handshake className="size-3.5" />}{blocked || 'Negociar fichaje'}
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
