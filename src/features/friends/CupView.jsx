import React, { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Badge, Card, CardBody } from '../../components/ui'
import FixtureRow from './FixtureRow'
import MatchStory from './MatchStory'
import { cupPlan, groupLetter, roundLabel, isKnockoutRound } from '../../domain/friendCup'

/** Copa Mundial de la sala: tablas de cada grupo, llaves de eliminación directa y la próxima fecha */
export default function CupView({ room, groups, teams, fixtures, panel }) {
  const [story, setStory] = useState(null)
  const names = useMemo(() => Object.fromEntries((teams || []).map(t => [t.slot, t.name])), [teams])
  const plan = cupPlan((teams || []).length)
  const done = room.status === 'DONE'
  const byGroup = useMemo(() => {
    const m = new Map()
    for (const r of groups || []) m.set(r.group_no, [...(m.get(r.group_no) || []), r])
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [groups])
  const knockout = fixtures.filter(f => f.stage === 'LLAVE')
  const finalMatch = done ? knockout.find(f => f.round === room.total_rounds) : null
  const nextRound = room.current_round + 1
  const nextLabel = roundLabel(nextRound, plan.teams)

  const match = (f) => <FixtureRow key={`${f.round}-${f.home_slot}`} fixture={f} names={names} onOpen={setStory} />

  return (
    <div className="space-y-5">
      {finalMatch && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-gold/50 bg-surface-2 p-4">
          <Trophy className="size-6 text-gold" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-fg">¡{names[finalMatch.winner_slot]} es campeón del mundo en {room.name}!</p>
        </div>
      )}

      <Card as="div"><CardBody className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Fecha <strong className="num text-fg">{room.current_round}</strong> de <strong className="num text-fg">{room.total_rounds}</strong>{!done && <> · sigue: <strong className="text-fg">{nextLabel}</strong></>}</p>
      </CardBody></Card>

      {!done && panel}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        {byGroup.map(([no, rows]) => (
          <Card as="div" key={no} className="min-w-0 overflow-hidden">
            <table className="w-full table-fixed text-left text-sm" aria-label={`Grupo ${groupLetter(no)}`}>
              <thead><tr className="border-b border-line bg-surface-2 text-fg-subtle">
                <th scope="col" className="eyebrow py-2.5 pl-3">Grupo {groupLetter(no)}</th>
                {['PJ', 'DG'].map(h => <th key={h} scope="col" className="eyebrow w-10 py-2.5 text-right">{h}</th>)}
                <th scope="col" className="eyebrow w-11 py-2.5 pr-3 text-right">Pts</th>
              </tr></thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.slot} className={`${t.is_me ? 'bg-accent-soft/40' : ''} ${t.pos <= 2 ? 'border-l-2 border-accent' : 'border-l-2 border-transparent'}`}>
                    <td className="py-2 pl-3">
                      <span className="block truncate font-semibold text-fg">{t.name}</span>
                      {(t.is_me || t.is_bot) && (
                        <span className="mt-0.5 flex gap-1">
                          {t.is_me && <Badge tone="accent">Vos</Badge>}
                          {t.is_bot && <Badge tone="neutral">Bot</Badge>}
                        </span>
                      )}
                    </td>
                    <td className="num py-2 text-right text-fg-muted">{t.played}</td>
                    <td className="num py-2 text-right text-fg-muted">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                    <td className="num py-2 pr-3 text-right font-semibold text-fg">{t.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
      <p className="text-xs text-fg-subtle">Pasan los dos primeros de cada grupo. Tres puntos por victoria y uno por empate.</p>

      {plan.knockout.map(stage => {
        const round = 3 + plan.knockout.indexOf(stage) + 1
        const list = knockout.filter(f => f.round === round)
        if (list.length === 0) return null
        return (
          <Card as="div" key={stage}><CardBody className="space-y-2">
            <h3 className="font-display text-base font-semibold text-fg">{roundLabel(round, plan.teams)}</h3>
            <ul className="space-y-1.5">{list.map(match)}</ul>
          </CardBody></Card>
        )
      })}

      {room.current_round >= 1 && !isKnockoutRound(room.current_round) && (
        <Card as="div"><CardBody className="space-y-2">
          <h3 className="font-display text-base font-semibold text-fg">Resultados: {roundLabel(room.current_round, plan.teams)}</h3>
          <ul className="space-y-1.5">{fixtures.filter(f => f.round === room.current_round).map(match)}</ul>
        </CardBody></Card>
      )}

      {!isKnockoutRound(room.current_round) && fixtures.filter(f => f.round === nextRound && f.stage === 'GRUPO').length > 0 && (
        <Card as="div"><CardBody className="space-y-2">
          <h3 className="font-display text-base font-semibold text-fg">{nextLabel}</h3>
          <ul className="space-y-1.5">{fixtures.filter(f => f.round === nextRound).map(match)}</ul>
        </CardBody></Card>
      )}
      <MatchStory fixture={story} names={names} onClose={() => setStory(null)} />
    </div>
  )
}
