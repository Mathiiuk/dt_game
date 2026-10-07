import React, { useState, useEffect } from 'react'
import { ArrowDownRight, ArrowUpRight, Tv } from 'lucide-react'
import { toast } from 'sonner'
import { competitionTiersApi, LEAGUE_TIERS } from '../../api/competitionTiers'
import { formatMoney } from '../../lib/format'
import { movementOf, PROMOTED_SPOTS, RELEGATED_SPOTS, TEAMS_PER_LEAGUE } from '../../domain/pyramid'
import { Badge, Button, Card, CardBody, ResponsiveOverlay, Skeleton } from '../../components/ui'
import { cn } from '../../lib/utils'

/**
 * Pirámide de ligas. Diálogo en escritorio, página completa en móvil.
 * Los ascensos y descensos salen de las mismas reglas que el cierre de temporada (domain/pyramid).
 */
export default function LeaguePyramidModal({ club, currentTier = 5, onClose }) {
  const [pyramidList, setPyramidList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setPyramidList(await competitionTiersApi.getLeaguePyramid())
      } catch (e) {
        console.error(e)
        toast.error('Error al cargar la pirámide de ligas')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const myTier = club?.league_tier || currentTier

  return (
    <ResponsiveOverlay
      title="Pirámide del fútbol nacional"
      description="5 divisiones: suben los dos primeros y bajan los tres últimos"
      onClose={onClose}
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Cerrar</Button>}
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : (
        <ul className="space-y-3">
          {pyramidList.map((tier) => {
            const isCurrent = myTier === tier.tier_level
            const meta = LEAGUE_TIERS[tier.tier_level] || {}
            const promotes = movementOf(1, tier.tier_level) === 'PROMOTED'
            const relegates = movementOf(TEAMS_PER_LEAGUE, tier.tier_level) === 'RELEGATED'
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

                    <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3 text-xs sm:grid-cols-3">
                      <div className="flex items-center gap-1.5 text-accent"><ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /><dt className="sr-only">Ascensos</dt><dd>{promotes ? `${PROMOTED_SPOTS} ascensos directos` : 'Sin ascensos'}</dd></div>
                      <div className="flex items-center gap-1.5 text-danger"><ArrowDownRight className="size-3.5 shrink-0" aria-hidden="true" /><dt className="sr-only">Descensos</dt><dd>{relegates ? `${RELEGATED_SPOTS} descensos` : 'Sin descensos'}</dd></div>
                      <div className="flex items-center gap-1.5 text-fg-muted"><Tv className="size-3.5 shrink-0" aria-hidden="true" /><dt className="sr-only">Televisión</dt><dd className="num">{formatMoney(tier.base_tv_revenue_weekly || 400)}/sem TV</dd></div>
                    </dl>
                  </CardBody>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </ResponsiveOverlay>
  )
}
