import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Share2, RotateCcw } from 'lucide-react'
import PublicHeader from '../home/PublicHeader'
import PublicFooter from '../home/PublicFooter'
import { FULL_SCREEN } from '../home/HomeLanding'
import { useVisitorState } from '../home/useVisitorState'
import PowerBar from '../match/PowerBar'
import { getPublicPage } from '../../data/publicPages'
import { SITE } from '../../data/site'
import { useSeo } from '../../seo/useSeo'
import { pageStructuredData } from '../../seo/structuredData'
import { DEMO_CLUB, DEMO_DECISIONS, DEMO_START, METERS, applyEffects, applyPenalty, chipsFor, headlines, playDemoMatch, verdictFor } from '../../domain/demo'
import { Badge, Button, Card, CardBody, Kicker, Progress } from '../../components/ui'
import { buttonVariants } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { track } from '../../lib/analytics'

const newSeed = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

/** Demo sin cuenta: "Tu primer día como DT" (3 decisiones, un partido con penal y los titulares del día siguiente) */
export default function DemoScreen() {
  const page = getPublicPage('/demo')
  const visitor = useVisitorState()
  useSeo({ title: page.title, description: page.description, path: page.path, jsonLd: pageStructuredData(page) })

  const [seed, setSeed] = useState(newSeed)
  const [step, setStep] = useState('intro') // intro | 0 | 1 | 2 | match | penalty | final
  const [stats, setStats] = useState({ ...DEMO_START })
  const [picked, setPicked] = useState(null) // { option } de la decisión en curso
  const [shown, setShown] = useState(0)
  const [match, setMatch] = useState(null)

  useEffect(() => { window.scrollTo?.(0, 0) }, [step])

  const base = useMemo(() => (step === 'match' || step === 'penalty' ? playDemoMatch(seed, stats) : null), [step, seed, stats])

  // El relato se va mostrando jugada por jugada (con "menos movimiento" aparece completo)
  useEffect(() => {
    if (step !== 'match' || !base) return undefined
    if (reducedMotion()) { setShown(base.events.length); return undefined }
    setShown(1)
    const timer = setInterval(() => setShown(n => (n < base.events.length ? n + 1 : n)), 900)
    return () => clearInterval(timer)
  }, [step, base])

  const decisionIndex = typeof step === 'number' ? step : null
  const decision = decisionIndex !== null ? DEMO_DECISIONS[decisionIndex] : null

  const start = () => { track('demo_start'); setStep(0) }
  const choose = (option) => {
    setPicked(option)
    setStats(s => applyEffects(s, option.effects))
    track('demo_decision')
  }
  const next = () => {
    setPicked(null)
    setStep(decisionIndex < DEMO_DECISIONS.length - 1 ? decisionIndex + 1 : 'match')
  }
  const kick = (quality) => {
    setMatch(applyPenalty(base, quality))
    setTimeout(() => { setStep('final'); track('demo_complete') }, reducedMotion() ? 0 : 1100)
  }
  const restart = () => { setSeed(newSeed()); setStats({ ...DEMO_START }); setPicked(null); setMatch(null); setShown(0); setStep('intro') }
  const share = async () => {
    const text = `Jugué "Tu primer día como DT" en Vestuario: ${match.club} ${match.score.me} - ${match.score.rival} ${match.rival}. Probalo vos:`
    try {
      if (navigator.share) await navigator.share({ title: 'Vestuario', text, url: `${SITE.url}/demo` })
      else await navigator.clipboard.writeText(`${text} ${SITE.url}/demo`)
    } catch { /* si cancelan, no pasa nada */ }
  }

  const live = match || base
  const verdict = match ? verdictFor(match, stats) : null

  return (
    <div className={`grid ${FULL_SCREEN} grid-rows-[auto_1fr_auto] bg-bg`}>
      <PublicHeader visitor={visitor} />
      <main className="mx-auto w-full max-w-3xl px-5 pb-12 pt-6 sm:pt-9">
        <Kicker>Demo gratis · sin cuenta</Kicker>
        <h1 className="mt-1 text-balance font-slab text-[2.25rem] font-extrabold leading-[1.05] tracking-tight text-fg sm:text-5xl">{page.h1}</h1>

        {step === 'intro' && (
          <section className="mt-5 space-y-4">
            <p className="border-b border-line-strong pb-4 text-lg leading-relaxed text-fg-muted">{page.intro}</p>
            <p className="leading-relaxed text-fg-muted">Dirigís al <strong className="text-fg">{DEMO_CLUB}</strong>, un club de barrio. Antes del partido se te cruzan la barra, un dirigente con un sobre y el árbitro. Cada respuesta mueve cuatro medidores: caja, barra, dirigencia y vestuario.</p>
            <Button size="lg" onClick={start} className="w-full sm:w-auto">Empezar la demo</Button>
            <p className="text-sm text-fg-subtle">Es una demo: no se guarda nada y no hace falta cuenta.</p>
          </section>
        )}

        {step !== 'intro' && (
          <ul aria-label="Medidores del club" className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-b-line-strong border-t-[3px] border-t-fg py-3 [border-top-style:double] sm:grid-cols-4">
            {METERS.map(m => (
              <li key={m.key} className="space-y-1">
                <p className="flex items-baseline justify-between"><span className="eyebrow">{m.label}</span><span className="num font-display text-xl font-bold leading-none text-fg">{stats[m.key]}</span></p>
                <Progress value={stats[m.key]} auto label={m.label} />
              </li>
            ))}
          </ul>
        )}

        {decision && (
          <section className="mt-6" aria-labelledby="decision-title">
            <Kicker>Decisión {decisionIndex + 1} de {DEMO_DECISIONS.length}</Kicker>
            <h2 id="decision-title" className="mt-1 font-slab text-2xl font-bold text-fg">{decision.title}</h2>
            <p className="mt-2 leading-relaxed text-fg-muted">{decision.text}</p>
            {!picked ? (
              <ul className="mt-4 space-y-2.5">
                {decision.options.map(o => (
                  <li key={o.id}><Button variant="outline" className="h-auto min-h-12 w-full justify-start whitespace-normal py-3 text-left" onClick={() => choose(o)}>{o.label}</Button></li>
                ))}
              </ul>
            ) : (
              <div role="status" className="mt-4 space-y-3 border border-line border-t-[4px] border-t-fg bg-surface p-4 [border-top-style:double]">
                <p className="font-semibold text-fg">{picked.label}</p>
                <p className="text-fg-muted">{picked.reaction}</p>
                <p className="flex flex-wrap gap-2">
                  {chipsFor(picked.effects).map(c => <Badge key={c.key} tone={c.delta > 0 ? 'accent' : 'danger'} className="num">{c.label} {c.delta > 0 ? '+' : ''}{c.delta}</Badge>)}
                </p>
                <Button onClick={next}>{decisionIndex < DEMO_DECISIONS.length - 1 ? 'Siguiente' : 'Ir al partido'}</Button>
              </div>
            )}
          </section>
        )}

        {step === 'match' && base && (
          <section className="mt-6" aria-labelledby="match-title">
            <h2 id="match-title" className="font-slab text-2xl font-bold text-fg">{DEMO_CLUB} vs. {base.rival}</h2>
            <ol className="mt-3 space-y-2" aria-live="polite">
              {base.events.slice(0, shown).map((e, i) => (
                <li key={i} className="flex gap-3 border-b border-line pb-2 text-sm"><span className="num w-9 shrink-0 font-display text-base font-bold text-primary">{e.minute}'</span><span className={cn('text-fg-muted', e.type.startsWith('goal') && 'font-semibold text-fg')}>{e.text}</span></li>
              ))}
            </ol>
            {shown >= base.events.length && <Button className="mt-5" onClick={() => setStep('penalty')}>Llega el penal</Button>}
          </section>
        )}

        {step === 'penalty' && base && (
          <section className="mt-6 space-y-4" aria-labelledby="pen-title">
            <h2 id="pen-title" className="font-slab text-2xl font-bold text-fg">Penal para el {DEMO_CLUB}</h2>
            <p className="text-fg-muted">Va a patear {base.shooter}. Frená la barra en el verde, en el medio.</p>
            <PowerBar onStop={kick} />
            {match && <p role="status" className="font-semibold text-fg">{match.events.at(-2).text}</p>}
          </section>
        )}

        {step === 'final' && match && verdict && (
          <section className="mt-6 space-y-5" aria-labelledby="final-title">
            <div>
              <h2 id="final-title" className="font-slab text-3xl font-extrabold leading-tight text-fg">{verdict.title}</h2>
              <p className="num mt-1 font-display text-2xl font-bold text-fg">{match.club} {match.score.me} - {match.score.rival} {match.rival}</p>
              <p className="mt-2 text-fg-muted">{verdict.text}</p>
            </div>
            <Card masthead as="div"><CardBody className="space-y-2">
              <Kicker>Los diarios de mañana</Kicker>
              <ul className="divide-y divide-line">
                {headlines({ match: live, stats }).map(h => <li key={h} className="py-2 font-slab text-lg font-bold leading-snug text-fg">{h}</li>)}
              </ul>
            </CardBody></Card>
            <div className="border border-line border-t-[4px] border-t-fg bg-surface p-5 [border-top-style:double]">
              <p className="font-slab text-2xl font-extrabold text-fg">Esto fue un solo día. Imaginate una carrera.</p>
              <p className="mt-1 text-sm text-fg-muted">Fundá tu propio club, armá el plantel y llevalo desde el barrio hasta Primera.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Link to="/registro" onClick={() => track('demo_cta_click', { placement: 'demo' })} className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>Crear mi carrera</Link>
                <Button variant="outline" size="lg" onClick={share}><Share2 />Compartir mi resultado</Button>
                <Button variant="ghost" size="lg" onClick={restart}><RotateCcw />Jugar otra vez</Button>
              </div>
            </div>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
