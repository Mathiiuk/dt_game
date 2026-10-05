import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameContext } from '../../context/GameContext'
import { endgameApi } from '../../api/endgame'
import { 
  Trophy, Award, Crown, Medal, Sparkles, Newspaper, 
  ArrowRight, History, UserPlus, ChevronRight, CheckCircle, 
  Flame, Star, Loader2, ArrowLeft, Building2, Globe
} from 'lucide-react'
import { toast } from 'sonner'
import { AsyncButton } from '../../components/ui'
import { friendlyError } from '../../lib/errors'

export default function EndgameScreen() {
  const navigate = useNavigate()
  const { user, manager: activeManager, retiredManager, club, loading: contextLoading, confirmAction } = useGameContext()
  // El epílogo se muestra para el DT activo (si todavía no se retiró) o para el último DT retirado
  const manager = activeManager || retiredManager
  const isRetiredView = !activeManager && !!retiredManager

  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startingDynasty, setStartingDynasty] = useState(false)

  useEffect(() => {
    if (contextLoading) return
    if (!manager) {
      navigate('/create-manager', { replace: true })
      return
    }

    const loadEndgame = async () => {
      setLoading(true)
      try {
        const snap = await endgameApi.getEndgameSnapshot(manager.id)
        if (snap) {
          setSnapshot(snap)
        } else if (manager.is_retired) {
          // Si el DT ya estaba marcado como retirado pero no tenía snapshot
          const newSnap = await endgameApi.processRetirement(manager.id, club?.id)
          setSnapshot(newSnap)
        }
      } catch (err) {
        console.error('Error loading endgame snapshot:', err)
        toast.error('No se pudo cargar la crónica de retiro')
      } finally {
        setLoading(false)
      }
    }

    loadEndgame()
  }, [manager?.id, club?.id, contextLoading])

  const handleStartDynasty = async () => {
    if (!user || !manager || startingDynasty) return

    const confirmed = await confirmAction({
      title: 'Fundar nueva dinastía',
      description: '¿Deseas iniciar una nueva dinastía como Director Técnico? El mundo, los clubes, los récords y el legado de tu entrenador actual permanecerán intactos en la historia de la liga.',
      confirmText: 'Fundar Dinastía',
      cancelText: 'Cancelar',
      variant: 'default'
    })

    if (!confirmed) return

    setStartingDynasty(true)

    try {
      await endgameApi.startNewDynasty(user.id, manager.id)
      toast.success('¡El mundo continúa! Creando nuevo Director Técnico para la dinastía...')
      navigate('/create-manager', { replace: true })
    } catch (err) {
      toast.error(friendlyError(err, 'Error al iniciar la nueva dinastía'))
      setStartingDynasty(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center text-fg">
        <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
        <p className="text-fg-muted font-medium">Cargando epílogo y legado histórico...</p>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="min-h-dvh bg-bg text-fg p-6 flex flex-col items-center justify-center text-center">
        <Newspaper className="w-16 h-16 text-fg-subtle mb-4" />
        <h2 className="text-2xl font-semibold text-fg">Aún no te has retirado</h2>
        <p className="text-fg-muted text-sm max-w-md mt-2 mb-6">
          La crónica de despedida y el epílogo de retiro se redactan una vez que decides colgar el buzo de DT desde la pantalla de Carrera.
        </p>
        <button
          onClick={() => navigate('/manager')}
          className="px-6 py-3 bg-accent hover:bg-accent-strong text-black font-semibold rounded-xl text-sm transition-transform active:scale-95"
        >
          Volver a carrera del DT
        </button>
      </div>
    )
  }

  const trophiesList = Array.isArray(snapshot.trophies) ? snapshot.trophies : []

  return (
    <div className="min-h-dvh bg-bg text-fg p-3 sm:p-6 md:p-8 pb-28 md:pb-8">
      {/* Barra Superior */}
      <header className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Con el DT retirado no hay a dónde volver: el único camino es la sucesión o el Salón de la Fama */}
          {!isRetiredView && (
            <button 
              onClick={() => navigate('/manager')}
              className="p-2 transition-colors border rounded-lg border-line bg-surface hover:bg-surface-3 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gold">Epílogo y dinastía</span>
            <h1 className="text-lg sm:text-2xl font-semibold text-fg flex items-center gap-2">
              <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-gold" /> DIARIO DEL DÍA DEL RETIRO
            </h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/hall-of-fame')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 font-bold rounded-xl text-xs sm:text-sm transition-colors shrink-0"
        >
          <Trophy className="w-4 h-4 text-gold" />
          <span className="hidden sm:inline">Salón de la Fama</span>
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* PORTADA DEL DIARIO ESTILO VINTAGE / DEPORTIVO */}
        <div className="border-2 border-gold/40 rounded-xl bg-gradient-to-b from-surface via-surface/90 to-bg p-4 sm:p-8 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
          {/* Marca de agua y brillo de fondo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl -z-10" />

          {/* Encabezado del periódico */}
          <div className="border-b-2 border-gold/30 pb-4 mb-6 text-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-gold/80 uppercase tracking-widest mb-1">
              <span>EL PERIÓDICO DEL POTRERO</span>
              <span>{snapshot.newspaper_edition}</span>
              <span>HISTORIA PURA</span>
            </div>
            <div className="w-full h-px bg-surface-3 my-1" />
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-fg uppercase tracking-tight mt-2 leading-none">
              {snapshot.career_headline}
            </h2>
            <p className="text-sm sm:text-base text-fg italic mt-2 max-w-2xl mx-auto">
              {snapshot.manager_name} dice adiós como Director Técnico consagrado con el rango de <span className="text-gold font-bold not-italic">{snapshot.legacy_rank}</span>.
            </p>
          </div>

          {/* Grid Principal: Crónica y Tarjeta de Honor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Texto de la Crónica */}
            <div className="lg:col-span-2 space-y-4 text-sm sm:text-base text-fg leading-relaxed font-serif">
              {(snapshot.epilogue_text || '').split('\n\n').map((p, idx) => (
                <p key={idx} className="first-letter:text-3xl first-letter:font-semibold first-letter:text-gold first-letter:float-left first-letter:mr-2">
                  {p}
                </p>
              ))}
            </div>

            {/* Tarjeta de Honor del DT Retirado */}
            <div className="p-6 rounded-lg border border-gold/30 bg-bg/80 flex flex-col items-center justify-between text-center relative">
              <div className="w-24 h-24 rounded-lg bg-gradient-to-tr from-gold to-gold text-black flex items-center justify-center font-semibold text-4xl shadow-xl shadow-amber-500/20 mb-3">
                {snapshot.manager_name ? snapshot.manager_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'DT'}
              </div>

              <div>
                <h3 className="text-xl font-semibold text-fg">{snapshot.manager_name}</h3>
                <p className="text-xs text-fg-muted mt-0.5">{snapshot.club_name || 'Club Profesional'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-semibold uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5" />
                  {snapshot.legacy_rank}
                </div>
              </div>

              <div className="w-full mt-4 pt-4 border-t border-line">
                <span className="text-[10px] text-fg-subtle uppercase tracking-widest block font-bold">Puntos de legado</span>
                <span className="text-3xl font-semibold text-gold">{snapshot.legacy_score}</span>
              </div>
            </div>
          </div>

          {/* Métricas Históricas Cuantitativas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-lg bg-bg border border-line mb-6">
            <div className="text-center p-2">
              <span className="text-xs text-fg-subtle font-bold block">Partidos totales</span>
              <span className="text-2xl sm:text-3xl font-semibold text-fg">{snapshot.total_matches}</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs text-fg-subtle font-bold block">Victorias</span>
              <span className="text-2xl sm:text-3xl font-semibold text-accent">{snapshot.total_won}</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs text-fg-subtle font-bold block">Efectividad</span>
              <span className="text-2xl sm:text-3xl font-semibold text-accent">{snapshot.win_rate}%</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs text-fg-subtle font-bold block">Títulos oficiales</span>
              <span className="text-2xl sm:text-3xl font-semibold text-gold">{snapshot.titles_count}</span>
            </div>
          </div>

          {/* Vitrina de Trofeos Ganados */}
          {trophiesList.length > 0 && (
            <div className="border-t border-line pt-6">
              <h4 className="text-sm font-semibold text-fg-muted uppercase tracking-wider flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-gold" /> Vitrina de Palmarés y Vueltas Olímpicas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {trophiesList.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-gold/20 bg-gold/5 flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-fg truncate">{t.title}</p>
                      <p className="text-[10px] text-fg-muted">{t.year || 'Era Dorada'} • {t.type || 'Oficial'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ACCIONES DE LEGADO Y DINASTÍA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/hall-of-fame')}
            className="p-5 rounded-xl border border-gold/30 bg-surface/60 hover:bg-surface flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gold/20 text-gold border border-gold/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-fg">Ver en el Salón de la Fama</h4>
                <p className="text-xs text-fg-muted mt-0.5">Consulta tu posición frente a las máximas leyendas</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
          </button>

          <AsyncButton
            onClick={handleStartDynasty}
            disabled={startingDynasty}
            className="p-5 rounded-xl border border-accent/40 bg-gradient-to-r from-accent/40 via-surface to-surface hover:border-accent flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-semibold">
                {startingDynasty ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-accent">Fundar nueva dinastía</h4>
                <p className="text-xs text-fg-muted mt-0.5">Crea un nuevo DT conservando el mundo y la historia</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" />
          </AsyncButton>
        </div>
      </div>

    </div>
  )
}
