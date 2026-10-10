import React, { useEffect, useState } from 'react'
import { Gavel, Vote, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { competitionApi } from '../../api/competition'
import { leagueVoteApi } from '../../api/leagueVote'
import { RULESETS } from '../../domain/leagueRules'
import { Badge, Button } from '../../components/ui'
import { friendlyError } from '../../lib/errors'

const nameOf = (id) => RULESETS.find(r => r.id === id)

/**
 * Asamblea de la AFA: antes de cerrar la temporada el DT vota el reglamento del año que viene entre 3 propuestas,
 * y los otros 19 DT de la liga votan también (cada uno a su manera). `onStatus` avisa: 'loading' | 'ready' | 'done' | 'failed'.
 */
export default function AssemblyCard({ club, nextYear, onStatus }) {
  const [state, setState] = useState({ status: 'loading', ballot: [], result: null })
  const [busy, setBusy] = useState(false)

  const update = (patch) => setState(prev => {
    const next = { ...prev, ...patch }
    onStatus?.(next.status)
    return next
  })

  useEffect(() => {
    let alive = true
    leagueVoteApi.getBallot(club.id, nextYear).then(async ({ ballot, vote }) => {
      if (!alive) return
      if (vote?.winner) {
        const result = await leagueVoteApi.castVote({ clubId: club.id, seasonYear: nextYear, choice: vote.user_vote, rivals: [] })
        if (alive) update({ status: 'done', ballot, result })
      } else {
        update({ status: 'ready', ballot })
      }
    }).catch(() => { if (alive) update({ status: 'failed' }) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club.id, nextYear])

  const vote = async (choice) => {
    setBusy(true)
    try {
      const rows = await competitionApi.getStandings(club.id)
      const rivals = (rows || []).filter(r => r.club_id !== club.id).map(r => ({ id: r.club_id, name: r.clubs?.name }))
      const result = await leagueVoteApi.castVote({ clubId: club.id, seasonYear: nextYear, choice, rivals })
      update({ status: 'done', result })
    } catch (err) {
      toast.error(friendlyError(err, 'No pudimos registrar tu voto. Probá de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'loading' || state.status === 'failed') return null

  const { ballot, result } = state
  const winner = result ? nameOf(result.winner) : null
  const quips = result ? result.botVotes.slice(0, 4) : []

  return (
    <section aria-labelledby="assembly-title" className="rounded-lg border border-gold/50 bg-surface-2 p-4">
      <h3 id="assembly-title" className="flex items-center gap-2 font-display text-lg font-semibold text-fg">
        <Gavel className="size-4.5 text-gold" aria-hidden="true" />Asamblea de la AFA {nextYear}
      </h3>
      {state.status === 'ready' && (
        <>
          <p className="mt-1 text-sm text-fg-muted">Los 20 DT de tu liga votan cómo se juega el torneo del año que viene. Elegí una propuesta: la que junte más votos se aplica a las cinco divisiones.</p>
          <ul className="mt-3 space-y-2">
            {ballot.map(id => {
              const r = nameOf(id)
              return (
                <li key={id} className="rounded-lg border border-line bg-surface p-3">
                  <p className="font-semibold text-fg">{r?.name}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{r?.blurb}</p>
                  <Button size="sm" variant="secondary" className="mt-2" loading={busy} onClick={() => vote(id)}><Vote />Votar esta</Button>
                </li>
              )
            })}
          </ul>
        </>
      )}
      {state.status === 'done' && winner && (
        <div role="status" className="mt-2 space-y-3">
          <p className="flex items-center gap-2 text-sm text-fg"><CheckCircle2 className="size-4 text-accent" aria-hidden="true" />Ganó <strong className="font-semibold">{winner.name}</strong></p>
          <p className="text-sm text-fg-muted">{winner.blurb}</p>
          <ul className="space-y-1.5">
            {ballot.map(id => (
              <li key={id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-fg-muted">{nameOf(id)?.name}</span>
                <Badge tone={id === result.winner ? 'accent' : 'neutral'} className="num">{result.counts[id] ?? 0} votos</Badge>
              </li>
            ))}
          </ul>
          {quips.length > 0 && (
            <ul className="space-y-1 text-xs text-fg-subtle">
              {quips.map(v => <li key={v.clubId}>{v.quip}</li>)}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
