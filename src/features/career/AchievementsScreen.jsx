import React, { useEffect, useMemo, useState } from 'react'
import {
  Award, Briefcase, Building2, CheckCircle, Crosshair, Crown, DollarSign, FileText, Flame, Gift, Globe, Lock, Medal, Search,
  Shield, Sparkles, Star, Target, TrendingUp, Trophy, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { achievementsApi } from '../../api/achievements'
import {
  ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_STATES, filterAchievements, isClaimable, progressPercent, rarityOf, summarizeAchievements
} from '../../domain/achievements'
import { cn } from '../../lib/utils'
import { Badge, Button, Card, CardBody, ChoiceChips, EmptyState, PageHeader, Progress, Skeleton, Stat } from '../../components/ui'

const ICON_MAP = {
  Award, Trophy, Flame, Zap, Shield, Crown, Globe, Sparkles, Star, Target, Briefcase, Search, DollarSign, TrendingUp, Medal,
  Crosshair, FileText, Building2
}

export default function AchievementsScreen() {
  const { manager, club, refreshContext } = useGameContext()
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [claimingAll, setClaimingAll] = useState(false)
  const [category, setCategory] = useState('all')
  const [state, setState] = useState('all')

  useEffect(() => {
    if (!manager) return
    const load = async () => {
      setLoading(true)
      try {
        await achievementsApi.evaluateAchievements(manager.id, club?.id)
        setAchievements(await achievementsApi.getManagerAchievements(manager.id))
      } catch (err) {
        console.error('Error loading achievements:', err)
        toast.error('No se pudieron cargar los logros')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [manager?.id, club?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = async (achievement) => {
    if (!manager || claiming) return
    setClaiming(achievement.code)
    try {
      const res = await achievementsApi.claimReward(manager.id, achievement.code)
      if (res.success) {
        toast.success(`¡Recompensa reclamada! +${res.reward_xp} XP · +${res.reward_reputation} Rep`)
        setAchievements(prev => prev.map(a => (a.code === achievement.code ? { ...a, is_claimed: true, claimed_at: new Date().toISOString() } : a)))
        if (refreshContext) await refreshContext()
      } else {
        toast.error(res.error || 'No se pudo reclamar la recompensa')
      }
    } catch {
      toast.error('Error al procesar el reclamo')
    } finally {
      setClaiming(null)
    }
  }

  const handleClaimAll = async () => {
    if (!manager || claimingAll) return
    setClaimingAll(true)
    try {
      const res = await achievementsApi.claimAllEligible(manager.id)
      if (res.claimedCount > 0) {
        toast.success(`¡Se reclamaron ${res.claimedCount} logros! +${res.totalXp} XP · +${res.totalRep} Rep`)
        setAchievements(await achievementsApi.getManagerAchievements(manager.id))
        if (refreshContext) await refreshContext()
      } else {
        toast.info('No hay recompensas pendientes para reclamar')
      }
    } catch {
      toast.error('Error al reclamar las recompensas')
    } finally {
      setClaimingAll(false)
    }
  }

  const visible = useMemo(() => filterAchievements(achievements, category, state), [achievements, category, state])
  const summary = useMemo(() => summarizeAchievements(achievements), [achievements])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" role="status" aria-label="Cargando logros">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-28" />
        <div className="grid gap-4 md:grid-cols-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-44" />)}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <PageHeader
        backTo="/manager"
        eyebrow="Objetivos, hitos y recompensas"
        title="Logros y desafíos"
        actions={summary.claimable > 0 && <Button loading={claimingAll} onClick={handleClaimAll}>{!claimingAll && <Gift />}Reclamar todo ({summary.claimable})</Button>}
      />

      <Card className="mb-6">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Stat label="Completados" value={`${summary.unlocked} / ${summary.total}`} />
            <Stat label="Por reclamar" value={summary.claimable} valueClassName="text-accent" />
            <Stat label="XP obtenida" value={summary.xpClaimed} />
            <Stat label="Progreso total" value={`${summary.percent}%`} valueClassName="text-gold" />
          </div>
          <Progress value={summary.percent} label="Progreso total de logros" className="h-2" />
        </CardBody>
      </Card>

      <div className="mb-5 space-y-3">
        <ChoiceChips label="Categoría" value={category} onChange={setCategory} options={ACHIEVEMENT_CATEGORIES} />
        <ChoiceChips label="Estado" value={state} onChange={setState} options={ACHIEVEMENT_STATES} />
      </div>

      {visible.length === 0 ? (
        <Card as="div"><EmptyState icon={Award} title="Sin logros en esta selección" description="Probá con otro filtro para ver tus desafíos disponibles." action={<Button variant="outline" size="sm" onClick={() => { setCategory('all'); setState('all') }}>Quitar filtros</Button>} /></Card>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Logros">
          {visible.map(item => {
            const rarity = rarityOf(item.rarity)
            const Icon = ICON_MAP[item.icon] || Award
            const pct = progressPercent(item)
            const canClaim = isClaimable(item)
            return (
              <li key={item.code}>
                <Card as="article" className={cn('h-full', rarity.border, canClaim && 'ring-1 ring-accent/50')}>
                  <CardBody className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn('grid size-12 shrink-0 place-items-center rounded-md', item.is_unlocked ? 'bg-surface-3 text-gold' : 'bg-surface-2 text-fg-subtle')}>
                          {item.is_unlocked ? <Icon className="size-6" aria-hidden="true" /> : <Lock className="size-5" aria-hidden="true" />}
                        </span>
                        <div className="min-w-0">
                          <h3 className={cn('text-base font-semibold', item.is_unlocked ? 'text-fg' : 'text-fg-muted')}>{item.title}</h3>
                          <Badge tone={rarity.tone} className="mt-1">{rarity.label}</Badge>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs font-semibold">
                        <p className="num text-accent">+{item.reward_xp} XP</p>
                        <p className="num text-gold">+{item.reward_reputation} Rep</p>
                      </div>
                    </div>

                    <p className="text-sm text-fg-muted">{item.description}</p>

                    <div className="mt-auto space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-fg-muted">
                          <span>Progreso</span>
                          <span className="num">{item.current_progress} / {item.target_progress} ({pct}%)</span>
                        </div>
                        <Progress value={pct} label={`Progreso de ${item.title}`} />
                      </div>

                      {canClaim ? (
                        <Button className="w-full" loading={claiming === item.code} onClick={() => handleClaim(item)}>
                          {claiming !== item.code && <Sparkles />}Reclamar recompensa
                        </Button>
                      ) : item.is_claimed ? (
                        <p className="flex items-center justify-center gap-2 rounded-md bg-surface-2 py-2 text-xs font-semibold text-fg-muted"><CheckCircle className="size-4 text-accent" aria-hidden="true" />Completado y reclamado</p>
                      ) : (
                        <p className="flex items-center justify-center gap-2 rounded-md bg-surface-2 py-2 text-xs font-semibold text-fg-subtle"><Lock className="size-3.5" aria-hidden="true" />En progreso</p>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
