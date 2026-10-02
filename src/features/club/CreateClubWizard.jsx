import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { toast } from 'sonner'
import { Loader2, Shield, History, MapPin, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

export default function CreateClubWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [manager, setManager] = useState(null)

  // Step 1: Identity
  const [identity, setIdentity] = useState({
    name: 'Atlético del Sur',
    shortName: 'SUR',
    city: 'Buenos Aires',
    country: 'Argentina',
    foundedYear: new Date().getFullYear(),
    colors: 'Verde y Negro',
    nickname: 'Los Teros'
  })

  // Step 2: History
  const [history, setHistory] = useState('barrio')
  const historyOptions = [
    { id: 'barrio', name: 'Club de barrio', desc: 'Humilde, con fuerte apoyo local pero sin dinero.' },
    { id: 'familiar', name: 'Club familiar', desc: 'Estabilidad moderada, sin grandes sobresaltos.' },
    { id: 'trabajadores', name: 'Club de trabajadores', desc: 'Hinchada fiel y exigente, presupuesto justo.' },
    { id: 'decadencia', name: 'Histórico en decadencia', desc: 'Gran reputación, estadio grande, pero en la ruina económica.' },
    { id: 'ambicioso', name: 'Nuevo ambicioso', desc: 'Mucho dinero, estadio nuevo, sin hinchada ni historia.' }
  ]

  // Step 3: Stadium
  const [stadium, setStadium] = useState({
    name: 'El Fortín del Sur',
    capacity: 2500
  })

  // Pre-fill stadium name based on club name
  useEffect(() => {
    if (step === 3 && identity.name) {
      if (stadium.name === 'El Fortín del Sur') {
        setStadium(prev => ({ ...prev, name: `Estadio ${identity.name}` }))
      }
    }
  }, [step, identity.name])

  useEffect(() => {
    const checkAuthAndManager = async () => {
      const currentUser = await authApi.getSession()
      if (!currentUser) return navigate('/auth')
      
      const currentManager = await managerApi.getManager(currentUser.id)
      if (!currentManager) return navigate('/create-manager')
      
      setManager(currentManager)
      
      const existingClub = await clubApi.getClubByManager(currentManager.id)
      if (existingClub) return navigate('/game')
    }
    checkAuthAndManager()
  }, [navigate])

  const handleCreate = async () => {
    setLoading(true)
    try {
      await clubApi.createClub(manager.id, { identity, history, stadium })
      toast.success('¡Club fundado exitosamente!')
      navigate('/game')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4].map(s => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${step >= s ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
            {s}
          </div>
          {s < 4 && (
            <div className={`w-8 sm:w-16 h-1 mx-2 ${step > s ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col items-center min-h-screen p-4 py-12">
      <div className="w-full max-w-2xl p-8 border border-zinc-800 rounded-3xl bg-zinc-900/50 backdrop-blur-md">
        <h1 className="mb-2 text-3xl font-black text-white">Fundación del Club</h1>
        <p className="mb-8 text-zinc-400">Crea el equipo de tus sueños desde cero.</p>
        
        <StepIndicator />

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <Shield className="w-5 h-5" /> Identidad
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block mb-1 text-sm text-zinc-400">Nombre del Club</label>
                <input type="text" maxLength={30} value={identity.name} onChange={e => setIdentity({...identity, name: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block mb-1 text-sm text-zinc-400">Abreviatura (3 letras)</label>
                <input type="text" maxLength={3} value={identity.shortName} onChange={e => setIdentity({...identity, shortName: e.target.value.toUpperCase()})} className="w-full px-4 py-2 text-white border uppercase rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Ciudad</label>
                <input type="text" value={identity.city} onChange={e => setIdentity({...identity, city: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">País</label>
                <input type="text" value={identity.country} onChange={e => setIdentity({...identity, country: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Colores (Ej. Azul y Oro)</label>
                <input type="text" value={identity.colors} onChange={e => setIdentity({...identity, colors: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Apodo</label>
                <input type="text" value={identity.nickname} onChange={e => setIdentity({...identity, nickname: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: HISTORY */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <History className="w-5 h-5" /> Origen e Historia
            </h2>
            <p className="mb-4 text-sm text-zinc-400">
              Tu origen determinará tu presupuesto, reputación e hinchada inicial.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {historyOptions.map(h => (
                <button
                  key={h.id}
                  onClick={() => setHistory(h.id)}
                  className={`p-4 text-left border rounded-xl transition-all ${history === h.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}
                >
                  <h3 className={`font-bold ${history === h.id ? 'text-emerald-400' : 'text-zinc-200'}`}>{h.name}</h3>
                  <p className="mt-1 text-xs text-zinc-500">{h.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: STADIUM */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <MapPin className="w-5 h-5" /> El Estadio
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Nombre del Estadio</label>
                <input type="text" value={stadium.name} onChange={e => setStadium({...stadium, name: e.target.value})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="block mb-1 text-sm text-zinc-400">Capacidad Inicial</label>
                <input type="number" min="500" max="10000" step="500" value={stadium.capacity} onChange={e => setStadium({...stadium, capacity: parseInt(e.target.value)})} className="w-full px-4 py-2 text-white border rounded-lg bg-zinc-950 border-zinc-700 focus:border-emerald-500 focus:outline-none" />
                <p className="mt-2 text-xs text-zinc-500">La capacidad irá aumentando a medida que asciendas.</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="flex items-center gap-2 mb-4 text-xl font-bold text-emerald-400">
              <CheckCircle className="w-5 h-5" /> Resumen del Club
            </h2>
            
            <div className="p-6 border border-emerald-900/50 bg-emerald-950/20 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-white">{identity.name}</h3>
                <span className="px-2 py-1 text-xs font-bold bg-zinc-900 text-zinc-400 rounded-md">{identity.shortName}</span>
              </div>
              <p className="text-sm text-zinc-400">{identity.city}, {identity.country} • Fundado en {identity.foundedYear}</p>
              <p className="mt-1 text-xs text-emerald-400">"{identity.nickname}"</p>
              
              <div className="my-4 border-t border-zinc-800" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-zinc-500">Colores</span>
                  <span className="font-medium text-zinc-300">{identity.colors}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Origen</span>
                  <span className="font-medium text-zinc-300">{historyOptions.find(h => h.id === history)?.name}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Estadio</span>
                  <span className="font-medium text-zinc-300">{stadium.name}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Aforo</span>
                  <span className="font-medium text-zinc-300">{stadium.capacity} espectadores</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex justify-between mt-10">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-6 py-3 font-bold transition-colors border text-zinc-300 border-zinc-700 rounded-xl hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button 
              onClick={() => {
                if (step === 1 && (!identity.name || !identity.shortName)) {
                  toast.error('Completa los datos principales')
                  return
                }
                setStep(step + 1)
              }}
              className="flex items-center gap-2 px-6 py-3 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 font-bold text-black transition-transform bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:scale-105 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fundar Club'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
