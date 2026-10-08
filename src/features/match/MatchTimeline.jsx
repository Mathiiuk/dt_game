import React from 'react'
import { ArrowLeftRight, Bandage, Crosshair, Flag, Footprints, Goal, Hand, Megaphone, Radio, Siren, Shield, Swords, Target, Whistle } from 'lucide-react'
import { cn } from '../../lib/utils'

/** Cada tipo de jugada con su ícono y su color: el relato se lee de un vistazo */
const KINDS = {
  GOAL: { icon: Goal, tone: 'accent', label: 'Gol' },
  SAVE: { icon: Hand, tone: 'gold', label: 'Atajada' },
  MISS: { icon: Crosshair, tone: 'muted', label: 'Erró' },
  CORNER: { icon: Flag, tone: 'muted', label: 'Córner' },
  CARD_YELLOW: { card: 'bg-yellow-300', tone: 'warning', label: 'Amarilla' },
  CARD_RED: { card: 'bg-red-500', tone: 'danger', label: 'Roja' },
  INJURY: { icon: Bandage, tone: 'danger', label: 'Lesión' },
  PENALTY: { icon: Siren, tone: 'warning', label: 'Penal' },
  KEYPLAY: { icon: Target, tone: 'warning', label: 'Mano a mano' },
  SHOT: { icon: Crosshair, tone: 'warning', label: 'Remate peligroso' },
  SETPIECE_CORNER: { icon: Flag, tone: 'warning', label: 'Córner a favor' },
  SETPIECE_FK: { icon: Target, tone: 'warning', label: 'Tiro libre' },
  CLEARED: { icon: Shield, tone: 'muted', label: 'Despeje' },
  COUNTER: { icon: Footprints, tone: 'warning', label: 'Contragolpe' },
  SUBSTITUTION: { icon: ArrowLeftRight, tone: 'info', label: 'Cambio' },
  TACTIC_SHOUT: { icon: Megaphone, tone: 'info', label: 'Tu orden' },
  RIVAL_TACTIC: { icon: Swords, tone: 'muted', label: 'El rival' },
  END: { icon: Whistle, tone: 'accent', label: 'Final' }
}
const FALLBACK = { icon: Radio, tone: 'muted', label: 'Juego' }

const TONES = {
  accent: { box: 'border-accent/50 bg-accent-soft', icon: 'text-accent', text: 'text-fg' },
  gold: { box: 'border-gold/40 bg-gold-soft', icon: 'text-gold', text: 'text-fg' },
  warning: { box: 'border-warning/40 bg-warning-soft', icon: 'text-warning', text: 'text-fg' },
  danger: { box: 'border-danger/40 bg-danger-soft', icon: 'text-danger', text: 'text-fg' },
  info: { box: 'border-line-strong bg-surface-3', icon: 'text-fg-muted', text: 'text-fg-muted' },
  muted: { box: 'border-line bg-bg/60', icon: 'text-fg-subtle', text: 'text-fg-muted' }
}

function KindIcon({ kind, className }) {
  if (kind.card) return <span className={cn('inline-block h-4 w-3 rounded-[2px]', kind.card)} aria-hidden="true" />
  const Icon = kind.icon
  return <Icon className={className} aria-hidden="true" />
}

/**
 * Relato en vivo: arriba la jugada de ahora en grande y debajo las anteriores, de la más nueva a la más vieja.
 * No tiene scroll: lo que no entra en el alto disponible se desvanece hacia abajo (si el cuadro se achica o crece, se ven menos o más jugadas).
 */
export default function MatchTimeline({ events, matchState }) {
  const ordered = [...events].sort((a, b) => b.minute - a.minute)
  const [now, ...past] = ordered

  if (!now) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 p-4 text-center text-sm italic text-fg-subtle">
        <Radio className="size-6 text-fg-subtle" aria-hidden="true" />
        {matchState === 'pre-match' ? 'Equipos en vestuarios finalizando la charla táctica.' : 'Balón en disputa, equipos midiendo fuerzas en el campo...'}
      </div>
    )
  }

  const kind = KINDS[now.type] || FALLBACK
  const tone = TONES[kind.tone]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-xl border border-line bg-surface-2 p-3" aria-live="polite">
      {/* La jugada de ahora */}
      <div key={`${now.minute}-${now.text}`} className={cn('animate-rise-in shrink-0 rounded-xl border p-3', tone.box)}>
        <div className="flex items-center gap-2">
          <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg bg-bg/60', tone.icon)}><KindIcon kind={kind} className="size-5" /></span>
          <span className={cn('text-[11px] font-bold uppercase tracking-wider', tone.icon)}>{kind.label}</span>
          <span className="num ml-auto rounded-md bg-bg/60 px-2 py-0.5 font-mono text-xs font-bold text-fg-muted">{now.minute}'</span>
        </div>
        <p className={cn('mt-2 text-sm leading-relaxed sm:text-base', now.type === 'GOAL' ? 'font-bold' : 'font-medium', tone.text)}>{now.text}</p>
      </div>

      {/* Lo que pasó antes: se desvanece hacia abajo en vez de scrollear */}
      <ol className="relative min-h-0 flex-1 space-y-1.5 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" aria-label="Jugadas anteriores">
        {past.map((e, idx) => {
          const k = KINDS[e.type] || FALLBACK
          const t = TONES[k.tone]
          return (
            <li key={idx} className={cn('flex items-start gap-2.5 rounded-lg border px-2.5 py-2 text-xs leading-snug', t.box, t.text)}>
              <span className={cn('mt-0.5 shrink-0', t.icon)}><KindIcon kind={k} className="size-4" /></span>
              <span className="num w-7 shrink-0 font-mono font-bold text-fg-subtle">{e.minute}'</span>
              <span className="min-w-0">{e.text}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
