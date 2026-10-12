import React from 'react'
import { Briefcase, HeartHandshake, ShieldCheck, Flame, UserCheck, AlertTriangle } from 'lucide-react'

export default function AgentProfileCard({ agentData }) {
  if (!agentData || !agentData.agent) return null

  const { agent, relationshipScore, effectiveCommissionRate } = agentData

  const getAffinityLabel = (score) => {
    if (score >= 80) return { label: 'Socio de confianza', color: 'text-accent', barColor: 'bg-accent' }
    if (score >= 60) return { label: 'Favorable', color: 'text-teal-400', barColor: 'bg-teal-500' }
    if (score >= 40) return { label: 'Neutral / Profesional', color: 'text-fg-muted', barColor: 'bg-fg-subtle' }
    if (score >= 25) return { label: 'Tenso', color: 'text-gold', barColor: 'bg-gold' }
    return { label: 'Hostil / Conflictivo', color: 'text-danger', barColor: 'bg-danger' }
  }

  const affinity = getAffinityLabel(relationshipScore)

  const getArchetypeBadge = (personality) => {
    switch (personality) {
      case 'GREEDY':
        return { 
          name: 'Codicioso', 
          style: 'bg-gold-soft text-gold border-gold/40',
          icon: <Flame className="w-3 h-3 text-gold" />
        }
      case 'PROTECTIVE':
        return { 
          name: 'Protector / Familiar', 
          style: 'bg-primary-soft text-primary border-primary/40',
          icon: <ShieldCheck className="w-3 h-3 text-primary" />
        }
      case 'AGGRESSIVE':
        return { 
          name: 'Hostil / Agresivo', 
          style: 'bg-danger-soft text-danger border-danger/40',
          icon: <AlertTriangle className="w-3 h-3 text-danger" />
        }
      default:
        return { 
          name: 'Negociador razonable', 
          style: 'bg-accent-soft text-accent border-accent/40',
          icon: <UserCheck className="w-3 h-3 text-accent" />
        }
    }
  }

  const badge = getArchetypeBadge(agent.personality)

  return (
    <div className="p-3 bg-surface-2 border border-line rounded-2xl space-y-2.5">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface-2 border border-line text-fg-muted">
            <Briefcase className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-fg leading-tight">{agent.name}</span>
              <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded flex items-center gap-1 border ${badge.style}`}>
                {badge.icon}
                <span>{badge.name}</span>
              </span>
            </div>
            <p className="text-[10px] text-fg-subtle mt-0.5">
              Influencia: {agent.influence || 50}/100 • Comisión exigida: {(effectiveCommissionRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Medidor de Afinidad con el DT */}
      <div className="space-y-1 pt-1 border-t border-line">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-fg-subtle flex items-center gap-1">
            <HeartHandshake className="w-3 h-3 text-fg-subtle" /> Relación con DT
          </span>
          <span className={`font-bold ${affinity.color}`}>
            {affinity.label} ({relationshipScore}/100)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${affinity.barColor}`} 
            style={{ width: `${relationshipScore}%` }} 
          />
        </div>
      </div>
    </div>
  )
}
