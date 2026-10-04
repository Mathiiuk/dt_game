import React, { useState, useEffect } from 'react'
import { 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Flame, 
  Award, 
  Shirt, 
  Heart, 
  DollarSign, 
  Users, 
  PlusCircle, 
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react'
import { legendsApi } from '../../../api/legends'
import { toast } from 'sonner'

export default function IdolsLegendsTab({ club, manager, confirmAction, onUpdateClub }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    activeFigures: [],
    historicalLegends: [],
    retiredNumbers: [],
    bonuses: {}
  })
  const [activeSubTab, setActiveSubTab] = useState('active') // 'active' | 'retired'
  const [showRetireModal, setShowRetireModal] = useState(false)
  const [selectedFigure, setSelectedFigure] = useState(null)
  const [customNumber, setCustomNumber] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadFigures = async () => {
    try {
      setLoading(true)
      if (!club?.id) return
      const figuresData = await legendsApi.getClubFigures(club.id)
      setData(figuresData)
    } catch (err) {
      console.error('Error cargando figuras del club:', err)
      toast.error('Error al cargar ídolos y leyendas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFigures()
  }, [club?.id])

  const handleRetireClick = (figure) => {
    setSelectedFigure(figure)
    setCustomNumber(figure?.shirt_number || '10')
    setCustomReason(`Homenaje por sus ${figure?.matches_played || 0} partidos y liderazgo histórico.`)
    setShowRetireModal(true)
  }

  const handleConfirmRetire = async (e) => {
    e.preventDefault()
    if (!selectedFigure) return
    const num = parseInt(customNumber, 10)
    if (!num || num < 1 || num > 99) {
      return toast.error('Ingresa un número de dorsal válido (1 a 99)')
    }

    const confirmed = await confirmAction({
      title: `Retirar Camiseta #${num}`,
      description: `¿Estás seguro de retirar definitivamente el dorsal #${num} en honor a ${selectedFigure.first_name} ${selectedFigure.last_name}? Ningún jugador volverá a usar este número en el club.`,
      confirmText: 'Retirar Camiseta',
      cancelText: 'Cancelar',
      variant: 'default'
    })

    if (!confirmed) return

    try {
      setSubmitting(true)
      await legendsApi.retireShirtNumber(club.id, {
        playerId: selectedFigure.id,
        playerName: `${selectedFigure.first_name} ${selectedFigure.last_name}`,
        shirtNumber: num,
        reason: customReason,
        managerId: manager?.id
      })

      toast.success(`¡Dorsal #${num} retirado con honores sagrados!`)
      setShowRetireModal(false)
      loadFigures()
      if (onUpdateClub) onUpdateClub()
    } catch (err) {
      toast.error(err.message || 'No se pudo retirar la camiseta')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && data.activeFigures.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-amber-400">
        <Crown className="w-6 h-6 animate-bounce mr-3" />
        <span className="text-sm font-semibold">Invocando el espíritu de los ídolos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Banner de Mística & Bonificaciones Culturales */}
      <section className="p-4 md:p-6 border border-amber-500/30 rounded-2xl bg-amber-500/5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-300 flex items-center gap-2">
                <span>Mística e Impacto Social del Club</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Los líderes del vestuario y los ídolos populares generan bonificaciones pasivas permanentes para toda la institución.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 self-start md:self-auto">
            <Star className="w-4 h-4" />
            <span>{data.activeFigures.length} Figuras en Plantel</span>
          </div>
        </div>

        {/* Cuadrícula de Bonificaciones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-amber-500/20">
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Cohesión Social</span>
            </div>
            <p className="text-base font-black text-emerald-400">+{data.bonuses?.cohesionBonus || 0}%</p>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Moral Colectiva</span>
            </div>
            <p className="text-base font-black text-emerald-400">+{data.bonuses?.moraleBonus || 0} pts</p>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Merchandising</span>
            </div>
            <p className="text-base font-black text-emerald-400">+{data.bonuses?.merchandiseBonusPercent || 0}%</p>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Respaldo Afición</span>
            </div>
            <p className="text-base font-black text-emerald-400">+{data.bonuses?.fanConfidenceSupport || 0}%</p>
          </div>
        </div>
      </section>

      {/* Sub-navegación entre Plantel y Camisetas Retiradas */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('active')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === 'active'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Figuras Activas ({data.activeFigures.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('retired')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === 'retired'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" />
          <span>Dorsales Retirados ({data.retiredNumbers.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: FIGURAS ACTIVAS */}
      {activeSubTab === 'active' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.activeFigures.length === 0 ? (
            <div className="col-span-full p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
              <Crown className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h4 className="font-bold text-zinc-300 text-sm md:text-base">El club forja su nuevo legado</h4>
              <p className="text-zinc-500 text-xs mt-1 max-w-md mx-auto">
                Tus jugadores ganan estatus según su trayectoria: Referente (20+ PJ), Ídolo (40+ PJ) y Leyenda (80+ PJ o máximo goleador).
              </p>
            </div>
          ) : (
            data.activeFigures.map(i => (
              <div 
                key={i.id} 
                className="p-4 border rounded-2xl border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border ${
                        i.club_status === 'legend' 
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20' 
                          : i.club_status === 'idol'
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-blue-500 text-white border-blue-400'
                      }`}>
                        {i.first_name?.[0]}{i.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white leading-tight">
                          {i.first_name} {i.last_name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {i.position} • {i.age} años
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${i.badge_color || 'bg-zinc-800 text-zinc-400'}`}>
                      {i.status_label || (i.club_status === 'legend' ? 'Leyenda' : i.club_status === 'idol' ? 'Ídolo' : 'Referente')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 mb-3">
                    <p className="text-[11px] text-zinc-400 italic">
                      "{i.legend_reason || 'Pilar fundamental en la historia y vestuario del club.'}"
                    </p>
                  </div>
                </div>

                <div>
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 mb-3">
                    <div className="flex items-center gap-1 font-semibold text-zinc-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{i.matches_played || 0} PJ</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-zinc-200">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{i.goals_scored || 0} Goles</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      ${Number(i.market_value || 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRetireClick(i)}
                    className="w-full py-2 px-3 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Retirar Camiseta</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUBTAB 2: DORSALES RETIRADOS */}
      {activeSubTab === 'retired' && (
        <section className="p-4 md:p-6 border border-zinc-800 rounded-2xl bg-zinc-900/40">
          <div className="mb-6">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Shirt className="w-5 h-5 text-rose-400" />
              <span>Salón de Honor: Camisetas Sagradas e Inmortales</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Dorsales protegidos que nunca más podrán ser asignados a otro jugador en honor al legado eterno de sus portadores.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.retiredNumbers.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                <Shirt className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-300">Ningún dorsal ha sido retirado aún</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Cuando un ídolo o leyenda cuelgue los botines o marque una época, puedes inmortalizar su número desde la pestaña de Figuras Activas.
                </p>
              </div>
            ) : (
              data.retiredNumbers.map((r) => (
                <div key={r.id} className="p-4 border border-rose-500/30 rounded-2xl bg-zinc-950/80 flex items-center gap-4 relative overflow-hidden">
                  <div className="w-14 h-16 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/40 flex flex-col items-center justify-center shrink-0">
                    <Shirt className="w-4 h-4 text-rose-400 mb-0.5" />
                    <span className="text-xl font-black text-rose-300">#{r.shirt_number}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-white truncate">{r.player_name}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {r.retired_year}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 italic line-clamp-2">
                      "{r.reason}"
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1.5 font-medium">
                      Inmortalizado en el Hall del Club
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Modal / Drawer para retirar camiseta */}
      {showRetireModal && selectedFigure && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Crown className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Retirar Camiseta Oficial</h3>
              </div>
              <button 
                onClick={() => setShowRetireModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-semibold px-2 py-1"
              >
                Cerrar
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm">
                {selectedFigure.first_name?.[0]}{selectedFigure.last_name?.[0]}
              </div>
              <div>
                <p className="font-bold text-sm text-white">
                  {selectedFigure.first_name} {selectedFigure.last_name}
                </p>
                <p className="text-xs text-zinc-400">
                  {selectedFigure.status_label || 'Ídolo'} • {selectedFigure.matches_played || 0} Partidos • {selectedFigure.goals_scored || 0} Goles
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmRetire} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Número de Dorsal a Retirar (1 - 99)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-black text-center text-lg focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Motivo o Inscripción en Placa
                </label>
                <textarea
                  rows="3"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-400 resize-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Consecuencias Institucionales:</span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  • +10 de respaldo y alegría en la afición.
                </p>
                <p className="text-[11px] text-zinc-400">
                  • +2.5 puntos de reputación y prestigio para el DT.
                </p>
                <p className="text-[11px] text-zinc-400">
                  • Placa conmemorativa en la hemeroteca y línea temporal del club.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRetireModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 font-bold text-xs hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-xs hover:from-amber-400 hover:to-amber-500 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Shirt className="w-4 h-4" />
                  <span>{submitting ? 'Inmortalizando...' : 'Retirar Oficialmente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
