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
import BottomNav from '../../components/BottomNav'

export default function EndgameScreen() {
  const navigate = useNavigate()
  const { user, manager, club, refreshContext } = useGameContext()

  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startingDynasty, setStartingDynasty] = useState(false)

  useEffect(() => {
    if (!manager) return

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
  }, [manager?.id, club?.id])

  const handleStartDynasty = async () => {
    if (!user || !manager || startingDynasty) return
    setStartingDynasty(true)

    try {
      await endgameApi.startNewDynasty(user.id, manager.id)
      toast.success('¡El mundo continúa! Creando nuevo Director Técnico para la dinastía...')
      if (refreshContext) await refreshContext()
      navigate('/create-manager')
    } catch (err) {
      toast.error('Error al iniciar la nueva dinastía')
      setStartingDynasty(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className="text-zinc-400 font-medium">Cargando epílogo y legado histórico...</p>
      </div>
    )
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center text-center">
        <Newspaper className="w-16 h-16 text-zinc-600 mb-4" />
        <h2 className="text-2xl font-black text-white">Aún no te has retirado</h2>
        <p className="text-zinc-400 text-sm max-w-md mt-2 mb-6">
          La crónica de despedida y el epílogo de retiro se redactan una vez que decides colgar el buzo de DT desde la pantalla de Carrera.
        </p>
        <button
          onClick={() => navigate('/manager')}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl text-sm transition-transform active:scale-95"
        >
          Volver a Carrera del DT
        </button>
      </div>
    )
  }

  const trophiesList = Array.isArray(snapshot.trophies) ? snapshot.trophies : []

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-3 sm:p-6 md:p-8 pb-28 md:pb-8">
      {/* Barra Superior */}
      <header className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/manager')}
            className="p-2 transition-colors border rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Epílogo & Dinastía</span>
            <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" /> DIARIO DEL DÍA DEL RETIRO
            </h1>
          </div>
        </div>

        <button
          onClick={() => navigate('/hall-of-fame')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold rounded-xl text-xs sm:text-sm transition-colors shrink-0"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Salón de la Fama</span>
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* PORTADA DEL DIARIO ESTILO VINTAGE / DEPORTIVO */}
        <div className="border-2 border-amber-500/40 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 sm:p-8 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
          {/* Marca de agua y brillo de fondo */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -z-10" />

          {/* Encabezado del periódico */}
          <div className="border-b-2 border-amber-500/30 pb-4 mb-6 text-center">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-500/80 uppercase tracking-widest mb-1">
              <span>EL PERIÓDICO DEL POTRERO</span>
              <span>{snapshot.newspaper_edition}</span>
              <span>HISTORIA PURA</span>
            </div>
            <div className="w-full h-px bg-zinc-800 my-1" />
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight mt-2 leading-none">
              {snapshot.career_headline}
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 italic mt-2 max-w-2xl mx-auto">
              {snapshot.manager_name} dice adiós como Director Técnico consagrado con el rango de <span className="text-amber-400 font-bold not-italic">{snapshot.legacy_rank}</span>.
            </p>
          </div>

          {/* Grid Principal: Crónica y Tarjeta de Honor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Texto de la Crónica */}
            <div className="lg:col-span-2 space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed font-serif">
              {(snapshot.epilogue_text || '').split('\n\n').map((p, idx) => (
                <p key={idx} className="first-letter:text-3xl first-letter:font-black first-letter:text-amber-400 first-letter:float-left first-letter:mr-2">
                  {p}
                </p>
              ))}
            </div>

            {/* Tarjeta de Honor del DT Retirado */}
            <div className="p-6 rounded-2xl border border-amber-500/30 bg-zinc-950/80 flex flex-col items-center justify-between text-center relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-black flex items-center justify-center font-black text-4xl shadow-xl shadow-amber-500/20 mb-3">
                {snapshot.manager_name ? snapshot.manager_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'DT'}
              </div>

              <div>
                <h3 className="text-xl font-black text-white">{snapshot.manager_name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">{snapshot.club_name || 'Club Profesional'}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Crown className="w-3.5 h-3.5" />
                  {snapshot.legacy_rank}
                </div>
              </div>

              <div className="w-full mt-4 pt-4 border-t border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Puntos de Legado</span>
                <span className="text-3xl font-black text-amber-400">{snapshot.legacy_score}</span>
              </div>
            </div>
          </div>

          {/* Métricas Históricas Cuantitativas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 mb-6">
            <div className="text-center p-2">
              <span className="text-xs text-zinc-500 font-bold block">Partidos Totales</span>
              <span className="text-2xl sm:text-3xl font-black text-white">{snapshot.total_matches}</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs text-zinc-500 font-bold block">Victorias</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">{snapshot.total_won}</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs text-zinc-500 font-bold block">Efectividad</span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-400">{snapshot.win_rate}%</span>
            </div>
            <div className="text-center p-2">
              <span className="text-xs text-zinc-500 font-bold block">Títulos Oficiales</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400">{snapshot.titles_count}</span>
            </div>
          </div>

          {/* Vitrina de Trofeos Ganados */}
          {trophiesList.length > 0 && (
            <div className="border-t border-zinc-800 pt-6">
              <h4 className="text-sm font-black text-zinc-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-amber-400" /> Vitrina de Palmarés y Vueltas Olímpicas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {trophiesList.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t.title}</p>
                      <p className="text-[10px] text-zinc-400">{t.year || 'Era Dorada'} • {t.type || 'Oficial'}</p>
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
            className="p-5 rounded-3xl border border-amber-500/30 bg-zinc-900/60 hover:bg-zinc-900 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-white">Ver en el Salón de la Fama</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Consulta tu posición frente a las máximas leyendas</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={handleStartDynasty}
            disabled={startingDynasty}
            className="p-5 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 hover:border-emerald-500 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform font-black">
                {startingDynasty ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-emerald-400">Fundar Nueva Dinastía</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Crea un nuevo DT conservando el mundo y la historia</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
