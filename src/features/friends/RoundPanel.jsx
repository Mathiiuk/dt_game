import React, { useEffect, useState } from 'react'
import { Check, Clock, Flag, Target } from 'lucide-react'
import { Badge, Button, Card, CardBody, ChoiceChips, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { CHEERS, STANCES, canPick, pickLabel, stanceById, timeLeft } from '../../domain/friendPlans'

const PICKS = [['L', 'Local'], ['E', 'Empate'], ['V', 'Visita']]

/** Pasos de la fecha: cuáles faltan y en cuál abrir (el primero pendiente) */
export function roundSteps({ plan, picks, nextFixtures, status }) {
  const picked = nextFixtures.filter(f => picks[f.id]).length
  const waiting = status.filter(s => !s.ready).length
  const steps = [
    { id: 'planteo', label: 'Planteo', done: Boolean(plan) },
    { id: 'prode', label: 'Prode', done: nextFixtures.length === 0 || picked === nextFixtures.length, detail: nextFixtures.length ? `${picked}/${nextFixtures.length}` : '' },
    { id: 'quienes', label: 'Listos', done: waiting === 0, detail: status.length ? `${status.length - waiting}/${status.length}` : '' }
  ]
  const pending = steps.filter(s => !s.done && s.id !== 'quienes')
  return { steps, pending, first: (pending[0] || steps[2]).id }
}

/** Lo que se hace antes de que cierre la fecha, en tres pasos: elegir el planteo, pronosticar los partidos y ver quién falta */
export default function RoundPanel({ room, fixtures, names, info, isOwner, busy, onSavePlan, onPredict, onClose }) {
  const { status, prode, plan, picks } = info
  const [stance, setStance] = useState(plan?.stance || 'EQUILIBRADO')
  const [cheer, setCheer] = useState(plan?.cheer || 'GARRA')
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { setStance(plan?.stance || 'EQUILIBRADO'); setCheer(plan?.cheer || 'GARRA') }, [plan?.stance, plan?.cheer, room.current_round])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t) }, [])

  const next = fixtures.filter(f => f.round === room.current_round + 1)
  const left = timeLeft(room.round_deadline, now)
  const saved = plan && plan.stance === stance && plan.cheer === cheer
  const waiting = status.filter(s => !s.ready).length
  const { steps, pending, first } = roundSteps({ plan, picks, nextFixtures: next, status })
  // Se abre en el primer paso pendiente; después manda lo que elija la persona
  const [chosen, setChosen] = useState(null)
  const tab = chosen || first

  return (
    <Card as="div"><CardBody className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-fg">Fecha {room.current_round + 1}</h3>
        {left && <Badge tone={left === 'venció' ? 'danger' : 'gold'}><Clock className="mr-1 size-3.5" aria-hidden="true" />{left === 'venció' ? 'Plazo vencido' : `Cierra en ${left}`}</Badge>}
      </div>
      <p role="status" className={pending.length ? 'text-sm font-semibold text-warning' : 'text-sm font-semibold text-accent'}>
        {pending.length ? `Te ${pending.length === 1 ? 'falta 1 paso' : `faltan ${pending.length} pasos`}: ${pending.map(p => p.label.toLowerCase()).join(' y ')}.` : 'Todo listo. La fecha se juega cuando eligen todos o vence el plazo.'}
      </p>

      <Tabs value={tab} onValueChange={setChosen}>
        <TabsList aria-label="Pasos de la fecha">
          {steps.map((s, i) => (
            <TabsTrigger key={s.id} value={s.id} className="flex items-center gap-1 px-2.5">
              <span className="num text-fg-subtle">{i + 1}</span>{s.label}
              {s.done ? <Check className="size-3.5 text-accent" aria-label="hecho" /> : s.detail && <span className="num text-xs text-fg-subtle">{s.detail}</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="planteo" className="space-y-2">
          <p className="text-sm text-fg-muted">Elegí cómo juega tu equipo. Es un piedra-papel-tijera: si le pegás al planteo del rival, tu equipo suma fuerza. Solo cambia el resultado de esta sala, no tu club.</p>
          <ChoiceChips label="Planteo" value={stance} onChange={setStance} options={STANCES.map(s => ({ value: s.id, label: s.name }))} />
          <p className="text-sm text-fg-subtle">{stanceById(stance)?.blurb}</p>
          <ChoiceChips label="Arenga" value={cheer} onChange={setCheer} options={CHEERS.map(c => ({ value: c.id, label: c.name }))} />
          <p className="text-sm text-fg-subtle">{CHEERS.find(c => c.id === cheer)?.blurb}</p>
          <Button onClick={() => onSavePlan(stance, cheer)} loading={busy} disabled={saved}>{saved ? <><Check />Planteo guardado</> : 'Guardar planteo'}</Button>
        </TabsContent>

        <TabsContent value="prode" className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-fg"><Target className="size-4 text-accent" aria-hidden="true" />Prode de la fecha</h4>
          <p className="text-sm text-fg-subtle">Cada acierto da 1 punto de prode y 5 mangos.</p>
          {next.length === 0 && <p className="text-sm text-fg-muted">Todavía no están los cruces de esta fecha.</p>}
          <ul className="space-y-3">
            {next.map(f => {
              const labels = { home: names[f.home_slot], away: names[f.away_slot] }
              return (
                <li key={f.id} className="space-y-1.5">
                  <p className="truncate text-sm text-fg">{labels.home} <span className="text-fg-subtle">vs</span> {labels.away}</p>
                  <div role="radiogroup" aria-label={`Pronóstico: ${labels.home} vs ${labels.away}`} className="grid grid-cols-3 gap-1.5">
                    {PICKS.filter(([v]) => canPick(f, v)).map(([v, label]) => (
                      <button key={v} type="button" role="radio" aria-checked={picks[f.id] === v} aria-label={pickLabel(v, labels)} disabled={busy}
                        onClick={() => onPredict(f.id, v)}
                        className={`min-h-11 rounded-md border px-2 text-xs font-semibold transition-colors ${picks[f.id] === v ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface-2 text-fg-muted hover:text-fg'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
          {prode.some(p => p.prode > 0) && (
            <div className="space-y-1.5 border-t border-line pt-3">
              <h4 className="text-sm font-semibold text-fg">Ranking del prode</h4>
              <ol className="space-y-1 text-sm text-fg-muted">
                {prode.map((p, i) => <li key={p.user_id} className="flex justify-between gap-2"><span className="min-w-0 truncate">{i + 1}. {p.club_name}{p.is_me ? ' (vos)' : ''}</span><span className="num font-semibold text-fg">{p.prode}</span></li>)}
              </ol>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quienes" className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-fg"><Flag className="size-4 text-accent" aria-hidden="true" />Quiénes ya eligieron</h4>
          <ul className="flex flex-wrap gap-2">
            {status.map(s => <li key={s.user_id}><Badge tone={s.ready ? 'accent' : 'neutral'}>{s.ready ? '✓ ' : '… '}{s.club_name}{s.is_me ? ' (vos)' : ''}</Badge></li>)}
          </ul>
          <p className="text-sm text-fg-subtle">{waiting === 0 ? 'Están todos: la fecha se juega apenas alguien abra la sala.' : `Faltan ${waiting}. Si no eligen, juegan Equilibrado cuando venza el plazo.`}</p>
        </TabsContent>
      </Tabs>

      {isOwner && <Button variant="outline" onClick={onClose} loading={busy}>Cerrar la fecha ahora</Button>}
    </CardBody></Card>
  )
}
