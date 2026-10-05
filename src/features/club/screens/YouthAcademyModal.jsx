import React, { useState, useEffect } from 'react'
import { GraduationCap, Sparkles, Star, TrendingUp, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { academyApi } from '../../../api/academy'
import { useGameContext } from '../../../context/GameContext'
import { formatMoney } from '../../../lib/format'
import { Badge, Button, Card, CardBody, EmptyState, ResponsiveOverlay, SectionTitle, Skeleton } from '../../../components/ui'
import { cn } from '../../../lib/utils'
import { friendlyError } from '../../../lib/errors'

const LEVEL_NAMES = {
  1: 'Potrero barrial (tierra y cal)',
  2: 'Cancha de césped natural y vestuarios básicos',
  3: 'Predio deportivo municipal',
  4: 'Complejo de formación juvenil avanzado',
  5: 'Centro de alto rendimiento de élite'
}
const GEM_CHANCE = { 1: '3%', 2: '6%', 3: '10%', 4: '18%', 5: '25%' }

/** Estrellas de potencial: se anuncian como texto para lectores de pantalla */
function Stars({ value }) {
  const filled = Math.round(value || 3)
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Potencial ${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={cn('size-3.5', n <= filled ? 'fill-gold text-gold' : 'text-line-strong')} aria-hidden="true" />
      ))}
    </span>
  )
}

/** Cantera: camada anual de juveniles, ascensos y mejora de instalaciones */
export default function YouthAcademyModal({ club, manager, onClose, onCandidatePromoted }) {
  const { confirmAction, refreshContext } = useGameContext()
  const [academy, setAcademy] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [generating, setGenerating] = useState(false)

  const loadData = async () => {
    try {
      if (!club?.id) return
      const [acad, cands] = await Promise.all([academyApi.getAcademy(club.id), academyApi.getYouthCandidates(club.id)])
      setAcademy(acad)
      setCandidates(cands)
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [club]) // eslint-disable-line react-hooks/exhaustive-deps

  const level = academy?.academy_level || 1

  const handleGenerateIntake = async () => {
    try {
      setGenerating(true)
      const fresh = await academyApi.generateYouthIntake(club.id, club.career_id, club.season_year || 1)
      toast.success(`Llegó la nueva camada del potrero: ${fresh.length} aspirantes`)
      setCandidates(fresh)
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setGenerating(false)
    }
  }

  const handlePromote = async (candidate) => {
    const confirmed = await confirmAction({
      title: `Ascender a ${candidate.first_name} ${candidate.last_name}`,
      description: `¿Firmar un contrato profesional de 3 temporadas por ${formatMoney(60)} por semana para sumarlo al primer equipo? Ganarás +100 XP como DT.`,
      confirmText: 'Firmar y ascender',
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      setProcessingId(candidate.id)
      const res = await academyApi.promoteCandidate(club.id, candidate.id, null, manager?.id)
      toast.success(`${candidate.last_name} subió al primer equipo con el dorsal ${res.jerseyNumber} (+100 XP)`)
      onCandidatePromoted?.()
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setProcessingId(null)
    }
  }

  const handleRelease = async (candidate) => {
    try {
      setProcessingId(candidate.id)
      await academyApi.releaseCandidate(candidate.id)
      toast.info(`${candidate.last_name} fue desvinculado de la cantera`)
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    } finally {
      setProcessingId(null)
    }
  }

  const handleUpgrade = async () => {
    const nextLevel = level + 1
    const cost = academyApi.BALANCE.upgrade_costs[nextLevel] || 30000

    const confirmed = await confirmAction({
      title: `Mejorar la cantera al nivel ${nextLevel}`,
      description: `Invertir ${formatMoney(cost)} en infraestructura para atraer mejores talentos en cada camada anual. ¿Confirmas?`,
      confirmText: `Invertir ${formatMoney(cost)}`,
      cancelText: 'Cancelar',
      variant: 'primary'
    })
    if (!confirmed) return

    try {
      await academyApi.upgradeAcademy(club.id)
      toast.success(`Instalaciones mejoradas al nivel ${nextLevel}`)
      if (typeof refreshContext === 'function') await refreshContext()
      loadData()
    } catch (e) {
      toast.error(friendlyError(e))
    }
  }

  return (
    <ResponsiveOverlay
      title="La fábrica del potrero"
      description="Captación barrial, camadas anuales y ascenso al plantel profesional"
      onClose={onClose}
      size="md"
    >
      <div className="space-y-6">
        <Card as="div">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Infraestructura · nivel {level} de 5</p>
              <p className="mt-1 font-display text-xl font-semibold text-fg">{LEVEL_NAMES[level] || 'Cantera regional'}</p>
              <p className="mt-1 text-sm text-fg-muted">Probabilidad de joya del potrero: <span className="num font-semibold text-fg">{GEM_CHANCE[level] || '3%'}</span></p>
            </div>
            {level < 5 && <Button variant="secondary" onClick={handleUpgrade} className="self-start sm:self-center"><TrendingUp />Mejorar cantera</Button>}
          </CardBody>
        </Card>

        <section aria-labelledby="youth-candidates">
          <SectionTitle
            action={candidates.length === 0 && (
              <Button size="sm" onClick={handleGenerateIntake} loading={generating}>{!generating && <Sparkles />}Captar camada</Button>
            )}
          >
            Aspirantes en prueba <span className="num text-fg-subtle">({candidates.length})</span>
          </SectionTitle>
          <p className="-mt-1 mb-3 text-sm text-fg-muted">Jóvenes de 15 a 17 años listos para ser evaluados.</p>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
          ) : candidates.length === 0 ? (
            <Card as="div">
              <EmptyState icon={GraduationCap} title="No hay candidatos en prueba" description="La camada anual llega sola en la semana 35 de cada temporada." />
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {candidates.map(c => {
                const isGem = (c.potential_stars_perceived || 0) >= 4.5
                return (
                  <li key={c.id}>
                    <Card as="article" className={cn('h-full', isGem && 'border-gold/50')}>
                      <CardBody className="flex h-full flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                                <span className="truncate">{c.first_name} {c.last_name}</span>
                                {isGem && <Badge tone="gold"><Sparkles className="size-3" aria-hidden="true" />Joya</Badge>}
                              </p>
                              <p className="mt-0.5 text-xs text-fg-muted">{c.position} · {c.age} años</p>
                            </div>
                            <Badge className="num shrink-0">Nivel {c.overall_rating}</Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-fg-muted">
                            Potencial <Stars value={c.potential_stars_perceived} />
                          </div>
                        </div>
                        <div className="flex gap-2 border-t border-line pt-3">
                          <Button variant="ghost" size="sm" disabled={processingId === c.id} onClick={() => handleRelease(c)}><Trash2 />Descartar</Button>
                          <Button size="sm" className="flex-1" disabled={processingId === c.id} onClick={() => handlePromote(c)}><UserPlus />Ascender</Button>
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </ResponsiveOverlay>
  )
}
