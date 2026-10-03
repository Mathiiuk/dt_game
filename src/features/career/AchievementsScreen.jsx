import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameContext } from '../../context/GameContext'
import { achievementsApi } from '../../api/achievements'
import { 
  ArrowLeft, Award, Trophy, Flame, Zap, Shield, Crown, Globe, 
  Sparkles, Star, Target, Briefcase, Search, DollarSign, CheckCircle, 
  Lock, Gift, Filter, Loader2, ChevronRight, TrendingUp, Medal, Crosshair, FileText, Building2
} from 'lucide-react'
import { toast } from 'sonner'
import BottomNav from '../../components/BottomNav'

// Mapeo dinámico de iconos Lucide
const ICON_MAP = {
  Award, Trophy, Flame, Zap, Shield, Crown, Globe,
  Sparkles, Star, Target, Briefcase, Search, DollarSign,
  TrendingUp, Medal, Crosshair, FileText, Building2
}

export default function AchievementsScreen() {
  const navigate = useNavigate()
  const { manager, club, refreshContext } = useGameContext()

  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [claimingAll, setClaimingAll] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all') // all, completed, in_progress, claimable

  useEffect(() => {
    if (!manager) return

    const loadData = async () => {
      setLoading(true)
      try {
        // 1. Evaluar estado autoritativo
        await achievementsApi.evaluateAchievements(manager.id, club?.id)
        // 2. Traer logros
        const list = await achievementsApi.getManagerAchievements(manager.id)
        setAchievements(list)
      } catch (err) {
        console.error('Error loading achievements:', err)
        toast.error('No se pudieron cargar los logros')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [manager?.id, club?.id])

  const handleClaim = async (achievement) => {
    if (!manager || claiming) return
    setClaiming(achievement.code)

    try {
      const res = await achievementsApi.claimReward(manager.id, achievement.code)
      if (res.success) {
        toast.success(`¡Recompensa reclamada! +${res.reward_xp} XP | +${res.reward_reputation} Rep`)
        setAchievements(prev => prev.map(a => 
          a.code === achievement.code 
            ? { ...a, is_claimed: true, claimed_at: new Date().toISOString() } 
            : a
        ))
        if (refreshContext) await refreshContext()
      } else {
        toast.error(res.error || 'No se pudo reclamar la recompensa')
      }
    } catch (err) {
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
        toast.success(`¡Se reclamaron ${res.claimedCount} logros! +${res.totalXp} XP | +${res.totalRep} Rep`)
        const updated = await achievementsApi.getManagerAchievements(manager.id)
        setAchievements(updated)
        if (refreshContext) await refreshContext()
      } else {
        toast.info('No hay recompensas pendientes para reclamar')
      }
    } catch (err) {
      toast.error('Error al reclamar las recompensas')
    } finally {
      setClaimingAll(false)
    }
  }

  // Filtrado de logros
  const filteredAchievements = achievements.filter(item => {
    // Filtro categoría
    if (activeCategory !== 'all' && item.category !== activeCategory) return false

    // Filtro estado
    if (activeFilter === 'claimable') return item.is_unlocked && !item.is_claimed
    if (activeFilter === 'completed') return item.is_unlocked
    if (activeFilter === 'in_progress') return !item.is_unlocked

    return true
  })

  // Estadísticas globales
  const totalCount = achievements.length
  const unlockedCount = achievements.filter(a => a.is_unlocked).length
  const claimableCount = achievements.filter(a => a.is_unlocked && !a.is_claimed).length
  const totalXpClaimed = achievements.filter(a => a.is_claimed).reduce((acc, a) => acc + (a.reward_xp || 0), 0)
  const percentComplete = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'matches', label: 'Partidos' },
    { id: 'titles', label: 'Títulos' },
    { id: 'management', label: 'Gestión' },
    { id: 'youth', label: 'Cantera' },
    { id: 'career', label: 'Carrera' }
  ]

  const getRarityConfig = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return {
          label: 'Legendario',
          border: 'border-amber-500/50',
          bg: 'bg-gradient-to-br from-amber-950/30 to-zinc-900',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconColor: 'text-amber-400',
          progressColor: 'bg-amber-500'
        }
      case 'epic':
        return {
          label: 'Épico',
          border: 'border-purple-500/50',
          bg: 'bg-gradient-to-br from-purple-950/30 to-zinc-900',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          iconColor: 'text-purple-400',
          progressColor: 'bg-purple-500'
        }
      case 'rare':
        return {
          label: 'Raro',
          border: 'border-cyan-500/50',
          bg: 'bg-gradient-to-br from-cyan-950/30 to-zinc-900',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          iconColor: 'text-cyan-400',
          progressColor: 'bg-cyan-500'
        }
      default:
        return {
          label: 'Común',
          border: 'border-zinc-800',
          bg: 'bg-zinc-900/60',
          badge: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          iconColor: 'text-zinc-400',
          progressColor: 'bg-emerald-500'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-400 font-medium">Cargando logros de carrera...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-3 sm:p-6 md:p-8 pb-28 md:pb-8">
      {/* Cabecera */}
      <header className="flex items-center justify-between mb-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/manager')}
            className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black flex items-center gap-2 text-emerald-500 truncate">
              <Award className="w-6 h-6 md:w-8 md:h-8 shrink-0" /> LOGROS Y DESAFÍOS
            </h1>
            <p className="text-xs text-zinc-400">Objetivos, hitos y recompensas de carrera profesional</p>
          </div>
        </div>

        {claimableCount > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={claimingAll}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl text-xs md:text-sm shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 shrink-0"
          >
            {claimingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Gift className="w-4 h-4" />
            )}
            <span>Reclamar Todo ({claimableCount})</span>
          </button>
        )}
      </header>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner de Progresión Global */}
        <div className="p-4 sm:p-6 border border-zinc-800 rounded-3xl bg-zinc-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-zinc-900/80 p-3 sm:p-4 rounded-2xl border border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1">Completados</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">{unlockedCount}</span>
                <span className="text-xs text-zinc-500">/ {totalCount}</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 p-3 sm:p-4 rounded-2xl border border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1">Por Reclamar</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">{claimableCount}</span>
                <span className="text-xs text-zinc-500">pendientes</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 p-3 sm:p-4 rounded-2xl border border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1">XP Obtenida</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-cyan-400">{totalXpClaimed}</span>
                <span className="text-xs text-zinc-500">XP</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 p-3 sm:p-4 rounded-2xl border border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block mb-1">Progreso Total</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">{percentComplete}%</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso global */}
          <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Filtros por Categoría y Estado */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Pestañas de categoría */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filtro de estado */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter('claimable')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'claimable' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Por Reclamar
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'completed' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Completados
            </button>
            <button
              onClick={() => setActiveFilter('in_progress')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                activeFilter === 'in_progress' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              En Curso
            </button>
          </div>
        </div>

        {/* Lista de Logros en Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map(item => {
            const rarity = getRarityConfig(item.rarity)
            const IconComponent = ICON_MAP[item.icon] || Award
            const progress = Math.min(100, Math.round(((item.current_progress || 0) / (item.target_progress || 1)) * 100))
            const canClaim = item.is_unlocked && !item.is_claimed
            const isClaimingThis = claiming === item.code

            return (
              <div
                key={item.code}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between ${rarity.border} ${rarity.bg} ${
                  canClaim ? 'ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        item.is_unlocked ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950 border-zinc-800/80 opacity-60'
                      }`}>
                        {item.is_unlocked ? (
                          <IconComponent className={`w-6 h-6 ${rarity.iconColor}`} />
                        ) : (
                          <Lock className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-base font-black ${item.is_unlocked ? 'text-white' : 'text-zinc-400'}`}>
                            {item.title}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block mt-0.5 ${rarity.badge}`}>
                          {rarity.label}
                        </span>
                      </div>
                    </div>

                    {/* Recompensas pill */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-black text-emerald-400">+{item.reward_xp} XP</span>
                      <span className="text-[10px] font-bold text-amber-400">+{item.reward_reputation} Rep</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div>
                  {/* Barra de progreso */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                      <span>Progreso</span>
                      <span>
                        {item.current_progress} / {item.target_progress} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950 rounded-full h-2 border border-zinc-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${rarity.progressColor}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Acciones de Reclamo */}
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                    {canClaim ? (
                      <button
                        onClick={() => handleClaim(item)}
                        disabled={isClaimingThis}
                        className="w-full py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
                      >
                        {isClaimingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span>Reclamar Recompensa</span>
                      </button>
                    ) : item.is_claimed ? (
                      <div className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-bold text-zinc-400 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Completado y Reclamado</span>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-zinc-500 bg-zinc-950/30 rounded-xl border border-zinc-900">
                        <Lock className="w-3.5 h-3.5 text-zinc-600" />
                        <span>En progreso</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
            <Award className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-300">No hay logros en esta categoría</h3>
            <p className="text-xs text-zinc-500 mt-1">Selecciona otro filtro para visualizar tus desafíos disponibles.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
