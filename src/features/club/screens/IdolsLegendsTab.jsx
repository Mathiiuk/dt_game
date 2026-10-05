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
import { Button, Field, Input, ResponsiveOverlay, Select, Textarea } from '../../../components/ui'
import { friendlyError } from '../../../lib/errors'

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
      toast.error(friendlyError(err, 'No se pudo retirar la camiseta'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && data.activeFigures.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-gold">
        <Crown className="w-6 h-6 animate-bounce mr-3" />
        <span className="text-sm font-semibold">Invocando el espíritu de los ídolos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Banner de Mística & Bonificaciones Culturales */}
      <section className="p-4 md:p-6 border border-gold/30 rounded-lg bg-gold/5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gold flex items-center gap-2">
                <span>Mística e Impacto Social del Club</span>
                <Sparkles className="w-4 h-4 text-gold" />
              </h3>
              <p className="text-xs text-fg-muted mt-0.5">
                Los líderes del vestuario y los ídolos populares generan bonificaciones pasivas permanentes para toda la institución.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-lg border border-gold/20 self-start md:self-auto">
            <Star className="w-4 h-4" />
            <span>{data.activeFigures.length} Figuras en Plantel</span>
          </div>
        </div>

        {/* Cuadrícula de Bonificaciones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gold/20">
          <div className="p-2.5 rounded-xl bg-bg/60 border border-line/80">
            <div className="flex items-center gap-1.5 text-fg-muted text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Cohesión social</span>
            </div>
            <p className="text-base font-semibold text-accent">+{data.bonuses?.cohesionBonus || 0}%</p>
          </div>

          <div className="p-2.5 rounded-xl bg-bg/60 border border-line/80">
            <div className="flex items-center gap-1.5 text-fg-muted text-xs mb-1">
              <Heart className="w-3.5 h-3.5 text-danger" />
              <span>Moral colectiva</span>
            </div>
            <p className="text-base font-semibold text-accent">+{data.bonuses?.moraleBonus || 0} pts</p>
          </div>

          <div className="p-2.5 rounded-xl bg-bg/60 border border-line/80">
            <div className="flex items-center gap-1.5 text-fg-muted text-xs mb-1">
              <DollarSign className="w-3.5 h-3.5 text-gold" />
              <span>Merchandising</span>
            </div>
            <p className="text-base font-semibold text-accent">+{data.bonuses?.merchandiseBonusPercent || 0}%</p>
          </div>

          <div className="p-2.5 rounded-xl bg-bg/60 border border-line/80">
            <div className="flex items-center gap-1.5 text-fg-muted text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Respaldo afición</span>
            </div>
            <p className="text-base font-semibold text-accent">+{data.bonuses?.fanConfidenceSupport || 0}%</p>
          </div>
        </div>
      </section>

      {/* Sub-navegación entre Plantel y Camisetas Retiradas */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveSubTab('active')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === 'active'
              ? 'bg-gold/20 text-gold border border-gold/40'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Figuras Activas ({data.activeFigures.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('retired')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSubTab === 'retired'
              ? 'bg-danger/20 text-danger border border-danger/40'
              : 'text-fg-muted hover:text-fg'
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
            <div className="col-span-full p-8 text-center border border-dashed border-line rounded-lg bg-surface/20">
              <Crown className="w-10 h-10 text-fg-subtle mx-auto mb-3" />
              <h4 className="font-bold text-fg text-sm md:text-base">El club forja su nuevo legado</h4>
              <p className="text-fg-subtle text-xs mt-1 max-w-md mx-auto">
                Tus jugadores ganan estatus según su trayectoria: Referente (20+ PJ), Ídolo (40+ PJ) y Leyenda (80+ PJ o máximo goleador).
              </p>
            </div>
          ) : (
            data.activeFigures.map(i => (
              <div 
                key={i.id} 
                className="p-4 border rounded-lg border-line bg-surface/40 hover:border-line transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-semibold text-sm border ${
                        i.club_status === 'legend' 
                          ? 'bg-gold text-accent-fg border-gold shadow-md shadow-amber-500/20' 
                          : i.club_status === 'idol'
                          ? 'bg-accent text-accent-fg border-accent shadow-md shadow-emerald-500/20'
                          : 'bg-blue-500 text-fg border-blue-400'
                      }`}>
                        {i.first_name?.[0]}{i.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-fg leading-tight">
                          {i.first_name} {i.last_name}
                        </p>
                        <p className="text-[11px] text-fg-muted">
                          {i.position} • {i.age} años
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${i.badge_color || 'bg-surface-3 text-fg-muted'}`}>
                      {i.status_label || (i.club_status === 'legend' ? 'Leyenda' : i.club_status === 'idol' ? 'Ídolo' : 'Referente')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-bg/70 border border-line/80 mb-3">
                    <p className="text-[11px] text-fg-muted italic">
                      "{i.legend_reason || 'Pilar fundamental en la historia y vestuario del club.'}"
                    </p>
                  </div>
                </div>

                <div>
                  <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-fg-muted mb-3">
                    <div className="flex items-center gap-1 font-semibold text-fg">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                      <span>{i.matches_played || 0} PJ</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-fg">
                      <Flame className="w-3.5 h-3.5 text-gold" />
                      <span>{i.goals_scored || 0} Goles</span>
                    </div>
                    <span className="text-[11px] text-fg-subtle">
                      ${Number(i.market_value || 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRetireClick(i)}
                    className="w-full py-2 px-3 rounded-xl border border-line bg-surface-3/80 hover:bg-gold/20 hover:border-gold/40 text-fg hover:text-gold text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Retirar camiseta</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUBTAB 2: DORSALES RETIRADOS */}
      {activeSubTab === 'retired' && (
        <section className="p-4 md:p-6 border border-line rounded-lg bg-surface/40">
          <div className="mb-6">
            <h3 className="font-bold text-base text-fg flex items-center gap-2">
              <Shirt className="w-5 h-5 text-danger" />
              <span>Salón de Honor: Camisetas Sagradas e Inmortales</span>
            </h3>
            <p className="text-xs text-fg-muted mt-1">
              Dorsales protegidos que nunca más podrán ser asignados a otro jugador en honor al legado eterno de sus portadores.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.retiredNumbers.length === 0 ? (
              <div className="col-span-full p-8 text-center border border-dashed border-line rounded-lg">
                <Shirt className="w-10 h-10 text-fg-subtle mx-auto mb-2" />
                <p className="text-sm font-semibold text-fg">Ningún dorsal ha sido retirado aún</p>
                <p className="text-xs text-fg-subtle mt-1">
                  Cuando un ídolo o leyenda cuelgue los botines o marque una época, puedes inmortalizar su número desde la pestaña de Figuras Activas.
                </p>
              </div>
            ) : (
              data.retiredNumbers.map((r) => (
                <div key={r.id} className="p-4 border border-danger/30 rounded-lg bg-bg/80 flex items-center gap-4 relative overflow-hidden">
                  <div className="w-14 h-16 rounded-xl bg-gradient-to-br from-rose-500/20 to-gold/10 border border-danger/40 flex flex-col items-center justify-center shrink-0">
                    <Shirt className="w-4 h-4 text-danger mb-0.5" />
                    <span className="text-xl font-semibold text-danger">#{r.shirt_number}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-fg truncate">{r.player_name}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-danger/20 text-danger border border-danger/30">
                        {r.retired_year}
                      </span>
                    </div>
                    <p className="text-xs text-fg-muted mt-1 italic line-clamp-2">
                      "{r.reason}"
                    </p>
                    <p className="text-[10px] text-fg-subtle mt-1.5 font-medium">
                      Inmortalizado en el hall del Club
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Retiro de camiseta */}
      {showRetireModal && selectedFigure && (
        <ResponsiveOverlay
          title="Retirar camiseta oficial"
          description={`${selectedFigure.first_name} ${selectedFigure.last_name} · ${selectedFigure.status_label || 'Ídolo'} · ${selectedFigure.matches_played || 0} partidos · ${selectedFigure.goals_scored || 0} goles`}
          onClose={() => setShowRetireModal(false)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowRetireModal(false)}>Cancelar</Button>
              <Button type="submit" form="retire-shirt-form" loading={submitting}>{submitting ? 'Inmortalizando...' : 'Retirar oficialmente'}</Button>
            </>
          }
        >
          <form id="retire-shirt-form" onSubmit={handleConfirmRetire} className="space-y-4">
            <Field label="Dorsal a retirar (1 - 99)">
              {(p) => <Input {...p} type="number" min="1" max="99" value={customNumber} onChange={(e) => setCustomNumber(e.target.value)} className="num" required />}
            </Field>
            <Field label="Motivo o inscripción en la placa">
              {(p) => <Textarea {...p} rows={3} value={customReason} onChange={(e) => setCustomReason(e.target.value)} required />}
            </Field>
            <div className="space-y-1 rounded-lg border border-line bg-gold-soft p-3 text-sm text-gold">
              <p className="font-semibold">Consecuencias institucionales</p>
              <ul className="space-y-0.5 text-xs text-fg-muted">
                <li>+10 de respaldo y alegría en la afición.</li>
                <li>+2.5 puntos de reputación y prestigio para el DT.</li>
                <li>Placa conmemorativa en la hemeroteca y línea temporal del club.</li>
              </ul>
            </div>
          </form>
        </ResponsiveOverlay>
      )}
    </div>
  )
}
