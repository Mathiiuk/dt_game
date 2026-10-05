import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Award, Briefcase, Building, ChevronRight, Flag, History, Send, Shield, Star, Trophy, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { careerApi } from '../../api/career'
import { endgameApi } from '../../api/endgame'
import { formatMoney } from '../../lib/format'
import { cn } from '../../lib/utils'
import {
  Badge, Button, Card, CardBody, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, Skeleton, Stat, Tabs, TabsContent,
  TabsList, TabsTrigger
} from '../../components/ui'
import JobOfferBottomSheet from '../career/JobOfferBottomSheet'
import ReputationHistoryModal from '../career/ReputationHistoryModal'

const DEPARTURE = { RESIGNED: 'Renuncia', MOVED_TO_ANOTHER_CLUB: 'Traspaso', SACKED: 'Destituido' }
const formatDate = (d) => new Date(d).toLocaleDateString('es-AR')
const chanceTone = (c) => (c === 'MUY ALTA' || c === 'CANDIDATO FIRME' ? 'accent' : c === 'POCAS OPCIONES' ? 'warning' : 'danger')

export default function ManagerCareerScreen() {
  const navigate = useNavigate()
  const { manager, club, refreshContext, confirmAction } = useGameContext()

  const [stats, setStats] = useState(null)
  const [offers, setOffers] = useState([])
  const [vacancies, setVacancies] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('stints')
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [retiring, setRetiring] = useState(false)
  const [reputationOpen, setReputationOpen] = useState(false)

  const loadCareerData = async () => {
    if (!manager) return
    try {
      setLoading(true)
      const [statsData, jobOffers, vacancyList] = await Promise.all([
        careerApi.getCareerStats(manager.id, club?.id),
        careerApi.getAvailableJobOffers(manager.id, club?.id, manager.reputation || 10),
        careerApi.getAvailableVacancies(club?.id, manager.reputation || 10)
      ])
      setStats(statsData)
      setOffers(jobOffers || [])
      setVacancies(vacancyList || [])
    } catch (err) {
      console.error('Error cargando datos de carrera del DT:', err)
      toast.error('Error al cargar datos de carrera')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCareerData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager?.id, club?.id])

  const handleAcceptOffer = async (offer) => {
    const ok = await confirmAction({
      title: 'Firmar contrato profesional',
      description: `¿Confirmás tu asunción en ${offer.clubName}? Dejarás tu puesto actual para asumir de inmediato con un salario de ${formatMoney(offer.offeredSalary)}/semana.`,
      confirmText: 'Firmar contrato',
      variant: 'emerald'
    })
    if (!ok) return
    setActionLoading(true)
    try {
      await careerApi.acceptJobOffer(manager.id, offer.id || offer.clubId, club?.id)
      setSelectedOffer(null)
      toast.success(`¡Firmaste con ${offer.clubName}! Bienvenido a tu nuevo club.`)
      await refreshContext()
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Error al firmar el contrato')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectOffer = async (offer) => {
    setActionLoading(true)
    try {
      if (offer.id) await careerApi.rejectJobOffer(manager.id, offer.id)
      setSelectedOffer(null)
      setOffers(prev => prev.filter(o => o.id !== offer.id && o.clubId !== offer.clubId))
      toast.info(`Desestimaste la propuesta de ${offer.clubName}.`)
    } catch {
      toast.error('Error al rechazar oferta')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyForJob = async (target) => {
    const ok = await confirmAction({
      title: `Postularse a ${target.name}`,
      description: `Enviarás tu currículum a la comisión directiva de ${target.name} (${target.tierName}). Tu chance estimada es: ${target.chance}.`,
      confirmText: 'Enviar postulación',
      variant: 'blue'
    })
    if (!ok) return
    setActionLoading(true)
    try {
      const res = await careerApi.applyForJob(manager.id, target.id, manager.reputation || 10)
      if (res.accepted) {
        toast.success(res.message)
        await loadCareerData()
        setTab('offers')
      } else {
        toast.error(res.message)
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar la postulación')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResign = async () => {
    const ok = await confirmAction({
      title: 'Presentar renuncia voluntaria',
      description: '¿Renunciar a tu cargo? Quedarás DESEMPLEADO sin indemnización y tu reputación bajará 5 puntos por rescisión unilateral.',
      confirmText: 'Confirmar renuncia',
      variant: 'red'
    })
    if (!ok) return
    setActionLoading(true)
    try {
      await careerApi.resignFromClub(manager.id, club?.id)
      toast.warning('Presentaste tu renuncia. Ahora sos Director Técnico libre.')
      await refreshContext()
      await loadCareerData()
    } catch (err) {
      toast.error(err.message || 'Error al procesar la renuncia')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetire = async () => {
    const ok = await confirmAction({
      title: 'Retiro del fútbol profesional',
      description: '¿Retirarte definitivamente? Tu carrera como entrenador concluirá. Se calculará tu legado, ingresarás al Salón de la Fama y se emitirá el Diario del Retiro.',
      confirmText: 'Colgar el buzo',
      variant: 'amber'
    })
    if (!ok) return
    setRetiring(true)
    try {
      await endgameApi.processRetirement(manager.id, club?.id)
      toast.success('Carrera finalizada con éxito.')
      if (refreshContext) await refreshContext()
      navigate('/endgame')
    } catch (err) {
      toast.error(err.message || 'Error al procesar el retiro')
    } finally {
      setRetiring(false)
    }
  }

  if (loading || !manager) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando expediente">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-56 md:col-span-2" /><Skeleton className="h-56" /></div>
        <Skeleton className="h-24" />
      </div>
    )
  }

  const stars = careerApi.calculateReputationStars(manager.reputation || 10)
  const isEmployed = (stats?.employmentStatus || 'EMPLOYED') === 'EMPLOYED' && !!club
  const rank = stars >= 4 ? 'DT de élite internacional' : stars >= 3 ? 'Consolidado en Primera' : 'Entrenador emergente'

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        eyebrow="Trayectoria, finanzas personales y ofertas"
        title="Carrera del DT"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/achievements')}><Award />Logros</Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/hall-of-fame')}><Trophy />Salón de la Fama</Button>
          </>
        }
      />

      <div className="space-y-6">
        {!isEmployed && !manager.is_retired && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4">
            <div className="flex items-center gap-3">
              <UserX className="size-5 shrink-0 text-warning" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-warning">Actualmente desempleado</p>
                <p className="text-xs text-fg-muted">No dirigís ningún club. Revisá tus ofertas o postulate en la bolsa de trabajo.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setTab('vacancies')}>Ver vacantes</Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardBody className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-accent font-display text-2xl font-semibold text-accent-fg sm:size-20" aria-hidden="true">
                  {manager.first_name?.[0]}{manager.last_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-display text-2xl font-semibold text-fg">{manager.first_name} {manager.last_name}</h2>
                    <Badge tone="accent">Nivel {manager.level}</Badge>
                    <Badge tone={isEmployed ? 'neutral' : 'warning'}>{isEmployed ? 'En funciones' : 'Agente libre'}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">{manager.age || 40} años · {manager.nationality || 'Argentina'} · Club: <span className="font-semibold text-fg">{club?.name || 'Sin club'}</span></p>
                  <p className="mt-1 text-xs text-fg-subtle">Filosofía: {manager.philosophy || 'Equilibrado'} · Especialidad: {manager.specialization || 'Táctico'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
                <Stat label="Liderazgo" value={manager.attr_leadership || 70} valueClassName="text-2xl" />
                <Stat label="Táctica" value={manager.attr_tactics || 70} valueClassName="text-2xl" />
                <Stat label="Motivación" value={manager.attr_motivation || 70} valueClassName="text-2xl" />
                <Stat label="Vestuario" value={manager.attr_locker_room || 70} valueClassName="text-2xl" />
              </div>

              {isEmployed && (
                <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-xs text-fg-subtle">¿Querés desvincularte del club?</span>
                  <Button variant="outline" size="sm" disabled={actionLoading} onClick={handleResign}>Presentar renuncia</Button>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="eyebrow">Reputación deportiva</p>
                  <Button variant="link" size="sm" onClick={() => setReputationOpen(true)}><History />Ver libro mayor</Button>
                </div>
                <div className="flex items-center gap-1" role="img" aria-label={`${stars} de 5 estrellas`}>
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn('size-5', s <= stars ? 'fill-gold text-gold' : 'text-surface-3')} aria-hidden="true" />)}
                  <span className="num ml-2 text-sm font-semibold text-gold">{manager.reputation || 10} pts</span>
                </div>
                <p className="mt-1.5 text-xs text-fg-muted">{rank}</p>
              </div>
              <div className="space-y-4 border-t border-line pt-5">
                <Stat label="Ahorros personales" value={formatMoney(stats?.personalSavings || 0)} valueClassName="text-2xl text-accent" />
                <Stat label="Salario semanal" value={formatMoney(stats?.currentContractWage || 0)} hint="por semana" valueClassName="text-2xl" />
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Partidos dirigidos" value={stats?.totalMatches || 0} />
            <Stat label="Victorias" value={stats?.totalWon || 0} valueClassName="text-accent" />
            <Stat label="Empates" value={stats?.totalDrawn || 0} valueClassName="text-warning" />
            <Stat label="Derrotas" value={stats?.totalLost || 0} hint={`Efectividad ${stats?.winRate || 0}%`} valueClassName="text-danger" />
          </CardBody>
        </Card>

        <button
          type="button"
          onClick={() => navigate('/national-team')}
          className="flex w-full flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong sm:p-5"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-surface-3 text-fg-muted"><Flag className="size-5" aria-hidden="true" /></span>
            <span>
              <span className="block text-sm font-semibold text-fg">Selección nacional y doble carrera</span>
              <span className="block text-xs text-fg-muted">Dirigí a tu país, gestioná convocatorias y disputá torneos internacionales sin descuidar a tu club.</span>
            </span>
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-accent">Gestionar<ChevronRight className="size-4" aria-hidden="true" /></span>
        </button>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList aria-label="Secciones de la carrera">
            <TabsTrigger value="stints">Trayectoria ({stats?.stints?.length || 0})</TabsTrigger>
            <TabsTrigger value="offers">Ofertas ({offers.length})</TabsTrigger>
            <TabsTrigger value="vacancies">Bolsa de trabajo ({vacancies.length})</TabsTrigger>
            <TabsTrigger value="trophies">Trofeos ({stats?.trophies?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="stints">
            {stats?.stints?.length > 0 ? (
              <ul className="space-y-3">
                {stats.stints.map((stint, idx) => {
                  const current = !stint.ended_at
                  const total = (stint.matches_won || 0) + (stint.matches_drawn || 0) + (stint.matches_lost || 0)
                  const rate = total > 0 ? Math.round(((stint.matches_won || 0) / total) * 100) : 0
                  return (
                    <li key={stint.id || idx}>
                      <Card as="article" className={current ? 'border-accent/50' : undefined}>
                        <CardBody className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={cn('grid size-10 place-items-center rounded-md', current ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-fg-muted')}><Shield className="size-5" aria-hidden="true" /></span>
                              <div>
                                <h3 className="flex items-center gap-2 text-base font-semibold text-fg">
                                  {stint.club_name}
                                  <Badge tone={current ? 'accent' : 'neutral'}>{current ? 'Club actual' : (DEPARTURE[stint.departure_reason] || 'Concluido')}</Badge>
                                </h3>
                                <p className="text-xs text-fg-muted">Desde {formatDate(stint.started_at)} {stint.ended_at ? `hasta ${formatDate(stint.ended_at)}` : '(en curso)'}</p>
                              </div>
                            </div>
                            <Stat label="Efectividad" value={`${rate}%`} valueClassName="text-2xl text-accent" className="text-right" />
                          </div>
                          <dl className="grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
                            {[['PJ', stint.matches_managed, 'text-fg'], ['PG', stint.matches_won, 'text-accent'], ['PE', stint.matches_drawn, 'text-warning'], ['PP', stint.matches_lost, 'text-danger']].map(([k, v, c]) => (
                              <div key={k} className="rounded-md bg-surface-2 p-2"><dt className="eyebrow">{k}</dt><dd className={cn('num text-lg font-semibold', c)}>{v || 0}</dd></div>
                            ))}
                          </dl>
                        </CardBody>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Card as="div"><EmptyState icon={Shield} title="Sin ciclos registrados" description="Tu historial de clubes dirigidos aparecerá acá." /></Card>
            )}
          </TabsContent>

          <TabsContent value="offers">
            {offers.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {offers.map(offer => (
                  <li key={offer.id || offer.clubId}>
                    <Card as="article" className="h-full">
                      <CardBody className="flex h-full flex-col gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-base font-semibold text-fg">{offer.clubName}</h3>
                            <Badge>{offer.tierName}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-fg-muted">Objetivo: <span className="font-semibold text-gold">{offer.objective || 'Mitad de tabla'}</span></p>
                        </div>
                        <dl className="space-y-2 border-t border-line pt-3 text-sm">
                          <div className="flex justify-between gap-3"><dt className="text-fg-muted">Sueldo ofrecido</dt><dd className="num font-semibold text-accent">{formatMoney(offer.offeredSalary)}/sem</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-fg-muted">Presupuesto de fichajes</dt><dd className="num font-semibold text-fg">{formatMoney(offer.budget)}</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-fg-muted">Vigencia</dt><dd className="text-fg">Vence en {offer.weeksRemaining || 2} sem.</dd></div>
                        </dl>
                        <div className="mt-auto flex gap-2">
                          <Button className="flex-1" onClick={() => setSelectedOffer(offer)}>Revisar y firmar</Button>
                          <Button variant="outline" disabled={actionLoading} onClick={() => handleRejectOffer(offer)} aria-label={`Descartar oferta de ${offer.clubName}`}>Descartar</Button>
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <Card as="div"><EmptyState icon={Briefcase} title="Sin ofertas pendientes" description="Avanzá en el torneo o postulate activamente en la bolsa de trabajo." action={<Button variant="outline" size="sm" onClick={() => setTab('vacancies')}>Explorar la bolsa de trabajo</Button>} /></Card>
            )}
          </TabsContent>

          <TabsContent value="vacancies">
            {vacancies.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vacancies.map(target => (
                  <li key={target.id}>
                    <Card as="article" className="h-full">
                      <CardBody className="flex h-full flex-col gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-base font-semibold text-fg">{target.name}</h3>
                            <Badge>{target.tierName}</Badge>
                          </div>
                          <p className="text-xs text-fg-muted">{target.city}</p>
                        </div>
                        <dl className="space-y-2 border-t border-line pt-3 text-sm">
                          <div className="flex justify-between gap-3"><dt className="text-fg-muted">Reputación requerida</dt><dd className="num font-semibold text-fg">{target.requiredReputation} pts</dd></div>
                          <div className="flex items-center justify-between gap-3"><dt className="text-fg-muted">Tu probabilidad</dt><dd><Badge tone={chanceTone(target.chance)}>{target.chance}</Badge></dd></div>
                        </dl>
                        <Button className="mt-auto" variant="outline" disabled={actionLoading} onClick={() => handleApplyForJob(target)}><Send />Postularse</Button>
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <Card as="div"><EmptyState icon={Building} title="Sin vacantes" description="No hay clubes con puestos abiertos que coincidan con tu reputación." /></Card>
            )}
          </TabsContent>

          <TabsContent value="trophies">
            {stats?.trophies?.length > 0 ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {stats.trophies.map(trophy => (
                  <li key={trophy.id} className="flex items-center gap-4 rounded-lg border border-gold/30 bg-gold-soft p-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-md bg-surface text-gold"><Trophy className="size-6" aria-hidden="true" /></span>
                    <div>
                      <h3 className="text-sm font-semibold text-fg">{trophy.title}</h3>
                      <p className="text-xs text-fg-muted">Año {trophy.year} · {trophy.type}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Card as="div"><EmptyState icon={Trophy} title="Aún no levantaste trofeos" description="Ganá la liga o conseguí un ascenso para llenar tu vitrina." /></Card>
            )}
          </TabsContent>
        </Tabs>

        {manager.is_retired ? (
          <Card className="border-gold/40">
            <CardHeader><div><CardTitle className="flex items-center gap-2 text-gold"><Trophy className="size-5" aria-hidden="true" />Carrera finalizada · DT consagrado</CardTitle><CardDescription>Colgaste el buzo. Tu legado quedó en el Salón de la Fama y en la edición histórica del Diario del Retiro.</CardDescription></div></CardHeader>
            <CardBody className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/endgame')}>Ver el Diario del Retiro y epílogo</Button>
              <Button variant="outline" onClick={() => navigate('/hall-of-fame')}>Ver en el Salón de la Fama</Button>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-danger/30">
            <CardHeader><div><CardTitle className="flex items-center gap-2 text-danger"><AlertTriangle className="size-5" aria-hidden="true" />Retiro voluntario</CardTitle><CardDescription>Tu carrera concluirá definitivamente: se calcula tu legado, entrás al Salón de la Fama y se redacta la crónica de tu trayectoria.</CardDescription></div></CardHeader>
            <CardBody><Button variant="outline" loading={retiring} onClick={handleRetire}>Retirarse del fútbol profesional</Button></CardBody>
          </Card>
        )}
      </div>

      <JobOfferBottomSheet isOpen={!!selectedOffer} offer={selectedOffer} onClose={() => setSelectedOffer(null)} onAccept={handleAcceptOffer} onReject={handleRejectOffer} loading={actionLoading} />
      <ReputationHistoryModal isOpen={reputationOpen} onClose={() => setReputationOpen(false)} managerId={manager?.id} />
    </div>
  )
}
