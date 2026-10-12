import React, { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, Check, X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { dailyApi } from '../../api/dailyChallenge'
import { Button, Card, CardBody, DataStrip, Kicker, PageHeader, Segmented, Skeleton } from '../../components/ui'
import ShareMomentButton from '../../components/ShareMomentButton'
import { useGameContext } from '../../context/GameContext'
import { chipsFor } from '../../domain/demo'
import { speedBonus, yesterdayOf } from '../../domain/dailyTimer'
import { friendlyError } from '../../lib/errors'
import { track } from '../../lib/analytics'
import { cn } from '../../lib/utils'

const TOTAL = 3

/** Lo que cambió con cada decisión, ya jugado el reto */
function ResultList({ results }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {results.map((r) => (
        <li key={r.title} className="space-y-1 py-3">
          <p className="font-slab text-sm font-bold text-fg">{r.title}</p>
          <p className="text-xs text-fg-muted">Elegiste: <b className="font-semibold text-fg">{r.choice}</b></p>
          <p className="text-sm text-fg">{r.reaction}</p>
          <p className="flex flex-wrap gap-1.5 pt-0.5">
            {chipsFor(r.effects).map(c => (
              <span key={c.key} className={cn('rounded-sm px-1.5 text-xs font-semibold', c.delta > 0 ? 'bg-accent-soft text-accent' : 'bg-danger-soft text-danger')}>
                {c.label} {c.delta > 0 ? '+' : ''}{c.delta}
              </span>
            ))}
          </p>
        </li>
      ))}
    </ol>
  )
}

/** Tabla del día: global o solo mis compañeros de sala */
function Board({ today }) {
  const [scope, setScope] = useState('global')
  const [when, setWhen] = useState('today')
  const [rows, setRows] = useState(null)
  const [failed, setFailed] = useState(false)
  const yesterday = yesterdayOf(today)

  useEffect(() => {
    let alive = true
    setRows(null)
    setFailed(false)
    const friends = scope === 'friends'
    const request = when === 'yesterday' && yesterday ? dailyApi.board(friends, yesterday) : dailyApi.board(friends)
    request.then(r => { if (alive) setRows(r) }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [scope, when, yesterday])

  return (
    <section aria-label="Tabla del día" className="space-y-2">
      <div className="flex items-baseline gap-3">
        <h2 className="font-slab text-base font-bold text-fg">Tabla del día</h2>
        <span className="h-0 grow border-b border-line-strong" aria-hidden="true" />
      </div>
      {yesterday && (
        <Segmented
          label="Qué día mostrar en la tabla"
          value={when}
          onChange={setWhen}
          options={[{ value: 'today', label: 'Hoy' }, { value: 'yesterday', label: 'Ayer' }]}
        />
      )}
      <Segmented
        label="Quiénes aparecen en la tabla"
        value={scope}
        onChange={setScope}
        options={[{ value: 'global', label: 'Todos' }, { value: 'friends', label: 'Mis amigos' }]}
      />
      {failed ? (
        <p className="py-3 text-sm text-fg-muted">No pudimos cargar la tabla. Probá de nuevo en un rato.</p>
      ) : !rows ? (
        <Skeleton className="h-24" />
      ) : rows.length === 0 ? (
        <p className="py-3 text-sm text-fg-muted">{when === 'yesterday' ? 'Ayer no jugó nadie.' : 'Todavía no jugó nadie. ¡Sé el primero!'}</p>
      ) : (
        <table aria-label="Tabla del día" className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line-strong text-fg-subtle">
              <th scope="col" className="eyebrow w-10 py-1">#</th>
              <th scope="col" className="eyebrow py-1">Club</th>
              <th scope="col" className="eyebrow py-1 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={`${r.rank}-${r.club}-${r.score}`} aria-current={r.is_me ? 'true' : undefined} className={cn(r.is_me && 'bg-primary-soft')}>
                <td className="num py-1.5 font-display text-base font-bold text-fg">{r.rank}</td>
                <td className="py-1.5 font-semibold text-fg">{r.club}{r.is_me && <span className="ml-1.5 text-xs font-normal text-primary">(vos)</span>}</td>
                <td className="num py-1.5 text-right font-display text-base font-bold text-fg">
                  {r.score}{r.goal_met && <Check className="ml-1 inline size-3.5 text-accent" aria-label="cumplió el objetivo" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

/** Resultado: puntaje, puesto, objetivo, qué pasó en cada dilema y la tabla */
function Played({ goal, mine, clubName, today }) {
  return (
    <div className="space-y-4">
      <DataStrip label="Resumen del reto" items={[
        { label: 'Puntos', value: String(mine.score), tone: 'good' },
        { label: 'Puesto', value: mine.rank ? `${mine.rank}º` : '—', hint: mine.players ? `de ${mine.players}` : undefined },
        { label: 'Objetivo', value: mine.goal_met ? 'Cumplido' : 'No', tone: mine.goal_met ? 'good' : 'bad', hint: goal.text }
      ]} />
      {mine.bonus > 0 && <p className="text-sm font-semibold text-accent">Bonus por rapidez: +{mine.bonus}</p>}
      <ResultList results={mine.results || []} />
      <ShareMomentButton
        label="Compartir mi reto"
        variant="primary"
        moment={{ kind: 'daily', club: clubName, score: mine.score, rank: mine.rank, players: mine.players }}
      />
      <p className="text-xs text-fg-muted">Mañana hay un reto nuevo. Volvé y competí de nuevo.</p>
      <Board today={today} />
    </div>
  )
}

/** Los tres dilemas, de a uno; al final se envía todo junto y el servidor calcula el puntaje */
function Playing({ decisions, onSubmit, sending, secondsSinceStart }) {
  const [step, setStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [picks, setPicks] = useState([])
  const done = step >= decisions.length
  const current = decisions[step]

  // Cuenta regresiva del contrarreloj (el servidor es quien mide y da el bonus; esto solo la muestra)
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const rush = speedBonus((Number(secondsSinceStart) || 0) + elapsed)

  const choose = (id) => {
    setPicks(prev => [...prev.slice(0, step), id])
    setStep(step + 1)
  }

  return (
    <Card masthead as="section" aria-label="Dilemas del día">
      <CardBody className="space-y-3 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <Kicker>Dilema {Math.min(step + 1, TOTAL)} de {TOTAL}</Kicker>
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}><ChevronLeft />Volver</Button>
          )}
        </div>
        {rush.bonus > 0 && (
          <p className="text-xs font-semibold text-fg-muted">
            Contrarreloj: <span className="num text-fg">{rush.remaining} s</span> para sumar <span className="text-accent">+{rush.bonus}</span> puntos
          </p>
        )}
        {!done ? (
          <>
            <h2 className="font-slab text-lg font-bold leading-snug text-fg">{current.title}</h2>
            <p className="text-sm text-fg-muted">{current.body}</p>
            <div className="flex flex-col gap-2">
              {current.options.map(o => (
                <Button key={o.id} variant={picks[step] === o.id ? 'primary' : 'outline'} className="h-auto min-h-12 justify-start whitespace-normal py-2 text-left" onClick={() => choose(o.id)}>{o.label}</Button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="font-slab text-lg font-bold text-fg">Tus decisiones</h2>
            <ul className="divide-y divide-line border-y border-line text-sm">
              {decisions.map((d, i) => (
                <li key={d.id} className="py-2"><b className="font-semibold text-fg">{d.title}</b><br /><span className="text-fg-muted">{d.options.find(o => o.id === picks[i])?.label}</span></li>
              ))}
            </ul>
            <p className="text-xs text-fg-muted">Tenés un solo intento por día: una vez enviado, no se puede cambiar.</p>
            <Button className="w-full" loading={sending} onClick={() => onSubmit(picks)}>Enviar mi reto</Button>
          </>
        )}
      </CardBody>
    </Card>
  )
}

/** Reto del día: tres dilemas iguales para todos, un objetivo y una tabla (global o de amigos) */
export default function DailyChallengeScreen() {
  const { club } = useGameContext()
  const [state, setState] = useState({ status: 'loading', data: null })
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setState({ status: 'loading', data: null })
    try {
      setState({ status: 'ready', data: await dailyApi.get() })
    } catch (e) {
      setState({ status: 'error', data: null })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const submit = async (picks) => {
    setSending(true)
    try {
      const res = await dailyApi.submit(picks)
      track('daily_complete')
      setState(prev => ({ ...prev, data: { ...prev.data, mine: res } }))
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos guardar tu reto. Probá de nuevo.'))
      // Si ya había jugado desde otro dispositivo, se vuelve a pedir el estado
      load()
    } finally {
      setSending(false)
    }
  }

  const { status, data } = state
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:px-6 lg:py-6">
      <PageHeader eyebrow="Se renueva todos los días" title="Reto del día" showMobileTitle={false} />
      {status === 'loading' && <div role="status" aria-label="Cargando el reto"><Skeleton className="h-40" /></div>}
      {status === 'error' && (
        <Card as="div"><CardBody className="space-y-3 p-4">
          <p className="text-sm text-fg-muted">No pudimos cargar el reto de hoy.</p>
          <Button variant="outline" onClick={load}><RotateCcw />Reintentar</Button>
        </CardBody></Card>
      )}
      {status === 'ready' && data && (
        <>
          <Card masthead as="section" aria-label="Objetivo de hoy">
            <CardBody className="p-3 sm:p-4">
              <Kicker>Objetivo de hoy</Kicker>
              <p className="mt-0.5 flex items-start gap-2 font-slab text-base font-bold text-fg">
                {data.mine ? (data.mine.goal_met ? <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" /> : <X className="mt-1 size-4 shrink-0 text-danger" aria-hidden="true" />) : null}
                {data.goal.text}
              </p>
              {data.streak > 0 && <p className="mt-1 text-xs font-semibold text-gold">Racha: {data.streak} {data.streak === 1 ? 'día' : 'días'} seguidos jugando</p>}
              {!data.mine && <p className="mt-1 text-xs text-fg-muted">Tres dilemas, una sola oportunidad. Cada decisión mueve la Caja, la Barra, la Dirigencia y el Vestuario.</p>}
            </CardBody>
          </Card>
          {data.mine
            ? <Played goal={data.goal} mine={data.mine} clubName={club?.name} today={data.day} />
            : <Playing decisions={data.decisions} onSubmit={submit} sending={sending} secondsSinceStart={data.seconds_since_start} />}
        </>
      )}
    </div>
  )
}
