import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, Building2, Trophy, Settings } from 'lucide-react'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const showNav = ['/dashboard', '/squad', '/club', '/market', '/standings'].includes(location.pathname)

  if (!showNav) return null

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/dashboard' },
    { icon: Users, label: 'Plantel', path: '/squad' },
    { icon: Building2, label: 'Club', path: '/club' },
    { icon: Settings, label: 'Mercado', path: '/market' },
    { icon: Trophy, label: 'Comp.', path: '/standings' }
  ]

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t lg:hidden bg-zinc-950 border-zinc-900 pb-safe">
      <div className="flex items-center justify-between px-2 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${
                isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-emerald-500/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
