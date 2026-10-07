import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Award, 
  MessageSquare, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Heart, 
  Crown,
  AlertTriangle,
  History,
  CheckCircle2,
  Smile
} from 'lucide-react'
import { lockerRoomApi, HIERARCHY_TIERS, SOCIAL_GROUPS } from '../../../api/lockerRoom'
import { toast } from 'sonner'
import { Button, Field, Input, ResponsiveOverlay, Select, Textarea } from '../../../components/ui'
import { AsyncButton } from '../../../components/ui'
import { absoluteWeek } from '../../../domain/gameWeek'
import { friendlyError } from '../../../lib/errors'

const LOCKER_EVENT_LABELS = {
  CAPTAIN_APPOINTED: 'Cambio de capitán',
  TEAM_MEETING_HELD: 'Reunión de plantel',
  PLAYER_REVOLT_DEFUSED: 'Conflicto resuelto'
}

export default function LockerRoomTab({ club, confirmAction, onUpdateClub }) {
  const [lockerRoom, setLockerRoom] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCaptainsModal, setShowCaptainsModal] = useState(false)
  const [selectedCaptain, setSelectedCaptain] = useState('')
  const [selectedViceCaptain, setSelectedViceCaptain] = useState('')

  const loadLockerData = async ({ silent = false } = {}) => {
    if (!club?.id) return
    try {
      if (!silent) setLoading(true)
      const [lockerRes, profilesRes, eventsRes] = await Promise.all([
        lockerRoomApi.getLockerRoomState(club.id),
        lockerRoomApi.getSquadSocialProfiles(club.id),
        lockerRoomApi.getLockerRoomEvents(club.id)
      ])
      setLockerRoom(lockerRes)
      setProfiles(profilesRes)
      setEvents(eventsRes)
      setSelectedCaptain(lockerRes?.captain_player_id || '')
      setSelectedViceCaptain(lockerRes?.vice_captain_player_id || '')
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar datos del vestuario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLockerData()
  }, [club?.id])

  const handleHoldTeamMeeting = async (tone) => {
    const toneTitles = {
      PRAISE: 'Elogiar Sacrificio y Compromiso',
      CALM: 'Transmitir Calma y Serenidad',
      DEMAND_EXCELLENCE: 'Exigir Máxima Actitud Competitiva'
    }

    const confirmed = await confirmAction({
      title: `Convocar Charla de Equipo: ${toneTitles[tone]}`,
      description: '¿Deseas convocar a todo el plantel al vestuario? Esta acción tiene un tiempo de enfriamiento de 4 semanas de calendario.',
      confirmText: 'Iniciar Charla',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    try {
      setActionLoading(true)
      const res = await lockerRoomApi.holdTeamMeeting(club.id, tone, absoluteWeek(club.game_date || '2026-07-01'))
      toast.success(res.details || 'Reunión de equipo celebrada con éxito')
      await loadLockerData({ silent: true })
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos convocar la reunión. Probá de nuevo.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveCaptains = async () => {
    if (!selectedCaptain) return toast.error('Debes seleccionar un capitán')
    if (selectedCaptain === selectedViceCaptain) return toast.error('El capitán y subcapitán deben ser distintos futbolistas')

    const confirmed = await confirmAction({
      title: 'Confirmar designación de capitanía',
      description: 'Si despojas del brazalete a un líder histórico del vestuario, su moral y la de su clan caerán sensiblemente.',
      confirmText: 'Asignar Brazaletes',
      cancelText: 'Cancelar'
    })

    if (!confirmed) return

    try {
      setActionLoading(true)
      await lockerRoomApi.appointCaptains(club.id, selectedCaptain, selectedViceCaptain)
      toast.success('Brazaletes asignados con éxito')
      setShowCaptainsModal(false)
      if (onUpdateClub) onUpdateClub()
      await loadLockerData()
    } catch (e) {
      toast.error(friendlyError(e, 'Error asignando capitanes'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolveConflict = async (playerId, choiceKey) => {
    try {
      setActionLoading(true)
      const res = await lockerRoomApi.resolvePlayerDemand(playerId, choiceKey, club.id)
      toast.success(res.message || 'Reunión individual concluida')
      await loadLockerData({ silent: true })
    } catch (e) {
      toast.error(friendlyError(e, 'No pudimos concretar la charla. Probá de nuevo.'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-fg-muted">
        <Users className="w-8 h-8 animate-pulse text-accent mb-2" />
        <p className="text-sm font-medium">Accediendo a la intimidad del vestuario...</p>
      </div>
    )
  }

  const cohesionMeta = lockerRoomApi.getCohesionMetadata(lockerRoom?.team_cohesion_score || 65)
  const score = lockerRoom?.team_cohesion_score || 65
  const captain = profiles.find(p => p.player_id === lockerRoom?.captain_player_id)
  const viceCaptain = profiles.find(p => p.player_id === lockerRoom?.vice_captain_player_id)
  const demandingPlayers = profiles.filter(p => p.is_demanding_talk)

  // Agrupamiento por clanes
  const groups = {
    HOMEGROWN_CORE: profiles.filter(p => p.social_group === 'HOMEGROWN_CORE'),
    EXPERIENCED_VETS: profiles.filter(p => p.social_group === 'EXPERIENCED_VETS'),
    FOREIGN_NEWCOMERS: profiles.filter(p => p.social_group === 'FOREIGN_NEWCOMERS'),
    NEUTRAL: profiles.filter(p => p.social_group === 'NEUTRAL')
  }

  return (
    <div className="space-y-6">
      {/* ALERTA DE JUGADORES QUE EXIGEN HABLAR */}
      {demandingPlayers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-lg bg-amber-950/30 border border-amber-800/60 space-y-3">
          <div className="flex items-center gap-2 text-gold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-sm sm:text-base">Reclamo en la oficina del DT</h3>
          </div>
          <p className="text-xs text-fg">
            Los siguientes futbolistas están incómodos con su rol en el equipo y exigen una respuesta inmediata:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {demandingPlayers.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-bg border border-line flex flex-col justify-between text-xs gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-fg block">{p.name} ({p.position}, OVR {p.overall})</span>
                    <span className="text-[11px] text-fg-muted">Moral: {p.morale} • Satisfacción con minutos: {p.satisfaction_playing_time}%</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-danger border border-rose-800">
                    Disconforme
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <AsyncButton
                    disabled={actionLoading}
                    onClick={() => handleResolveConflict(p.player_id, 'PROMISE_MINUTES')}
                    className="px-2.5 py-1 bg-accent/20 hover:bg-accent/30 text-accent font-semibold rounded text-[11px] transition-colors"
                  >
                    Prometer Minutos (+12 moral)
                  </AsyncButton>
                  <AsyncButton
                    disabled={actionLoading}
                    onClick={() => handleResolveConflict(p.player_id, 'HONEST_CRITIQUE')}
                    className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold rounded text-[11px] transition-colors"
                  >
                    Diálogo Franco (+2 moral)
                  </AsyncButton>
                  <AsyncButton
                    disabled={actionLoading}
                    onClick={() => handleResolveConflict(p.player_id, 'DISCIPLINE')}
                    className="px-2.5 py-1 bg-danger/20 hover:bg-danger/30 text-danger font-semibold rounded text-[11px] transition-colors"
                  >
                    Reprender (-15 moral)
                  </AsyncButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TARJETA RESUMEN DEL VESTUARIO Y COHESIÓN */}
      <div className="p-4 sm:p-6 rounded-lg bg-surface/60 border border-line">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-line/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-fg">Química y dinámica de vestuario</h2>
                <p className="text-xs text-fg-muted">Jerarquías, liderazgos y cohesión del grupo humano</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-fg-muted font-medium">Cohesión de equipo</span>
              <p className="text-2xl font-semibold text-fg font-mono flex items-center justify-end gap-1.5">
                <Heart className={`w-5 h-5 ${score >= 70 ? 'text-purple-400 fill-purple-400' : 'text-fg-subtle'}`} />
                {score}<span className="text-xs font-normal text-fg-muted">/100</span>
              </p>
            </div>
            <div className="border-l border-line pl-4 text-left">
              <span className="text-[11px] text-fg-muted font-medium">Ambiente interno</span>
              <div className="mt-0.5">
                <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${cohesionMeta.badgeColor}`}>
                  {cohesionMeta.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EFECTO TÁCTICO & CAPITANÍA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
          {/* Bonificación Táctica */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-4 h-4 text-accent" />
                Efecto en el Motor de Partido (2D)
              </span>
              <p className="text-sm font-bold text-fg mb-1">
                {cohesionMeta.tacticalBonus}
              </p>
            </div>
            <p className="text-xs text-fg-muted mt-2">
              Un vestuario unido reduce errores forzados en balones parados y maximiza la efectividad de pases.
            </p>
          </div>

          {/* Capitanes Designados */}
          <div className="p-4 rounded-xl bg-bg/80 border border-line/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-gold" />
                Capitanía oficial
              </span>
              <button
                onClick={() => setShowCaptainsModal(true)}
                className="text-[11px] text-gold hover:underline font-semibold"
              >
                Cambiar brazaletes
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-fg-subtle uppercase font-mono font-bold block">Capitán</span>
                <span className="font-bold text-fg truncate block">{captain?.name || 'Sin designar'}</span>
              </div>
              <div className="p-2 rounded-lg bg-surface border border-line">
                <span className="text-[10px] text-fg-subtle uppercase font-mono font-bold block">Subcapitán</span>
                <span className="font-bold text-fg truncate block">{viceCaptain?.name || 'Sin designar'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHARLAS Y REUNIONES DE EQUIPO */}
      <div className="p-4 sm:p-5 rounded-lg bg-surface/60 border border-line space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-fg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              Charlas técnicas y reunión de equipo
            </h3>
            <p className="text-xs text-fg-muted">Dirige la palabra al plantel completo para ajustar el enfoque psicológico.</p>
          </div>
          <span className="text-xs text-fg-subtle font-mono">
            Cooldown: 4 semanas de calendario
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <AsyncButton
            disabled={actionLoading}
            onClick={() => handleHoldTeamMeeting('PRAISE')}
            className="p-3 text-left rounded-xl border border-line bg-bg/70 hover:border-accent/60 hover:bg-emerald-950/10 transition-all text-xs group"
          >
            <span className="font-bold text-accent block mb-1">Elogiar sacrificio</span>
            <p className="text-fg-muted group-hover:text-fg leading-snug">
              Felicita al grupo por el compromiso y refuerza la unión colectiva (+8 moral, +5 cohesión).
            </p>
          </AsyncButton>

          <AsyncButton
            disabled={actionLoading}
            onClick={() => handleHoldTeamMeeting('CALM')}
            className="p-3 text-left rounded-xl border border-line bg-bg/70 hover:border-blue-500/60 hover:bg-blue-950/10 transition-all text-xs group"
          >
            <span className="font-bold text-blue-400 block mb-1">Llamado a la calma</span>
            <p className="text-fg-muted group-hover:text-fg leading-snug">
              Descomprime presiones y pide templanza ante los próximos partidos (+5 moral, +3 cohesión).
            </p>
          </AsyncButton>

          <AsyncButton
            disabled={actionLoading}
            onClick={() => handleHoldTeamMeeting('DEMAND_EXCELLENCE')}
            className="p-3 text-left rounded-xl border border-line bg-bg/70 hover:border-gold/60 hover:bg-amber-950/10 transition-all text-xs group"
          >
            <span className="font-bold text-gold block mb-1">Exigir excelencia</span>
            <p className="text-fg-muted group-hover:text-fg leading-snug">
              Eleva la vara y reta al plantel a dar un salto de jerarquía competitiva.
            </p>
          </AsyncButton>
        </div>
      </div>

      {/* CLANES Y GRUPOS SOCIALES DEL VESTUARIO */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-fg flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Clanes y grupos sociales del plantel
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(SOCIAL_GROUPS).map(([key, def]) => {
            const members = groups[key] || []
            if (members.length === 0) return null

            return (
              <div key={key} className="p-4 rounded-xl bg-surface/50 border border-line/80 space-y-3">
                <div className="flex items-center justify-between border-b border-line/60 pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-fg">{def.label}</h4>
                    <p className="text-[11px] text-fg-muted">{def.description}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-fg-muted bg-surface-3 px-2 py-0.5 rounded">
                    {members.length} {members.length === 1 ? 'jugador' : 'jugadores'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {members.map(p => {
                    const tierMeta = HIERARCHY_TIERS[p.hierarchy_tier] || HIERARCHY_TIERS.INFLUENTIAL
                    const isCap = p.player_id === lockerRoom?.captain_player_id
                    const isVice = p.player_id === lockerRoom?.vice_captain_player_id

                    return (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-bg/70 border border-line/80 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {isCap && <Crown className="w-3.5 h-3.5 text-gold shrink-0" />}
                          {isVice && <Crown className="w-3.5 h-3.5 text-fg-muted shrink-0" />}
                          <span className="font-bold text-fg truncate">{p.name}</span>
                          <span className="text-[11px] text-fg-subtle font-mono">({p.position}, {p.age}a)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tierMeta.color}`}>
                            {tierMeta.label}
                          </span>
                          <span className="text-[11px] text-fg-muted font-mono">
                            {p.morale}% moral
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* HISTORIAL DE EVENTOS SOCIALES */}
      {events.length > 0 && (
        <div className="p-4 sm:p-5 rounded-lg bg-surface/40 border border-line">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-accent" />
            Libro de actas y acontecimientos de vestuario
          </h3>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="p-3 rounded-xl bg-bg/70 border border-line/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] text-fg-subtle">
                  <span className="font-bold text-fg">{LOCKER_EVENT_LABELS[ev.event_type] || 'Acontecimiento'}</span>
                  <span>{new Date(ev.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-fg-muted">{ev.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Designación de capitanía */}
      {showCaptainsModal && (
        <ResponsiveOverlay
          title="Designar capitán y subcapitán"
          description="Quitarle el brazalete a un líder indiscutido causará fracturas anímicas."
          onClose={() => setShowCaptainsModal(false)}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowCaptainsModal(false)}>Cancelar</Button>
              <Button loading={actionLoading} onClick={handleSaveCaptains}>Confirmar</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Capitán principal">
              {(p) => (
                <Select {...p} value={selectedCaptain} onChange={(e) => setSelectedCaptain(e.target.value)}>
                  <option value="">Seleccionar capitán...</option>
                  {profiles.map(pl => (
                    <option key={pl.player_id} value={pl.player_id}>
                      {pl.name} ({pl.position}, OVR {pl.overall}, {pl.age}a) - {pl.hierarchy_tier}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Subcapitán">
              {(p) => (
                <Select {...p} value={selectedViceCaptain} onChange={(e) => setSelectedViceCaptain(e.target.value)}>
                  <option value="">Seleccionar subcapitán...</option>
                  {profiles.map(pl => (
                    <option key={pl.player_id} value={pl.player_id}>
                      {pl.name} ({pl.position}, OVR {pl.overall}, {pl.age}a)
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </ResponsiveOverlay>
      )}
    </div>
  )
}
