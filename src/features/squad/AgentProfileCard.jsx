import React from 'react'
import { Briefcase, HeartHandshake, ShieldCheck, Flame, UserCheck, AlertTriangle } from 'lucide-react'

export default function AgentProfileCard({ agentData }) {
  if (!agentData || !agentData.agent) return null

  const { agent, relationshipScore, effectiveCommissionRate, archetypeDetails } = agentData

  const getAffinityLabel = (score) => {
    if (score >= 80) return { label: 'Socio de confianza', color: 'text-emerald-400', barColor: 'bg-emerald-500' }
    if (score >= 60) return { label: 'Favorable', color: 'text-teal-400', barColor: 'bg-teal-500' }
    if (score >= 40) return { label: 'Neutral / Profesional', color: 'text-zinc-300', barColor: 'bg-zinc-400' }
    if (score >= 25) return { label: 'Tenso', color: 'text-amber-400', barColor: 'bg-amber-500' }
    return { label: 'Hostil / Conflictivo', color: 'text-red-400', barColor: 'bg-red-500' }
  }

  const affinity = getAffinityLabel(relationshipScore)

  const getArchetypeBadge = (personality) => {
    switch (personality) {
      case 'GREEDY':
        return { 
          name: 'Codicioso', 
          style: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Flame className="w-3 h-3 text-amber-400" />
        }
      case 'PROTECTIVE':
        return { 
          name: 'Protector / Familiar', 
          style: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <ShieldCheck className="w-3 h-3 text-blue-400" />
        }
      case 'AGGRESSIVE':
        return { 
          name: 'Hostil / Agresivo', 
          style: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: <AlertTriangle className="w-3 h-3 text-red-400" />
        }
      default:
        return { 
          name: 'Negociador razonable', 
          style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <UserCheck className="w-3 h-3 text-emerald-400" />
        }
    }
  }

  const badge = getArchetypeBadge(agent.personality)

  return (
    <div className="p-3 bg-zinc-950 border border-zinc-800/90 rounded-2xl space-y-2.5">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-tight">{agent.name}</span>
              <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded flex items-center gap-1 border ${badge.style}`}>
                {badge.icon}
                <span>{badge.name}</span>
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Influencia: {agent.influence || 50}/100 • Comisión exigida: {(effectiveCommissionRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Medidor de Afinidad con el DT */}
      <div className="space-y-1 pt-1 border-t border-zinc-900">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-400 flex items-center gap-1">
            <HeartHandshake className="w-3 h-3 text-zinc-500" /> Relación con DT
          </span>
          <span className={`font-bold ${affinity.color}`}>
            {affinity.label} ({relationshipScore}/100)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${affinity.barColor}`} 
            style={{ width: `${relationshipScore}%` }} 
          />
        </div>
      </div>
    </div>
  )
}
