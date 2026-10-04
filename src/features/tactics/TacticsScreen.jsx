import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  LayoutGrid, 
  Users, 
  Shield, 
  Sparkles, 
  Zap, 
  Sliders, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'
import { toast } from 'sonner'
import { useGameContext } from '../../context/GameContext'
import { 
  tacticsApi, 
  FORMATIONS, 
  calculatePositionalAffinity,
  TACTICAL_MENTALITIES,
  PASSING_STYLES,
  PRESSING_LEVELS,
  TEMPO_LEVELS
} from '../../api/tactics'
import { playerApi } from '../../api/player'

export default function TacticsScreen() {
  const navigate = useNavigate()
  const { club, loading: contextLoading } = useGameContext()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [squad, setSquad] = useState([])
  const [formation, setFormation] = useState('4-4-2')
  const [mentality, setMentality] = useState('BALANCED')
  const [passingStyle, setPassingStyle] = useState('MIXED')
  const [pressing, setPressing] = useState('BALANCED')
  const [tempo, setTempo] = useState('NORMAL')
  const [lineup, setLineup] = useState({}) // { [slot]: playerId }
  const [tacticId, setTacticId] = useState(null)

  useEffect(() => {
    if (contextLoading || !club?.id) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [tactic, players] = await Promise.all([
          tacticsApi.getTactic(club.id),
          playerApi.getSquad(club.id)
        ])

        setSquad(players || [])

        if (tactic) {
          setTacticId(tactic.id)
          setFormation(tactic.formation || '4-4-2')
          setMentality(tactic.mentality || 'BALANCED')
          setPassingStyle(tactic.passing_style || 'MIXED')
          setPressing(tactic.pressing_intensity || 'BALANCED')
          setTempo(tactic.tempo || 'NORMAL')

          // Si ya hay un array de lineup o mapa guardado
          if (Array.isArray(tactic.lineup) && tactic.lineup.length > 0) {
            const formConfig = FORMATIONS[tactic.formation || '4-4-2'] || FORMATIONS['4-4-2']
            const initialMap = {}
            formConfig.slots.forEach((slot, idx) => {
              if (tactic.lineup[idx]) {
                initialMap[slot] = tactic.lineup[idx]
              }
            })
            setLineup(initialMap)
          } else {
            // Auto-armar 11 inicial por defecto
            autoAssignLineup(tactic.formation || '4-4-2', players || [])
          }
        }
      } catch (e) {
        console.error('Error cargando táctica:', e)
        toast.error('Error al cargar la pizarra táctica.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [contextLoading, club?.id])

  const autoAssignLineup = (formKey, playersList) => {
    const formConfig = FORMATIONS[formKey] || FORMATIONS['4-4-2']
    const newMap = {}
    const usedIds = new Set()

    // 1. Asignar arquero (priorizar jugadores sanos)
    const gk = playersList.find(p => p.position === 'GK' && !p.is_injured) || playersList.find(p => p.position === 'GK')
    if (gk) {
      newMap['GK'] = gk.id
      usedIds.add(gk.id)
    }

    // 2. Asignar los demás puestos (priorizar sanos)
    formConfig.slots.forEach(slot => {
      if (slot === 'GK') return
      // Buscar mejor coincidencia no usada ni lesionada
      const candidate = playersList.find(p => !usedIds.has(p.id) && !p.is_injured) || playersList.find(p => !usedIds.has(p.id))
      if (candidate) {
        newMap[slot] = candidate.id
        usedIds.add(candidate.id)
      }
    })

    setLineup(newMap)
  }

  const handleFormationChange = (newForm) => {
    setFormation(newForm)
    autoAssignLineup(newForm, squad)
  }

  const handlePlayerSlotChange = (slot, newPlayerId) => {
    setLineup(prev => ({
      ...prev,
      [slot]: newPlayerId
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const formConfig = FORMATIONS[formation] || FORMATIONS['4-4-2']
      const lineupArray = formConfig.slots.map(s => lineup[s]).filter(Boolean)

      // Regla 27.1: No alinear futbolistas lesionados sin autorización médica
      const injuredStarter = lineupArray.map(id => playerMap.get(id)).find(p => p?.is_injured)
      if (injuredStarter) {
        toast.error(`Regla 27.1: ${injuredStarter.first_name} ${injuredStarter.last_name} está en la enfermería (${injuredStarter.injury_type || 'Baja médica'}). No puede jugar de titular sin infiltración médica autorizada.`)
        setSaving(false)
        return
      }

      const lineupDetails = formConfig.slots.map((s, idx) => ({
        player_id: lineup[s],
        pitch_position: s,
        is_starter: true,
        order_index: idx
      })).filter(item => item.player_id)

      const payload = {
        id: tacticId,
        club_id: club.id,
        formation,
        mentality,
        passing_style: passingStyle,
        pressing_intensity: pressing,
        tempo,
        lineup: lineupArray,
        lineupDetails
      }

      const saved = await tacticsApi.updateTactic(club.id, payload)
      if (saved?.id) setTacticId(saved.id)

      toast.success('Pizarra táctica y alineación guardadas exitosamente.')
    } catch (e) {
      toast.error(e.message || 'Error al guardar la táctica.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-zinc-400 font-medium text-sm">Cargando pizarra técnica...</p>
      </div>
    )
  }

  const currentFormConfig = FORMATIONS[formation] || FORMATIONS['4-4-2']
  const playerMap = new Map(squad.map(p => [p.id, p]))

  return (
    <div className="min-h-screen p-4 md:p-8 text-zinc-100 bg-zinc-950 pb-24 lg:pb-8">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-2 transition-colors border rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-emerald-400" />
              Pizarra Táctica y Esquema
            </h1>
            <p className="text-xs text-zinc-400">Diseño estratégico, roles y compatibilidad posicional</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 font-bold text-zinc-950 transition-all bg-emerald-500 rounded-xl hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-xs shadow-lg shadow-emerald-950/50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Cambios
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Configuración e Instrucciones */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Instrucciones de Equipo
            </h2>

            {/* Formación Selector */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-zinc-400">Esquema Táctico</label>
              <select 
                value={formation} 
                onChange={e => handleFormationChange(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                {Object.keys(FORMATIONS).map(key => (
                  <option key={key} value={key}>{FORMATIONS[key].name}</option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500 mt-1">{currentFormConfig.description}</p>
            </div>

            {/* Mentalidad */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-zinc-400">Mentalidad</label>
              <select 
                value={mentality} 
                onChange={e => setMentality(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                {TACTICAL_MENTALITIES.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Estilo de Pase */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-zinc-400">Estilo de Pase</label>
              <select 
                value={passingStyle} 
                onChange={e => setPassingStyle(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                {PASSING_STYLES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Presión */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-zinc-400">Intensidad de Presión</label>
              <select 
                value={pressing} 
                onChange={e => setPressing(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                {PRESSING_LEVELS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Ritmo */}
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-zinc-400">Ritmo de Juego</label>
              <select 
                value={tempo} 
                onChange={e => setTempo(e.target.value)}
                className="w-full p-2.5 text-xs border rounded-xl bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                {TEMPO_LEVELS.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Panel Central / Derecho: 11 Titulares y Afinidad */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Once Inicial ({formation})
                </h2>
                <p className="text-[11px] text-zinc-400">Asigna a los 11 titulares verificando la química de posición</p>
              </div>

              <button
                type="button"
                onClick={() => autoAssignLineup(formation, squad)}
                className="px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors"
              >
                Auto-alinear
              </button>
            </div>

            {/* Slots List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentFormConfig.slots.map(slot => {
                const assignedPlayerId = lineup[slot]
                const assignedPlayer = playerMap.get(assignedPlayerId)
                const affinity = assignedPlayer ? calculatePositionalAffinity(assignedPlayer.position, slot) : null

                const colorClass = affinity?.code === 'NATURAL'
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : affinity?.code === 'COMPATIBLE'
                  ? 'border-amber-500/40 bg-amber-950/20'
                  : affinity?.code === 'ADAPTED'
                  ? 'border-orange-500/40 bg-orange-950/20'
                  : 'border-red-500/40 bg-red-950/20'

                return (
                  <div 
                    key={slot}
                    className={`p-3 rounded-xl border transition-all ${assignedPlayer ? colorClass : 'border-zinc-800 bg-zinc-950/40'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-6 rounded bg-zinc-800 text-[11px] font-black text-white flex items-center justify-center">
                          {slot}
                        </span>
                        {affinity && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            affinity.code === 'NATURAL' ? 'text-emerald-400 bg-emerald-500/10' :
                            affinity.code === 'COMPATIBLE' ? 'text-amber-400 bg-amber-500/10' :
                            affinity.code === 'ADAPTED' ? 'text-orange-400 bg-orange-500/10' :
                            'text-red-400 bg-red-500/10'
                          }`}>
                            {affinity.label} ({(affinity.rating * 100).toFixed(0)}%)
                          </span>
                        )}
                      </div>

                      {assignedPlayer && (
                        <div className="flex items-center gap-1.5">
                          {assignedPlayer.is_injured && (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded">
                              Enfermería
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-400">
                            {assignedPlayer.state_fitness || 75}% fit
                          </span>
                        </div>
                      )}
                    </div>

                    <select
                      value={assignedPlayerId || ''}
                      onChange={e => handlePlayerSlotChange(slot, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Seleccionar futbolista...</option>
                      {squad.map(p => (
                        <option key={p.id} value={p.id} disabled={p.is_injured}>
                          #{p.shirt_number} {p.first_name} {p.last_name} ({p.position} - Media: {p.attr_overall || 50}) {p.is_injured ? '⚠️ (ENFERMERÍA)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
