import React, { useEffect, useState } from 'react'
import { Award, CheckCircle2, History, TrendingDown, TrendingUp } from 'lucide-react'
import { reputationApi } from '../../api/reputation'
import { Badge, Button, Card, CardBody, EmptyState, Progress, ResponsiveOverlay, SectionTitle, Skeleton } from '../../components/ui'
import { cn } from '../../lib/utils'

const PERKS = [
  ['hasRefereeRespect', 'Respeto arbitral', 'Reduce un 10% las amarillas por protestas del banco (requiere 76+ pts).'],
  ['hasSponsorBonus', 'Imán de patrocinios', 'Atrae sponsors premium con primas mayores (requiere 60+ pts).']
]

/** Prestigio del DT: rango, beneficios y libro mayor de variaciones. Diálogo en escritorio, página en móvil. */
export default function ReputationHistoryModal({ isOpen, onClose, managerId }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen || !managerId) return
    const loadData = async () => {
      setLoading(true)
      try {
        setProfile(await reputationApi.getReputationProfile(managerId))
      } catch (err) {
        console.error('Error cargando el historial de reputación:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isOpen, managerId])

  if (!isOpen) return null

  const rank = profile?.rank
  const score = profile?.score || 20

  return (
    <ResponsiveOverlay
      title={rank?.title || 'Director técnico'}
      description={`${rank?.subtitle || 'Nivel de reputación oficial'} · ${score} / 100 pts`}
      onClose={onClose}
      size="md"
      footer={<Button variant="outline" onClick={onClose}>Cerrar expediente</Button>}
    >
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Consultando el libro mayor de prestigio"><Skeleton className="h-24" /><Skeleton className="h-32" /></div>
      ) : (
        <div className="space-y-7">
          <Card as="div">
            <CardBody className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-fg-muted">{rank?.nextRank ? `Próximo escalón: ${rank.nextRank.title}` : 'Máximo prestigio alcanzado'}</span>
                <span className="num font-semibold text-gold">{rank?.nextRank ? `Faltan ${rank.pointsToNext} pts` : '100%'}</span>
              </div>
              <Progress tone="accent" value={Math.min(100, score)} label="Prestigio de carrera" />
              <p className="text-xs text-fg-subtle">Pico histórico de carrera: <span className="num font-semibold text-fg-muted">{profile?.peak || 20} pts</span></p>
            </CardBody>
          </Card>

          <section aria-labelledby="rep-perks">
            <SectionTitle>Beneficios de tu prestigio</SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-2">
              {PERKS.map(([key, title, text]) => {
                const active = !!profile?.[key]
                return (
                  <li key={key}>
                    <Card as="div" className={cn('h-full', active ? 'border-accent/40' : 'opacity-60')}>
                      <CardBody className="space-y-1.5">
                        <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                          <CheckCircle2 className={cn('size-4', active ? 'text-accent' : 'text-fg-subtle')} aria-hidden="true" />
                          {title}
                          <Badge tone={active ? 'accent' : 'neutral'}>{active ? 'Activo' : 'Bloqueado'}</Badge>
                        </p>
                        <p className="text-sm text-fg-muted">{text}</p>
                      </CardBody>
                    </Card>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="rep-ledger">
            <SectionTitle><span className="flex items-center gap-2"><Award className="size-4.5 text-accent" aria-hidden="true" />Libro mayor de variaciones</span></SectionTitle>
            {profile?.recentLedger?.length > 0 ? (
              <Card as="div">
                <ul className="divide-y divide-line">
                  {profile.recentLedger.map((item, idx) => {
                    const delta = Number(item.delta_amount || 0)
                    const positive = delta > 0
                    return (
                      <li key={item.id || idx} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={cn('grid size-8 shrink-0 place-items-center rounded-md', positive ? 'bg-accent-soft text-accent' : 'bg-danger-soft text-danger')} aria-hidden="true">
                            {positive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-fg">{item.description || item.event_type}</p>
                            <p className="text-xs text-fg-subtle">
                              {new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="num shrink-0 text-right">
                          <p className={cn('text-sm font-semibold', positive ? 'text-accent' : 'text-danger')}>{positive ? '+' : ''}{delta.toFixed(2)}</p>
                          <p className="text-xs text-fg-subtle">Total {item.reputation_after} pts</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </Card>
            ) : (
              <Card as="div"><EmptyState icon={History} title="Sin movimientos todavía" description="Los cambios de reputación aparecerán aquí a medida que juegues." /></Card>
            )}
          </section>
        </div>
      )}
    </ResponsiveOverlay>
  )
}
