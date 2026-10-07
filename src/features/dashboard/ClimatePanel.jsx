import React, { useEffect, useState } from 'react'
import { Activity, History, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { climateApi } from '../../api/climate'
import { climateVisibility, CLIMATE, DIFFICULTY } from '../../domain/consequences'
import { BARRA_LABELS, climateHeadline } from '../../domain/barra'
import { absoluteWeek } from '../../domain/gameWeek'
import { ensureCharacters } from '../../domain/characters'
import { formatMoney } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { Badge, Card, CardBody, CardHeader, CardTitle, Progress, Segmented } from '../../components/ui'

// El clima se ve: el borde y el fondo de la tarjeta cambian de tono (sin animaciones: respeta "reducir movimiento")
const CLIMATE_LOOK = {
  FLOWS: 'border-accent/40 bg-accent-soft/20',
  TENSION: 'border-warning/40 bg-warning-soft/20',
  CRISIS: 'border-danger/40 bg-danger-soft/20',
  CHAOS: 'border-danger bg-danger-soft/40'
}

const DIFFICULTY_OPTIONS = Object.values(DIFFICULTY).map(d => ({ value: d.key, label: d.label }))

const Meter = ({ label, value }) => (
  <div>
    <div className="mb-1 flex items-baseline justify-between text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="num font-semibold text-fg">{Math.round(value)}</span>
    </div>
    <Progress auto value={value} label={label} />
  </div>
)

/**
 * Tarjeta de clima del club: medidores, estado general, barra y selector de dificultad.
 * Se revela de a poco: las primeras semanas solo hinchada y dirigencia.
 */
export function ClimatePanel({ club, gameDate, showDifficulty = false }) {
  const [state, setState] = useState(null)

  useEffect(() => {
    if (!club?.id) return
    let alive = true
    climateApi.load(club.id).then(s => { if (alive) setState(s) }).catch(() => {})
    return () => { alive = false }
  }, [club?.id])

  if (!club) return null

  const week = gameDate ? absoluteWeek(gameDate) : 1
  const visible = climateVisibility(week)
  const climate = CLIMATE[state?.climate || 'FLOWS']
  const stage = state?.barra_stage || 'CALM'

  const changeDifficulty = async (key) => {
    try {
      await climateApi.saveDifficulty(club.id, key)
      setState(prev => ({ ...prev, difficulty: key }))
      toast.success(`Dificultad: ${DIFFICULTY[key].label}.`)
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  return (
    <Card data-climate={visible.pressure ? climate.key : undefined} className={visible.pressure ? CLIMATE_LOOK[climate.key] : undefined}>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <Activity className="size-5 text-accent" aria-hidden="true" />
          <CardTitle>Clima del club</CardTitle>
        </div>
        {visible.pressure && <Badge tone={climate.tone} dot>{climate.label}</Badge>}
      </CardHeader>
      <CardBody className="space-y-4">
        {visible.pressure ? (
          <p className="text-sm text-fg-muted">{climateHeadline(climate.key, stage)}</p>
        ) : (
          <p className="text-sm text-fg-muted">Primeras semanas: mirá cómo reacciona la tribuna y la dirigencia a cada resultado.</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Meter label="Hinchada" value={club.fans_confidence ?? 65} />
          <Meter label="Dirigencia" value={club.board_confidence ?? 70} />
          {visible.locker && <Meter label="Vestuario" value={club.squad_morale ?? 60} />}
          {visible.cash && (
            <div className="flex items-baseline justify-between text-sm sm:items-end">
              <span className="text-fg-muted">Caja</span>
              <span className={`num font-semibold ${Number(club.budget) < 0 ? 'text-danger' : 'text-fg'}`}>{formatMoney(Number(club.budget || 0))}</span>
            </div>
          )}
        </div>

        {visible.pressure && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
            <span>Presión: <span className="num font-semibold text-fg">{state?.pressure ?? 0}</span></span>
            <span>Barra: <span className="font-semibold text-fg">{BARRA_LABELS[stage]}</span>{stage !== 'CALM' && <span> · la lidera {ensureCharacters(state?.characters, club.id).barra.name}{(state?.characters?.barra?.times || 0) > 1 ? `, que ya vino ${state.characters.barra.times} veces` : ''}</span>}</span>
            {state?.suspended_matches > 0 && <Badge tone="danger">Suspendido {state.suspended_matches} partido(s)</Badge>}
          </div>
        )}

        {showDifficulty && (
          <div>
            <p className="eyebrow mb-1.5">Dificultad</p>
            <Segmented
              label="Dificultad"
              size="sm"
              value={state?.difficulty || 'NORMAL'}
              onChange={changeDifficulty}
              options={DIFFICULTY_OPTIONS}
            />
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/** Feed "Esto pasó por tu decisión": las últimas consecuencias registradas */
export function ConsequenceFeed({ clubId }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    if (!clubId) return
    let alive = true
    climateApi.getRecent(clubId, 8).then(rows => { if (alive) setItems(rows) }).catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [clubId])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <History className="size-5 text-accent" aria-hidden="true" />
          <CardTitle>Esto pasó por tu decisión</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        {items === null ? (
          <p className="text-sm text-fg-subtle">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-fg-muted">Todavía no hay consecuencias para mostrar. Tus decisiones y los resultados van a aparecer acá.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map(item => (
              <li key={item.id} className="py-2.5 text-sm">
                {item.source === 'COMBO' && (
                  <Badge tone={/Círculo vicioso/.test(item.message) ? 'danger' : 'accent'} className="mb-1"><Zap className="size-3" aria-hidden="true" />{/Círculo vicioso/.test(item.message) ? 'Círculo vicioso' : 'Combo'}</Badge>
                )}
                <p className="text-fg">{item.message}</p>
                <p className="mt-0.5 text-xs text-fg-subtle">Semana {item.week_number}</p>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
