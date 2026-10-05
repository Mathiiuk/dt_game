import React, { useState, useEffect } from 'react'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Layers, Swords, Tv } from 'lucide-react'
import { toast } from 'sonner'
import { competitionTiersApi, LEAGUE_TIERS } from '../../api/competitionTiers'
import { formatMoney } from '../../lib/format'
import { Badge, Button, Card, CardBody, EmptyState, ResponsiveOverlay, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui'
import { cn } from '../../lib/utils'

/** Pirámide de ligas y torneo reducido. Diálogo en escritorio, página completa en móvil. */
export default function LeaguePyramidModal({ club, currentTier = 5, careerId, seasonYear = 2026, onClose }) {
  const [pyramidList, setPyramidList] = useState([])
  const [playoffs, setPlayoffs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [pyr, ply] = await Promise.all([
          competitionTiersApi.getLeaguePyramid(),
          careerId ? competitionTiersApi.getPlayoffFixtures(careerId, seasonYear) : []
        ])
        setPyramidList(pyr)
        setPlayoffs(ply)
      } catch (e) {
        console.error(e)
        toast.error('Error al cargar la pirámide de ligas')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [careerId, seasonYear])

  const myTier = club?.league_tier || currentTier

  return (
    <ResponsiveOverlay
      title="Pirámide del fútbol nacional"
      description="5 divisiones, 3 boletos de ascenso (2 directos y 1 por reducido) y descensos"
      onClose={onClose}
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      <Tabs defaultValue="pyramid">
        <TabsList>
          <TabsTrigger value="pyramid"><Layers className="mr-1.5 inline size-4" aria-hidden="true" />Divisiones</TabsTrigger>
          <TabsTrigger value="playoffs"><Swords className="mr-1.5 inline size-4" aria-hidden="true" />Torneo reducido</TabsTrigger>
        </TabsList>

        <TabsContent value="pyramid">
          {loading ? (
            <div className="space-y-3" aria-busy="true"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          ) : (
            <ul className="space-y-3">
              {pyramidList.map((tier) => {
                const isCurrent = myTier === tier.tier_level
                const meta = LEAGUE_TIERS[tier.tier_level] || {}
                return (
                  <li key={tier.tier_level}>
                    <Card as="article" className={cn(isCurrent && 'border-accent/60')} aria-current={isCurrent ? 'true' : undefined}>
                      <CardBody className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-3 font-display text-lg font-semibold text-fg">
                              {tier.tier_level}
                            </span>
                            <div className="min-w-0">
                              <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-fg">
                                {tier.tier_name}
                                {isCurrent && <Badge tone="accent" dot>Tu división</Badge>}
                              </h3>
                              <p className="mt-0.5 text-xs text-fg-muted">{meta.description}</p>
                            </div>
                          </div>
                          <span className="num shrink-0 text-xs text-fg-subtle">20 equipos</span>
                        </div>

                        <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs sm:grid-cols-4">
                          <div className="flex items-center gap-1.5 text-accent"><ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /><dt className="sr-only">Ascensos</dt><dd>{tier.automatic_promotions} ascensos directos</dd></div>
                          <div className="flex items-center gap-1.5 text-fg-muted"><Swords className="size-3.5 shrink-0" aria-hidden="true" /><dt className="sr-only">Reducido</dt><dd>{tier.playoff_promotions ? '1 boleto por reducido' : 'Sin reducido'}</dd></div>
                          <div className="flex items-center gap-1.5 text-danger"><ArrowDownRight className="size-3.5 shrink-0" aria-hidden="true" /><dt className="sr-only">Descensos</dt><dd>{tier.relegations_count ? `${tier.relegations_count} descensos` : 'Sin descensos'}</dd></div>
                          <div className="flex items-center gap-1.5 text-fg-muted"><Tv className="size-3.5 shrink-0" aria-hidden="true" /><dt className="sr-only">Televisión</dt><dd className="num">{formatMoney(tier.base_tv_revenue_weekly || 400)}/sem TV</dd></div>
                        </dl>
                      </CardBody>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="playoffs" className="space-y-4">
          <Card as="div">
            <CardBody className="space-y-2.5">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-fg"><Swords className="size-4.5 text-accent" aria-hidden="true" />Reglamento del reducido</h3>
              <p className="text-sm leading-relaxed text-fg-muted">
                Los clubes que terminan <strong className="font-semibold text-fg">3.º, 4.º, 5.º y 6.º</strong> juegan una liguilla a partido único por el tercer ascenso.
              </p>
              <ul className="space-y-1.5 border-t border-line pt-2.5 text-sm text-fg-muted">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" aria-hidden="true" />Semifinal 1: 3.º contra 6.º</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" aria-hidden="true" />Semifinal 2: 4.º contra 5.º</li>
              </ul>
            </CardBody>
          </Card>

          {playoffs.length === 0 ? (
            <Card as="div"><EmptyState icon={Swords} title="Las llaves aún no existen" description="Se activan solas al terminar las 38 fechas del campeonato." /></Card>
          ) : (
            <ul className="space-y-2.5">
              {playoffs.map(f => (
                <li key={f.id}>
                  <Card as="div">
                    <CardBody className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Badge tone="warning">{f.round_name === 'FINAL' ? 'Final del reducido' : 'Semifinal'}</Badge>
                        <p className="mt-1.5 truncate text-sm font-semibold text-fg">{f.home_club?.name || 'Local'} vs {f.away_club?.name || 'Visitante'}</p>
                      </div>
                      <div className="num shrink-0 text-right">
                        <p className="font-display text-2xl font-semibold text-fg">{f.home_score} – {f.away_score}</p>
                        {f.penalty_home_score != null && <p className="text-xs text-accent">pen. {f.penalty_home_score}–{f.penalty_away_score}</p>}
                      </div>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </ResponsiveOverlay>
  )
}
