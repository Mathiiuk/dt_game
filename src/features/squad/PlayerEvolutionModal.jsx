import React, { useState, useEffect } from 'react'
import { AlertTriangle, Award, ChevronRight, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { playerEvolutionApi, CAREER_PHASES } from '../../api/playerEvolution'
import { Badge, Button, Card, CardBody, ChoiceChips, EmptyState, Progress, ResponsiveOverlay, Skeleton } from '../../components/ui'

const FILTERS = (total) => [
  { value: 'ALL', label: `Todo el plantel (${total})` },
  { value: 'YOUTH', label: 'Juveniles (21 o menos)' },
  { value: 'PEAK', label: 'Plenitud (22–29)' },
  { value: 'VETERANS', label: 'Veteranos (30+)' }
]

const ROLE_LABEL = { COACH: 'DT', SCOUT: 'Ojeador', PHYSIO: 'Fisio' }

/** Minutos jugados -> etiqueta y tono (Regla 28.1) */
const minutesInfo = (minutes) => {
  if (minutes >= 1800) return { label: 'Titular indiscutido (+4 a +5 nivel)', tone: 'accent' }
  if (minutes >= 900) return { label: 'Rodaje regular (+2 a +3 nivel)', tone: 'accent' }
  if (minutes >= 300) return { label: 'Rotación esporádica (+1 nivel)', tone: 'warning' }
  return { label: 'Sin minutos (menos de 300)', tone: 'neutral' }
}

/** Curva de vida del plantel: picos, minutos oficiales y declive. Diálogo grande en escritorio, página en móvil. */
export default function PlayerEvolutionModal({ club, players = [], onClose, currentSeasonYear = 2026 }) {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [retiringPlayers, setRetiringPlayers] = useState([])
  const [evolutionHistory, setEvolutionHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!club?.id) return
      try {
        setLoading(true)
        const [retirements, history] = await Promise.all([
          playerEvolutionApi.getRetiringPlayers(club.id),
          playerEvolutionApi.getClubEvolutionHistory(club.id, currentSeasonYear).catch(() => [])
        ])
        setRetiringPlayers(retirements)
        setEvolutionHistory(history)
      } catch (e) {
        console.error(e)
        toast.error('Error al cargar los datos de evolución')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [club?.id, currentSeasonYear])

  const filteredPlayers = players.filter(p => {
    const age = p.age || 20
    if (activeFilter === 'YOUTH') return age <= 21
    if (activeFilter === 'PEAK') return age >= 22 && age <= 29
    if (activeFilter === 'VETERANS') return age >= 30
    return true
  })

  const historyMap = new Map((evolutionHistory || []).map(h => [h.player_id, h]))
  const retirementMap = new Map((retiringPlayers || []).map(r => [r.player_id, r]))

  return (
    <ResponsiveOverlay
      title="Desarrollo y curva de vida"
      description="Picos de rendimiento, minutos oficiales y declive natural de los futbolistas"
      onClose={onClose}
      size="lg"
      footer={<Button onClick={onClose}>Entendido</Button>}
    >
      <div className="space-y-5">
        {retiringPlayers.length > 0 && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
              {retiringPlayers.length === 1
                ? 'Un futbolista histórico confirmó su retiro al terminar el torneo.'
                : `${retiringPlayers.length} futbolistas históricos confirmaron su retiro.`}
            </p>
            <Badge tone="warning" className="shrink-0">Último baile</Badge>
          </div>
        )}

        <ChoiceChips label="Filtrar por etapa" value={activeFilter} onChange={setActiveFilter} options={FILTERS(players.length)} />

        {loading ? (
          <div className="space-y-3" aria-busy="true"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        ) : filteredPlayers.length === 0 ? (
          <Card as="div"><EmptyState icon={Users} title="Sin resultados" description="No hay futbolistas en la etapa seleccionada." /></Card>
        ) : (
          <ul className="space-y-3">
            {filteredPlayers.map(p => {
              const retirement = retirementMap.get(p.id)
              const phaseKey = playerEvolutionApi.determineCareerPhase(p.age || 20, !!retirement)
              const phase = CAREER_PHASES[phaseKey] || CAREER_PHASES.PRIME_DEVELOPMENT
              const minutes = p.minutes_played_season || 0
              const info = minutesInfo(minutes)
              const hist = historyMap.get(p.id)
              const delta = hist ? hist.ovr_after - hist.ovr_before : 0

              return (
                <li key={p.id}>
                  <Card as="article">
                    <CardBody className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="num grid size-11 shrink-0 place-items-center rounded-full bg-surface-3 font-display text-lg font-semibold">
                            {p.shirt_number ?? '·'}
                          </span>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-fg">{p.first_name} {p.last_name}</h3>
                            <p className="mt-0.5 text-xs text-fg-muted">
                              {p.position} · {p.age} años · Nivel <span className="num font-semibold text-fg">{p.overall || p.attr_overall || 50}</span>
                              {p.potential_rating && <> · Potencial <span className="num font-semibold text-accent">{p.potential_rating}</span></>}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{phase.name}</Badge>
                          {retirement && (
                            <Badge tone="warning">
                              <Award className="size-3" aria-hidden="true" />
                              Se retira · futuro como {ROLE_LABEL[retirement.future_role_interest] || 'otro rol'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 text-fg-muted">
                            <Clock className="size-3.5" aria-hidden="true" />Minutos oficiales: <span className="num font-semibold text-fg">{minutes}</span>
                          </span>
                          <Badge tone={info.tone}>{info.label}</Badge>
                        </div>
                        <Progress tone={info.tone === 'neutral' ? 'neutral' : info.tone} value={Math.max(3, Math.min(100, Math.round((minutes / 1800) * 100)))} label="Minutos jugados en la temporada" />
                      </div>

                      {hist && (
                        <div className="flex items-center justify-between border-t border-line pt-2.5 text-xs text-fg-muted">
                          <span>Último balance anual</span>
                          <span className="num flex items-center gap-1 font-semibold">
                            {hist.ovr_before}
                            <ChevronRight className="size-3 text-fg-subtle" aria-hidden="true" />
                            <span className={delta >= 0 ? 'text-accent' : 'text-danger'}>{hist.ovr_after} ({delta >= 0 ? `+${delta}` : delta})</span>
                          </span>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </ResponsiveOverlay>
  )
}
