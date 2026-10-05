import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, HeartPulse, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { trainingApi, FOCUS_OPTIONS, INTENSITY_CONFIG, INDIVIDUAL_ATTRIBUTES } from '../../api/training'
import { supabase } from '../../api/supabase'
import {
  averageFitness, fitnessTone, isAttributeLocked, isCriticalFitness, isVeteran, isYouth
} from '../../domain/training'
import {
  Badge, Button, Card, CardBody, CardDescription, CardHeader, CardTitle, ChoiceChips, PageHeader, Select, Skeleton, Stat,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../../components/ui'
import { cn } from '../../lib/utils'
import { friendlyError } from '../../lib/errors'
import { trainingLoad } from '../../domain/squadConsequences'
import { trainingWarning } from '../../domain/warnings'
import { askRisk } from '../../lib/risk'

export default function TrainingScreen() {
  const { club, refreshContext, confirmRisk } = useGameContext()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [focus, setFocus] = useState('BALANCED')
  const [intensity, setIntensity] = useState('MEDIUM')
  const [players, setPlayers] = useState([])
  const [assignments, setAssignments] = useState({})
  const [savingPlayerId, setSavingPlayerId] = useState(null)

  useEffect(() => {
    if (!club?.id) return
    const load = async () => {
      try {
        setLoading(true)
        // El plan, el plantel y los focos individuales no dependen entre sí: se piden juntos
        const [plan, squadRes, assigned] = await Promise.all([
          trainingApi.getClubTrainingPlan(club.id),
          supabase.from('players').select('*').eq('club_id', club.id).eq('is_retired', false).order('position', { ascending: true }),
          trainingApi.getPlayerAssignments(club.id)
        ])
        if (plan) {
          setFocus(plan.general_focus || 'BALANCED')
          setIntensity(plan.intensity_level || 'MEDIUM')
        }
        if (squadRes.data) setPlayers(squadRes.data)
        setAssignments(Object.fromEntries(assigned.map(a => [a.player_id, a.focus_attribute])))
      } catch (e) {
        console.error('Error cargando plan de entrenamiento:', e)
        toast.error('Error al sincronizar datos de entrenamiento.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [club?.id])

  const avgFitness = useMemo(() => averageFitness(players), [players])
  const critical = isCriticalFitness(avgFitness)
  const recovery = focus === 'RECOVERY_REST'
  const selectedIntensity = INTENSITY_CONFIG[intensity] || INTENSITY_CONFIG.MEDIUM
  const selectedFocus = FOCUS_OPTIONS.find(o => o.id === focus)

  const savePlan = async () => {
    setSaving(true)
    try {
      // La intensidad alta acumula riesgo semana tras semana: se avisa antes de confirmarla
      const proceed = await askRisk(confirmRisk, async () => {
        const recent = await trainingApi.getRecentIntensities(club.id)
        const load = trainingLoad({ recent, current: recovery ? 'LOW' : intensity })
        return trainingWarning({ intensity: recovery ? 'LOW' : intensity, consecutiveHigh: Math.max(0, load.consecutiveHigh - 1), avgFitness })
      })
      if (!proceed) return
      await trainingApi.updateClubTrainingPlan(club.id, focus, intensity)
      await refreshContext()
      toast.success('Plan general de entrenamiento actualizado y en vigor.')
    } catch (e) {
      toast.error(friendlyError(e, 'Error al guardar el plan de entrenamiento.'))
    } finally {
      setSaving(false)
    }
  }

  const assignIndividual = async (playerId, attrId) => {
    setSavingPlayerId(playerId)
    try {
      await trainingApi.setPlayerAssignment(club.id, playerId, attrId)
      setAssignments(prev => ({ ...prev, [playerId]: attrId }))
      toast.success('Foco individual asignado al futbolista.')
    } catch {
      toast.error('No se pudo guardar la asignación individual.')
    } finally {
      setSavingPlayerId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando entrenamiento">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-11" />
        <div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Alto rendimiento"
        title="Entrenamiento"
        description="Preparación física, táctica y desarrollo individual."
        actions={<Badge tone={fitnessTone(avgFitness)} dot>Condición media {avgFitness}%</Badge>}
      />

      {critical && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-danger/40 bg-danger-soft p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-semibold text-danger">Alerta de sanidad del club</p>
            <p className="mt-1 text-fg-muted">
              La condición física media es crítica ({avgFitness}%). Con intensidad alta el riesgo de lesiones graves se dispara; conviene una semana de <strong className="text-fg">regenerativo y descanso</strong>.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="GENERAL">
        <TabsList aria-label="Tipo de entrenamiento" className="mb-2">
          <TabsTrigger value="GENERAL">Plan semanal colectivo</TabsTrigger>
          <TabsTrigger value="INDIVIDUAL">Tutoría individual ({players.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="GENERAL">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-4">
              <Card as="section" aria-label="Enfoque de la semana">
                <CardHeader>
                  <div>
                    <CardTitle className="text-lg">Enfoque principal de la semana</CardTitle>
                    <CardDescription>Una sesión semanal para todo el plantel.</CardDescription>
                  </div>
                </CardHeader>
                <CardBody>
                  <div role="radiogroup" aria-label="Enfoque principal" className="grid gap-2.5">
                    {FOCUS_OPTIONS.map(opt => {
                      const active = focus === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setFocus(opt.id)}
                          className={cn(
                            'rounded-lg border p-3.5 text-left transition-colors',
                            active ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:border-line-strong'
                          )}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className={cn('text-sm font-semibold', active ? 'text-accent' : 'text-fg')}>{opt.label}</span>
                            {active && <CheckCircle2 className="size-4 shrink-0 text-accent" aria-hidden="true" />}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-fg-muted">{opt.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </CardBody>
              </Card>
              <Button className="w-full" size="lg" loading={saving} onClick={savePlan}>
                {!saving && <CheckCircle2 />}Confirmar plan de trabajo
              </Button>
            </div>

            <div className="space-y-4">
              <Card as="section" aria-label="Intensidad">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Zap className="size-4 text-gold" aria-hidden="true" />Intensidad</CardTitle></CardHeader>
                <CardBody className="space-y-4">
                  <ChoiceChips
                    label="Nivel de intensidad"
                    value={intensity}
                    onChange={(v) => !recovery && setIntensity(v)}
                    options={['LOW', 'MEDIUM', 'HIGH'].map(l => ({ value: l, label: INTENSITY_CONFIG[l].label }))}
                    className={recovery ? 'pointer-events-none opacity-40' : undefined}
                  />
                  {recovery && <p className="text-xs text-fg-subtle">En semana regenerativa la intensidad no aplica.</p>}
                  <dl className="space-y-2 rounded-lg bg-surface-2 p-3.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-muted">Desgaste de condición física</dt>
                      <dd className="num font-semibold text-fg">{recovery ? '+15' : `-${selectedIntensity.fitnessCost}`} pts</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-muted">Riesgo base de lesión</dt>
                      <dd className={cn('num font-semibold', recovery ? 'text-accent' : 'text-warning')}>{recovery ? '0,0' : (selectedIntensity.injuryBaseProb * 100).toFixed(1).replace('.', ',')}%</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-muted">Multiplicador de mejora</dt>
                      <dd className="num font-semibold text-accent">{recovery ? '0' : selectedIntensity.devMultiplier}x</dd>
                    </div>
                  </dl>
                  {selectedFocus && <p className="text-xs text-fg-subtle">Enfoque elegido: {selectedFocus.label}</p>}
                </CardBody>
              </Card>

              <Card as="section" aria-label="Reglas de rendimiento">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><HeartPulse className="size-4 text-danger" aria-hidden="true" />Reglas de rendimiento</CardTitle></CardHeader>
                <CardBody>
                  <ul className="space-y-2.5 text-xs leading-relaxed text-fg-muted">
                    <li><strong className="text-fg">Veteranos (más de 29):</strong> no desarrollan atributos físicos; el entrenamiento físico frena su declive.</li>
                    <li><strong className="text-fg">Juveniles (menos de 22):</strong> +50% de velocidad de aprendizaje semanal.</li>
                    <li><strong className="text-fg">Tope de potencial:</strong> nadie progresa por encima de su techo.</li>
                  </ul>
                </CardBody>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="INDIVIDUAL" className="space-y-4">
          <Stat label="Plantel" value={players.length} hint="Asigná un foco técnico para acelerar promesas o corregir falencias." className="pb-1" />
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {players.map(p => {
              const current = assignments[p.id] || 'balanced'
              const fitness = p.state_fitness || 75
              return (
                <li key={p.id}>
                  <Card as="article">
                    <CardBody className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="num grid size-10 shrink-0 place-items-center rounded-full bg-surface-3 font-display text-base font-semibold">{p.shirt_number || '·'}</span>
                          <div className="min-w-0">
                            <h3 className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-fg">
                              <span className="truncate">{p.first_name} {p.last_name}</span>
                              {isYouth(p) && <Badge tone="accent">Promesa</Badge>}
                              {isVeteran(p) && <Badge>Veterano</Badge>}
                            </h3>
                            <p className="text-xs text-fg-muted">{p.position} · {p.age} años · Nivel {p.attr_overall || 50} · Pot. {p.attr_potential || 65}</p>
                          </div>
                        </div>
                        <Badge tone={fitnessTone(fitness)}>{fitness}% de condición</Badge>
                      </div>
                      <Select
                        aria-label={`Foco individual de ${p.first_name} ${p.last_name}`}
                        value={current}
                        disabled={savingPlayerId === p.id}
                        onChange={(e) => assignIndividual(p.id, e.target.value)}
                      >
                        <option value="balanced">Sin especialización (plan colectivo)</option>
                        {INDIVIDUAL_ATTRIBUTES.map(attr => {
                          const locked = isAttributeLocked(p, attr.id)
                          return <option key={attr.id} value={attr.id} disabled={locked}>{attr.label}{locked ? ' (bloqueado por edad)' : ''}</option>
                        })}
                      </Select>
                    </CardBody>
                  </Card>
                </li>
              )
            })}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
