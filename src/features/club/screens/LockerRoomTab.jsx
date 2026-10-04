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

export default function LockerRoomTab({ club, confirmAction, onUpdateClub }) {
  const [lockerRoom, setLockerRoom] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCaptainsModal, setShowCaptainsModal] = useState(false)
  const [selectedCaptain, setSelectedCaptain] = useState('')
  const [selectedViceCaptain, setSelectedViceCaptain] = useState('')

  const loadLockerData = async () => {
    if (!club?.id) return
    try {
      setLoading(true)
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
      const res = await lockerRoomApi.holdTeamMeeting(club.id, tone, 1)
      toast.success(res.details || 'Reunión de equipo celebrada con éxito')
      if (onUpdateClub) onUpdateClub()
      await loadLockerData()
    } catch (e) {
      toast.error(e.message || 'Error al convocar la reunión')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveCaptains = async () => {
    if (!selectedCaptain) return toast.error('Debes seleccionar un capitán')
    if (selectedCaptain === selectedViceCaptain) return toast.error('El capitán y subcapitán deben ser distintos futbolistas')

    const confirmed = await confirmAction({
      title: 'Confirmar Designación de Capitanía',
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
      toast.error(e.message || 'Error asignando capitanes')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolveConflict = async (playerId, choiceKey) => {
    try {
      setActionLoading(true)
      const res = await lockerRoomApi.resolvePlayerDemand(playerId, choiceKey, club.id)
      toast.success(res.message || 'Reunión individual concluida')
      if (onUpdateClub) onUpdateClub()
      await loadLockerData()
    } catch (e) {
      toast.error(e.message || 'Error en la conversación')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
        <Users className="w-8 h-8 animate-pulse text-emerald-400 mb-2" />
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
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-sm sm:text-base">Reclamo en la Oficina del DT</h3>
          </div>
          <p className="text-xs text-zinc-300">
            Los siguientes futbolistas están incómodos con su rol en el equipo y exigen una respuesta inmediata:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {demandingPlayers.map(p => (
              <div key={p.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-xs gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white block">{p.name} ({p.position}, OVR {p.overall})</span>
                    <span className="text-[11px] text-zinc-400">Moral: {p.morale} • Satisfacción con minutos: {p.satisfaction_playing_time}%</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    Disconforme
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleResolveConflict(p.player_id, 'PROMISE_MINUTES')}
                    className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold rounded text-[11px] transition-colors"
                  >
                    Prometer Minutos (+12 moral)
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleResolveConflict(p.player_id, 'HONEST_CRITIQUE')}
                    className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold rounded text-[11px] transition-colors"
                  >
                    Diálogo Franco (+2 moral)
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleResolveConflict(p.player_id, 'DISCIPLINE')}
                    className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-semibold rounded text-[11px] transition-colors"
                  >
                    Reprender (-15 moral)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TARJETA RESUMEN DEL VESTUARIO Y COHESIÓN */}
      <div className="p-4 sm:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">Química y Dinámica de Vestuario</h2>
                <p className="text-xs text-zinc-400">Jerarquías, liderazgos y cohesión del grupo humano</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 font-medium">Cohesión de Equipo</span>
              <p className="text-2xl font-black text-white font-mono flex items-center justify-end gap-1.5">
                <Heart className={`w-5 h-5 ${score >= 70 ? 'text-purple-400 fill-purple-400' : 'text-zinc-500'}`} />
                {score}<span className="text-xs font-normal text-zinc-400">/100</span>
              </p>
            </div>
            <div className="border-l border-zinc-800 pl-4 text-left">
              <span className="text-[11px] text-zinc-400 font-medium">Ambiente Interno</span>
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
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Efecto en el Motor de Partido (2D)
              </span>
              <p className="text-sm font-bold text-white mb-1">
                {cohesionMeta.tacticalBonus}
              </p>
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Un vestuario unido reduce errores forzados en balones parados y maximiza la efectividad de pases.
            </p>
          </div>

          {/* Capitanes Designados */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                Capitanía Oficial
              </span>
              <button
                onClick={() => setShowCaptainsModal(true)}
                className="text-[11px] text-amber-400 hover:underline font-semibold"
              >
                Cambiar Brazaletes
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">Capitán</span>
                <span className="font-bold text-white truncate block">{captain?.name || 'Sin designar'}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">Subcapitán</span>
                <span className="font-bold text-white truncate block">{viceCaptain?.name || 'Sin designar'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHARLAS Y REUNIONES DE EQUIPO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Charlas Técnicas & Reunión de Equipo
            </h3>
            <p className="text-xs text-zinc-400">Dirige la palabra al plantel completo para ajustar el enfoque psicológico.</p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            Cooldown: 4 semanas de calendario
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            disabled={actionLoading}
            onClick={() => handleHoldTeamMeeting('PRAISE')}
            className="p-3 text-left rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-emerald-500/60 hover:bg-emerald-950/10 transition-all text-xs group"
          >
            <span className="font-bold text-emerald-400 block mb-1">Elogiar Sacrificio</span>
            <p className="text-zinc-400 group-hover:text-zinc-200 leading-snug">
              Felicita al grupo por el compromiso y refuerza la unión colectiva (+8 moral, +5 cohesión).
            </p>
          </button>

          <button
            disabled={actionLoading}
            onClick={() => handleHoldTeamMeeting('CALM')}
            className="p-3 text-left rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-blue-500/60 hover:bg-blue-950/10 transition-all text-xs group"
          >
            <span className="font-bold text-blue-400 block mb-1">Llamado a la Calma</span>
            <p className="text-zinc-400 group-hover:text-zinc-200 leading-snug">
              Descomprime presiones y pide templanza ante los próximos partidos (+5 moral, +3 cohesión).
            </p>
          </button>

          <button
            disabled={actionLoading}
            onClick={() => handleHoldTeamMeeting('DEMAND_EXCELLENCE')}
            className="p-3 text-left rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-amber-500/60 hover:bg-amber-950/10 transition-all text-xs group"
          >
            <span className="font-bold text-amber-400 block mb-1">Exigir Excelencia</span>
            <p className="text-zinc-400 group-hover:text-zinc-200 leading-snug">
              Eleva la vara y reta al plantel a dar un salto de jerarquía competitiva.
            </p>
          </button>
        </div>
      </div>

      {/* CLANES Y GRUPOS SOCIALES DEL VESTUARIO */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Clanes y Grupos Sociales del Plantel
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(SOCIAL_GROUPS).map(([key, def]) => {
            const members = groups[key] || []
            if (members.length === 0) return null

            return (
              <div key={key} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-white">{def.label}</h4>
                    <p className="text-[11px] text-zinc-400">{def.description}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                    {members.length} {members.length === 1 ? 'jugador' : 'jugadores'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {members.map(p => {
                    const tierMeta = HIERARCHY_TIERS[p.hierarchy_tier] || HIERARCHY_TIERS.INFLUENTIAL
                    const isCap = p.player_id === lockerRoom?.captain_player_id
                    const isVice = p.player_id === lockerRoom?.vice_captain_player_id

                    return (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {isCap && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          {isVice && <Crown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                          <span className="font-bold text-white truncate">{p.name}</span>
                          <span className="text-[11px] text-zinc-500 font-mono">({p.position}, {p.age}a)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tierMeta.color}`}>
                            {tierMeta.label}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-mono">
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
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-emerald-400" />
            Libro de Actas y Acontecimientos de Vestuario
          </h3>
          <div className="space-y-2">
            {events.map((ev) => (
              <div key={ev.id} className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-bold text-zinc-300">{ev.event_type}</span>
                  <span>{new Date(ev.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-zinc-400">{ev.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN DE CAPITANÍA */}
      {showCaptainsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Designar Capitán y Subcapitán
            </h3>
            <p className="text-xs text-zinc-400">
              Elige a los referentes del plantel. Quitarle el brazalete a un líder indiscutido causará fracturas anímicas.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Capitán Principal</label>
                <select
                  value={selectedCaptain}
                  onChange={(e) => setSelectedCaptain(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                >
                  <option value="">Seleccionar Capitán...</option>
                  {profiles.map(p => (
                    <option key={p.player_id} value={p.player_id}>
                      {p.name} ({p.position}, OVR {p.overall}, {p.age}a) - {p.hierarchy_tier}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Subcapitán</label>
                <select
                  value={selectedViceCaptain}
                  onChange={(e) => setSelectedViceCaptain(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                >
                  <option value="">Seleccionar Subcapitán...</option>
                  {profiles.map(p => (
                    <option key={p.player_id} value={p.player_id}>
                      {p.name} ({p.position}, OVR {p.overall}, {p.age}a)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setShowCaptainsModal(false)}
                className="flex-1 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={actionLoading}
                onClick={handleSaveCaptains}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
