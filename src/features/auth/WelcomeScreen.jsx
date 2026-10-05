import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth'
import { managerApi } from '../../api/manager'
import { clubApi } from '../../api/club'
import { Shield, Play, Loader2 } from 'lucide-react'

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const [data, setData] = useState({ user: null, manager: null, club: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkState = async () => {
      try {
        const user = await authApi.getSession()
        if (!user) {
          navigate('/auth')
          return
        }

        const manager = await managerApi.getManager(user.id)
        if (!manager) {
          navigate('/create-manager')
          return
        }

        const club = await clubApi.getClubByManager(manager.id)
        if (!club) {
          navigate('/create-club')
          return
        }

        // All career state loaded
        setData({ user, manager, club })
      } catch (error) {
        console.error('Error cargando estado de carrera:', error)
      } finally {
        setLoading(false)
      }
    }

    checkState()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh text-accent bg-bg">
        <Loader2 className="w-12 h-12 mb-4 animate-spin" />
        <p className="font-bold">Cargando estado de la carrera...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh p-4 text-fg bg-bg">
      <div className="w-full max-w-lg p-8 text-center border border-line rounded-xl bg-surface/50">
        <Shield className="w-20 h-20 mx-auto mb-6 text-accent" />
        
        <h1 className="mb-2 text-4xl font-semibold text-fg">¡BIENVENIDO DE VUELTA!</h1>
        <h2 className="mb-8 text-xl font-bold text-accent">DT {data.manager?.first_name} {data.manager?.last_name}</h2>

        <div className="p-6 mb-8 border border-line bg-bg rounded-lg">
          <p className="mb-4 text-sm text-fg-muted">Club Actual</p>
          <p className="text-2xl font-semibold text-fg">{data.club?.name}</p>
          <p className="text-accent font-mono mt-2">{data.club?.game_date || '2026-07-01'}</p>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-full gap-2 py-4 font-bold text-black transition-transform bg-accent rounded-xl hover:bg-accent-strong hover:scale-105"
        >
          <Play className="w-5 h-5" /> Retomar Carrera
        </button>
      </div>
    </div>
  )
}
