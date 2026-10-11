import React, { useMemo } from 'react'
import { Trophy, Play } from 'lucide-react'
import { Badge, Button, Card, CardBody } from '../../components/ui'

/** Liga de la sala en juego (o terminada): tabla completa, resultados de la última fecha y la próxima */
export default function LeagueView({ room, table, teams, fixtures, isOwner, busy, onPlayRound }) {
  const names = useMemo(() => Object.fromEntries((teams || []).map(t => [t.slot, t.name])), [teams])
  const done = room.status === 'DONE'
  const last = fixtures.filter(f => f.round === room.current_round)
  const next = fixtures.filter(f => f.round === room.current_round + 1)
  const champion = done ? table[0] : null

  const row = (f) => (
    <li key={`${f.round}-${f.home_slot}`} className="flex items-center justify-between gap-2 text-sm">
      <span className="min-w-0 flex-1 truncate text-right text-fg-muted">{names[f.home_slot]}</span>
      <span className="num w-14 shrink-0 text-center font-semibold text-fg">{f.home_goals == null ? 'vs' : `${f.home_goals} - ${f.away_goals}`}</span>
      <span className="min-w-0 flex-1 truncate text-fg-muted">{names[f.away_slot]}</span>
    </li>
  )

  return (
    <div className="space-y-5">
      {champion && (
        <div role="status" className="flex items-center gap-3 rounded-lg border border-gold/50 bg-surface-2 p-4">
          <Trophy className="size-6 text-gold" aria-hidden="true" />
          <p className="font-display text-lg font-semibold text-fg">¡{champion.name} es el campeón de {room.name}!</p>
        </div>
      )}

      <Card as="div"><CardBody className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Fecha <strong className="num text-fg">{room.current_round}</strong> de <strong className="num text-fg">{room.total_rounds}</strong></p>
        {isOwner && !done && <Button onClick={onPlayRound} loading={busy}><Play />Jugar fecha {room.current_round + 1}</Button>}
        {!isOwner && !done && <p className="text-sm text-fg-subtle">Las fechas las juega quien armó la sala.</p>}
      </CardBody></Card>

      <Card as="div" className="overflow-hidden">
        <table className="w-full table-fixed text-left text-sm" aria-label="Tabla de la liga de la sala">
          <thead><tr className="border-b border-line bg-surface-2 text-fg-subtle">
            <th scope="col" className="eyebrow w-9 py-3 pl-2 text-center sm:w-10 sm:pl-3">#</th>
            <th scope="col" className="eyebrow py-3">Club</th>
            <th scope="col" className="eyebrow w-9 py-3 text-right">PJ</th>
            {['PG', 'PE', 'PP'].map(h => <th key={h} scope="col" className="eyebrow hidden w-10 py-3 text-right sm:table-cell">{h}</th>)}
            <th scope="col" className="eyebrow w-10 py-3 text-right">DG</th>
            <th scope="col" className="eyebrow hidden w-12 py-3 text-right sm:table-cell">Trav.</th>
            <th scope="col" className="eyebrow w-11 py-3 pr-3 text-right">Pts</th>
          </tr></thead>
          <tbody>
            {table.map((t, i) => (
              <tr key={t.slot} className={t.is_me ? 'bg-accent-soft/40' : ''}>
                <td className="num py-2.5 pl-2 text-center text-fg-muted sm:pl-3">{i + 1}</td>
                <td className="py-2.5 pr-1">
                  <span className="block truncate font-semibold text-fg">{t.name}</span>
                  {(t.is_me || t.is_bot) && (
                    <span className="mt-0.5 flex gap-1">
                      {t.is_me && <Badge tone="accent">Vos</Badge>}
                      {t.is_bot && <Badge tone="neutral">Bot</Badge>}
                    </span>
                  )}
                </td>
                <td className="num py-2.5 text-right text-fg-muted">{t.played}</td>
                <td className="num hidden py-2.5 text-right text-fg-muted sm:table-cell">{t.won}</td>
                <td className="num hidden py-2.5 text-right text-fg-muted sm:table-cell">{t.drawn}</td>
                <td className="num hidden py-2.5 text-right text-fg-muted sm:table-cell">{t.lost}</td>
                <td className="num py-2.5 text-right text-fg-muted">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                <td className="num hidden py-2.5 text-right text-fg-muted sm:table-cell">{t.bonus > 0 ? `+${t.bonus}` : t.bonus}</td>
                <td className="num py-2.5 pr-3 text-right font-semibold text-fg">{t.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        {last.length > 0 && (
          <Card as="div"><CardBody className="space-y-2">
            <h3 className="font-display text-base font-semibold text-fg">Resultados de la fecha {room.current_round}</h3>
            <ul className="space-y-1.5">{last.map(row)}</ul>
          </CardBody></Card>
        )}
        {next.length > 0 && (
          <Card as="div"><CardBody className="space-y-2">
            <h3 className="font-display text-base font-semibold text-fg">Próxima fecha ({room.current_round + 1})</h3>
            <ul className="space-y-1.5">{next.map(row)}</ul>
          </CardBody></Card>
        )}
      </div>
    </div>
  )
}
