import React, { useEffect, useMemo, useState } from 'react'
import { Save, Wand2, ShieldAlert, CircleDot, Target, Flag, ChevronsUp } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import {
  tacticsApi, FORMATIONS,
  TACTICAL_MENTALITIES, PASSING_STYLES, PRESSING_LEVELS, TEMPO_LEVELS
} from '../../api/tactics'
import { playerApi } from '../../api/player'
import { chemistryApi } from '../../api/chemistry'
import { teamChemistry, weakestLinks } from '../../domain/chemistry'
import { reassignLineup, resolveLineup, getLayout } from '../../domain/formations'
import { FREE_FORMATION, moveToPoint, normalizeLayout, shapeOf, slotsOfLayout } from '../../domain/freeLayout'
import { fitLabel, positionName, slotBase } from '../../domain/positions'
import { specialistsOf, topFor, cleanTakers, ROLE_LABELS, ROLE_SCORES } from '../../domain/specialists'
import { ratingAtSlot, playerOverall } from '../../domain/ratings'
import {
  Badge, Button, Card, CardBody, CardDescription, CardHeader, CardTitle, ChoiceChips, EmptyState,
  PageHeader, Select, Skeleton, Stat, Tabs, TabsContent, TabsList, TabsTrigger
} from '../../components/ui'
import { cn } from '../../lib/utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { lockerRoomApi } from '../../api/lockerRoom'
import Pitch from './Pitch'
import { friendlyError } from '../../lib/errors'

const ROLE_ICONS = { PENALTY: CircleDot, FREE_KICK: Target, CORNER: Flag, HEADER: ChevronsUp }
const AFFINITY_TONE = { NATURAL: 'accent', COMPATIBLE: 'warning', ADAPTED: 'warning', OUT_OF_POSITION: 'danger' }

const toOptions = (list) => list.map(i => ({ value: i.id, label: i.label }))
const FORMATION_OPTIONS = Object.values(FORMATIONS).map(f => ({ value: f.id, label: f.id }))

const ovr = (p) => playerOverall(p)

/** Un grupo de instrucciones con título y una línea de contexto */
function InstructionGroup({ title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  )
}

function Labeled({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-fg">{label}</p>
      {children}
    </div>
  )
}

export default function TacticsScreen() {
  const { club, loading: contextLoading } = useGameContext()
  // En pantallas chicas los suplentes se despliegan en una hoja sobre la cancha, sin bajar hasta la pestaña de jugadores
  const isLg = useMediaQuery('(min-width: 1024px)')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [squad, setSquad] = useState([])
  const [captainId, setCaptainId] = useState(null)
  const [formation, setFormation] = useState('4-4-2')
  const [mentality, setMentality] = useState('BALANCED')
  const [passingStyle, setPassingStyle] = useState('MIXED')
  const [pressing, setPressing] = useState('BALANCED')
  const [tempo, setTempo] = useState('NORMAL')
  const [lineup, setLineup] = useState({}) // { [puesto]: idJugador }
  const [chemistryContext, setChemistryContext] = useState({ mentorPairs: new Set(), archetypes: new Map() })
  const [customLayout, setCustomLayout] = useState(null) // alineación libre: [{ slot, x, y }] o null con formación fija
  const [tacticId, setTacticId] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [tab, setTab] = useState('instructions')
  const [savedSnapshot, setSavedSnapshot] = useState('')
  // Especialistas de pelota parada elegidos a mano ({ rol: idJugador }); vacío = automático
  const [takers, setTakers] = useState({})

  const snapshot = JSON.stringify({ formation, mentality, passingStyle, pressing, tempo, lineup, customLayout, takers })
  const dirty = !loading && snapshot !== savedSnapshot

  useEffect(() => {
    if (contextLoading || !club?.id) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [tactic, players] = await Promise.all([tacticsApi.getTactic(club.id), playerApi.getSquad(club.id)])
        setSquad(players || [])
        // La química usa mentorías y personalidades; si no se pueden leer, se calcula sin ellas
        chemistryApi.getContext(club.id, players || []).then(setChemistryContext).catch(() => {})
        // La cinta se marca en la pizarra; si no se puede leer, la pizarra se muestra igual
        lockerRoomApi.getCaptains(club.id).then(c => setCaptainId(c?.captainId || null)).catch(() => {})

        // Con alineación libre la formación guardada es 'LIBRE' y las posiciones salen del layout personalizado
        const custom = tactic?.formation === FREE_FORMATION ? normalizeLayout(tactic?.custom_layout) : null
        const form = custom ? FREE_FORMATION : (FORMATIONS[tactic?.formation] ? tactic.formation : '4-4-2')
        const slots = custom ? slotsOfLayout(custom) : FORMATIONS[form].slots
        // Alineaciones guardadas con jugadores repetidos, retirados o desordenados se depuran y reubican solas
        const map = resolveLineup(slots, players || [], Array.isArray(tactic?.lineup) ? tactic.lineup : [])

        const next = {
          formation: form,
          mentality: tactic?.mentality || 'BALANCED',
          passingStyle: tactic?.passing_style || 'MIXED',
          pressing: tactic?.pressing_intensity || 'BALANCED',
          tempo: tactic?.tempo || 'NORMAL',
          lineup: map,
          customLayout: custom,
          takers: cleanTakers(tactic?.set_piece_takers) || {}
        }
        setTacticId(tactic?.id || null)
        setFormation(next.formation); setMentality(next.mentality); setPassingStyle(next.passingStyle)
        setPressing(next.pressing); setTempo(next.tempo); setLineup(next.lineup); setCustomLayout(next.customLayout); setTakers(next.takers)
        setSavedSnapshot(JSON.stringify(next))
      } catch (e) {
        console.error('Error cargando táctica:', e)
        toast.error('No se pudo cargar la pizarra táctica.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [contextLoading, club?.id])

  const playerMap = useMemo(() => new Map(squad.map(p => [p.id, p])), [squad])
  const layout = customLayout || getLayout(formation)
  const slots = customLayout ? slotsOfLayout(customLayout) : (FORMATIONS[formation] || FORMATIONS['4-4-2']).slots
  const starterIds = slots.map(s => lineup[s]).filter(Boolean)
  const starterSlotById = Object.fromEntries(Object.entries(lineup).map(([slot, id]) => [id, slot]))

  // Resumen del once: nivel medio y jugadores fuera de puesto o lesionados
  const summary = useMemo(() => {
    const starters = starterIds.map(id => playerMap.get(id)).filter(Boolean)
    // El nivel del once cuenta lo que rinde cada uno EN su puesto (un arquero de delantero casi no suma)
    const avg = starters.length ? Math.round(starters.reduce((s, p) => s + ratingAtSlot(p, starterSlotById[p.id]), 0) / starters.length) : 0
    const out = starters.filter(p => fitLabel(p.position, starterSlotById[p.id]).code === 'OUT_OF_POSITION').length
    const hurt = starters.filter(p => p.is_injured).length
    return { avg, out, hurt, count: starters.length }
  }, [starterIds.join('|'), playerMap]) // eslint-disable-line react-hooks/exhaustive-deps

  // Química del once: enlaces entre vecinos, valor total y los vínculos más flojos
  const chemistry = useMemo(
    () => teamChemistry(layout, lineup, chemistryApi.withArchetypes(squad, chemistryContext), chemistryContext),
    [layout, lineup, squad, chemistryContext]
  )
  const weak = weakestLinks(chemistry.links.filter(l => l.tone !== 'GOOD'), 2)
  // Quién cobra cada pelota parada (el mejor disponible de cada rol)
  const specialists = useMemo(() => specialistsOf(squad, takers), [squad, takers])
  const chooseTaker = (role, id) => setTakers(prev => {
    const next = { ...prev }
    if (id) next[role] = id
    else delete next[role]
    return next
  })

  const handleFormationChange = (next) => {
    if (next === formation || next === FREE_FORMATION) return
    const nextSlots = (FORMATIONS[next] || FORMATIONS['4-4-2']).slots
    // Los titulares conservan su lugar siempre que sea posible; se mueven a su nuevo puesto con animación
    setLineup(reassignLineup(nextSlots, squad, starterIds))
    setFormation(next)
    setCustomLayout(null)
    setSelectedSlot(null)
  }

  /** Mueve una ficha a cualquier punto de la cancha: pasa a alineación libre y el jugador viaja con la ficha */
  const handleMove = (slot, x, y, { keepSelection = false } = {}) => {
    const moved = moveToPoint(layout, lineup, slot, x, y)
    setCustomLayout(moved.layout)
    setLineup(moved.lineup)
    setFormation(FREE_FORMATION)
    setSelectedSlot(keepSelection ? moved.slot : null)
  }

  const handleAutoAssign = () => {
    setLineup(reassignLineup(slots, squad, []))
    setSelectedSlot(null)
    toast.success('Once armado con los mejores jugadores disponibles.')
  }

  /** Toque en una ficha de la cancha: selecciona el puesto, o intercambia si ya había otro seleccionado */
  const handleSelectSlot = (slot) => {
    if (selectedSlot && selectedSlot !== slot) {
      setLineup(prev => ({ ...prev, [selectedSlot]: prev[slot], [slot]: prev[selectedSlot] }))
      setSelectedSlot(null)
      return
    }
    setSelectedSlot(selectedSlot === slot ? null : slot)
    if (isLg) setTab('players')
  }

  /** Asigna un jugador del plantel al puesto seleccionado (si ya era titular en otro puesto, se intercambian) */
  const handleAssign = (playerId) => {
    if (!selectedSlot) return
    setLineup(prev => {
      const next = { ...prev }
      const previousSlot = Object.keys(next).find(s => next[s] === playerId)
      if (previousSlot) next[previousSlot] = prev[selectedSlot]
      next[selectedSlot] = playerId
      return next
    })
    setSelectedSlot(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const lineupArray = slots.map(s => lineup[s]).filter(Boolean)

      // Regla 27.1: un lesionado no puede ser titular desde la pizarra (si el plantel queda corto, el partido se completa solo)
      const injuredStarter = lineupArray.map(id => playerMap.get(id)).find(p => p?.is_injured)
      if (injuredStarter) {
        toast.error(`${injuredStarter.first_name} ${injuredStarter.last_name} está en la enfermería (${injuredStarter.injury_type || 'baja médica'}). Reemplázalo para guardar.`)
        return
      }

      const lineupDetails = slots.map((s, idx) => ({ player_id: lineup[s], pitch_position: s, is_starter: true, order_index: idx })).filter(i => i.player_id)

      const saved = await tacticsApi.updateTactic(club.id, {
        id: tacticId, club_id: club.id, formation, mentality,
        passing_style: passingStyle, pressing_intensity: pressing, tempo,
        customLayout, lineup: lineupArray, lineupDetails, setPieceTakers: takers
      })
      if (saved?.id) setTacticId(saved.id)
      setSavedSnapshot(snapshot)
      toast.success('Pizarra y alineación guardadas.')
    } catch (e) {
      toast.error(friendlyError(e, 'No se pudo guardar la táctica.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6" aria-busy="true" aria-label="Cargando la pizarra táctica">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
          <Skeleton className="aspect-[68/100] w-full" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (squad.length === 0) {
    return <EmptyState className="py-24" title="Todavía no hay plantel" description="Funda tu club y genera el primer plantel para armar el once." />
  }

  const selectedPlayer = selectedSlot ? playerMap.get(lineup[selectedSlot]) : null

  // Candidatos para el puesto elegido: mejor afinidad primero y luego mejor nivel; los lesionados quedan al final
  const candidates = selectedSlot
    ? [...squad].sort((a, b) => {
        const ra = ratingAtSlot(a, selectedSlot) - (a.is_injured ? 40 : 0)
        const rb = ratingAtSlot(b, selectedSlot) - (b.is_injured ? 40 : 0)
        return rb - ra || ovr(b) - ovr(a)
      })
    : []

  const candidateList = selectedSlot && (
    <ul className="space-y-1.5" aria-label={`Candidatos para ${slotBase(selectedSlot)}`}>
      {candidates.map(p => {
        const aff = fitLabel(p.position, selectedSlot)
        const current = lineup[selectedSlot] === p.id
        const startsAt = starterSlotById[p.id]
        return (
          <li key={p.id}>
            <button
              type="button"
              disabled={p.is_injured}
              onClick={() => handleAssign(p.id)}
              className={cn(
                'flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
                current ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:bg-surface-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <span className="num grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 font-display text-base font-semibold">{p.shirt_number ?? '·'}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-fg">{p.first_name} {p.last_name}</span>
                <span className="block text-xs text-fg-subtle">
                  <abbr title={positionName(p.position)} className="no-underline">{p.position}</abbr> · Nivel <span className="num">{ovr(p)}</span> · En el puesto <span className="num">{ratingAtSlot(p, selectedSlot)}</span> · Cond. <span className="num">{p.state_fitness ?? 75}%</span>
                  {startsAt && !current ? ` · Titular (${startsAt})` : ''}
                </span>
              </span>
              {p.is_injured ? <Badge tone="danger" dot>Lesionado</Badge> : <Badge tone={AFFINITY_TONE[aff.code]}>{aff.label}</Badge>}
            </button>
          </li>
        )
      })}
    </ul>
  )

  const saveButton = (
    <Button onClick={handleSave} loading={saving} disabled={!dirty}>
      {!saving && <Save />}Guardar cambios
    </Button>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Pizarra"
        title="Táctica y once titular"
        description="Arrastrá una ficha para ponerla donde quieras. En el celular, tocá una ficha y después el lugar de la cancha; tocar otra ficha las intercambia."
        actions={<span className="hidden lg:contents">{saveButton}</span>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        {/* Cancha y resumen */}
        <div className="min-w-0 space-y-4">
          <Pitch formation={customLayout ? shapeOf(customLayout) : formation} layout={layout} lineup={lineup} players={squad} selectedSlot={selectedSlot} onSelectSlot={handleSelectSlot} onMove={handleMove} links={chemistry.links} captainId={captainId} />

          <Card>
            <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Nivel del once" value={summary.avg} />
              <Stat label="Química" value={`${chemistry.score}%`} valueClassName={chemistry.score >= 70 ? 'text-accent' : chemistry.score < 40 ? 'text-danger' : 'text-warning'} />
              <Stat label="Fuera de puesto" value={summary.out} valueClassName={summary.out > 0 ? 'text-warning' : undefined} />
              <Stat label="Lesionados" value={summary.hurt} valueClassName={summary.hurt > 0 ? 'text-danger' : undefined} />
            </CardBody>
          </Card>

          <Card as="section" aria-label="Especialistas de pelota parada">
            <CardHeader><CardTitle className="text-lg">Especialistas</CardTitle></CardHeader>
            <CardBody>
              <ul className="space-y-2.5">
                {Object.entries(ROLE_ICONS).map(([role, Icon]) => {
                  const sp = specialists[role]
                  const candidates = topFor(squad, role, 40)
                  return (
                    <li key={role} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-3 text-accent"><Icon className="size-4" aria-hidden="true" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs text-fg-subtle">{ROLE_LABELS[role]}{sp?.manual ? ' · elegido por vos' : ' · automático'}</span>
                          <span className="block truncate text-sm font-semibold text-fg">{sp ? sp.name : 'Sin especialista disponible'}</span>
                        </span>
                        {sp && <span className="num font-mono text-sm font-bold text-accent">{sp.score}</span>}
                      </div>
                      <Select aria-label={`Especialista de ${ROLE_LABELS[role].toLowerCase()}`} value={takers[role] || ''} onChange={(e) => chooseTaker(role, e.target.value)}>
                        <option value="">Automático (el mejor por atributos)</option>
                        {candidates.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} · {Math.round(ROLE_SCORES[role](p))}</option>)}
                      </Select>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-3 text-xs text-fg-subtle">Si no elegís a nadie, cobra el mejor según sus atributos. En el partido, ellos cobran y definen las pelotas paradas; si el elegido se lesiona o sale, lo reemplaza el mejor disponible.</p>
            </CardBody>
          </Card>

          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-fg-muted" aria-label="Referencias de color">
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-accent" />Natural</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-warning" />Compatible</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-[oklch(75%_0.16_55)]" />Adaptado</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-danger" />Fuera de puesto</li>
          </ul>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-fg-muted" aria-label="Referencias de química">
            <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[oklch(72%_0.17_150)]" />Química buena</li>
            <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[oklch(82%_0.15_90)]" />Regular</li>
            <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[oklch(62%_0.2_25)]" />Mala</li>
          </ul>
          {weak.length > 0 && (
            <ul className="space-y-1 px-1 text-xs text-fg-muted" aria-label="Vínculos para mejorar">
              {weak.map(l => (
                <li key={`${l.a}-${l.b}`}>
                  <span className="font-semibold text-fg">{slotBase(l.a)} y {slotBase(l.b)}:</span> {l.reasons.join(', ') || 'se conocen poco'}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instrucciones y selección de jugadores */}
        <Tabs value={tab} onValueChange={setTab} className="min-w-0">
          <TabsList>
            <TabsTrigger value="instructions">Instrucciones</TabsTrigger>
            <TabsTrigger value="players">
              Jugadores{selectedSlot ? ` · ${slotBase(selectedSlot)}` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="space-y-4">
            <InstructionGroup title="Estructura" description={customLayout ? `Alineación libre con esquema ${shapeOf(customLayout)}. Elegí una formación para volver a una fija.` : (FORMATIONS[formation] || FORMATIONS['4-4-2']).description}>
              <ChoiceChips label="Formación" value={formation} onChange={handleFormationChange} options={customLayout ? [...FORMATION_OPTIONS, { value: FREE_FORMATION, label: `Libre ${shapeOf(customLayout)}` }] : FORMATION_OPTIONS} />
              <Button variant="outline" size="sm" onClick={handleAutoAssign}><Wand2 />Auto-alinear el mejor once</Button>
            </InstructionGroup>

            <InstructionGroup title="Mentalidad" description="Cuánto riesgo asume el equipo en cada zona de la cancha.">
              <ChoiceChips label="Mentalidad" value={mentality} onChange={setMentality} options={toOptions(TACTICAL_MENTALITIES)} />
            </InstructionGroup>

            <InstructionGroup title="Con la pelota" description="Cómo construye el juego y a qué velocidad.">
              <Labeled label="Estilo de pase"><ChoiceChips label="Estilo de pase" value={passingStyle} onChange={setPassingStyle} options={toOptions(PASSING_STYLES)} /></Labeled>
              <Labeled label="Ritmo de juego"><ChoiceChips label="Ritmo de juego" value={tempo} onChange={setTempo} options={toOptions(TEMPO_LEVELS)} /></Labeled>
            </InstructionGroup>

            <InstructionGroup title="Sin la pelota" description="Qué tan arriba se presiona y cuánto desgaste cuesta.">
              <ChoiceChips label="Intensidad de presión" value={pressing} onChange={setPressing} options={toOptions(PRESSING_LEVELS)} />
            </InstructionGroup>
          </TabsContent>

          <TabsContent value="players">
            {!selectedSlot ? (
              <EmptyState title="Elige un puesto" description="Toca una ficha de la cancha para ver quién puede ocuparlo y qué tan cómodo estaría." />
            ) : (
              <div className="space-y-3">
                <Card>
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow">Puesto {slotBase(selectedSlot)}</p>
                      <p className="mt-1 truncate font-display text-xl font-semibold text-fg">
                        {selectedPlayer ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}` : 'Vacío'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSlot(null)}>Cancelar</Button>
                  </CardBody>
                </Card>

                {candidateList}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Móvil: al tocar una ficha se despliegan los suplentes en una bandeja pegada abajo. No es modal: la pizarra
          sigue activa para mover la ficha o intercambiarla con otra sin perder la selección */}
      {!isLg && selectedSlot && (
        <section aria-label={`Suplentes para ${slotBase(selectedSlot)}`} className="sticky bottom-0 z-30 -mx-4 mt-4 border-t border-line-strong bg-surface shadow-overlay sm:-mx-6">
          <div className="flex items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <div className="min-w-0">
              <p className="eyebrow">Puesto {slotBase(selectedSlot)}</p>
              <p className="truncate text-sm font-semibold text-fg">
                {selectedPlayer ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}` : 'Vacío'} · elegí quién entra
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSlot(null)}>Cerrar</Button>
          </div>
          <div className="max-h-[36dvh] overflow-y-auto overscroll-contain px-3 pb-3">{candidateList}</div>
        </section>
      )}

      {/* Barra de guardado pegada abajo en móvil, sólo si hay cambios (dentro del flujo: no tapa ni se superpone con el menú) */}
      {dirty && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-surface px-4 py-3 sm:-mx-6 sm:px-6 lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-fg-muted"><ShieldAlert className="size-4 text-warning" aria-hidden="true" />Cambios sin guardar</p>
            {saveButton}
          </div>
        </div>
      )}
    </div>
  )
}
