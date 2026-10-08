import React, { useState } from 'react'
import { ArrowLeftRight, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogBody } from '../../components/ui/dialog'
import { ratingAtSlot } from '../../domain/ratings'
import { slotBase } from '../../domain/positions'
import { getLayout } from '../../domain/formations'
import { cn } from '../../lib/utils'

const nameOf = (p) => `${p.first_name || ''} ${p.last_name || ''}`.trim()

/** Trazado vectorial de la cancha de fútbol arcade con césped y líneas */
function MiniPitch({ children }) {
  const line = 'oklch(95% 0.012 100 / 0.25)'
  return (
    <div className="relative aspect-[68/100] w-full max-w-[320px] mx-auto rounded-xl overflow-hidden border border-line shadow-2xl select-none">
      <svg viewBox="0 0 68 100" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="mow-mini" width="68" height="12.5" patternUnits="userSpaceOnUse">
            <rect width="68" height="6.25" fill="#14301d" />
            <rect y="6.25" width="68" height="6.25" fill="#0f2617" />
          </pattern>
        </defs>
        <rect width="68" height="100" fill="url(#mow-mini)" />
        <g fill="none" stroke={line} strokeWidth="0.5">
          <rect x="2" y="2" width="64" height="96" rx="0.5" />
          <line x1="2" y1="50" x2="66" y2="50" />
          <circle cx="34" cy="50" r="8" />
          <rect x="14" y="2" width="40" height="15" />
          <rect x="24" y="2" width="20" height="6" />
          <path d="M 26 17 A 8 8 0 0 0 42 17" />
          <rect x="14" y="83" width="40" height="15" />
          <rect x="24" y="92" width="20" height="6" />
          <path d="M 26 83 A 8 8 0 0 1 42 83" />
        </g>
        <circle cx="34" cy="50" r="0.8" fill={line} />
      </svg>
      {children}
    </div>
  )
}

export default function InteractiveSubstitutionsModal({
  open,
  onClose,
  onField = [],
  bench = [],
  subsLeft = 5,
  onSubstitute,
  preselectOutId = null,
  tactic
}) {
  const [selectedOutId, setSelectedOutId] = useState(preselectOutId)

  // Asignar coordenadas en la cancha según la formación o 4-4-2 por defecto
  const layout = getLayout(tactic?.formation || '4-4-2')
  const outPlayer = onField.find(p => p.id === (selectedOutId || preselectOutId))

  // Ordenar suplentes según rendimiento en el puesto del jugador seleccionado para salir
  let sortedBench = bench
  if (outPlayer) {
    const targetSlot = outPlayer.slot_base || slotBase(outPlayer.position)
    sortedBench = [...bench].sort((a, b) => {
      const aRating = ratingAtSlot(a, targetSlot)
      const bRating = ratingAtSlot(b, targetSlot)
      return bRating - aRating
    })
  }

  const handleSelectOut = (playerId) => {
    setSelectedOutId(playerId === selectedOutId ? null : playerId)
  }

  const handleConfirmSub = (subInPlayer) => {
    if (!outPlayer || !subInPlayer) return
    onSubstitute(outPlayer.id, subInPlayer.id)
    setSelectedOutId(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
      <DialogContent
        placement="center"
        size="lg"
        title="Cambios y Pizarra Táctica en Vivo"
        description={`Disponibles: ${subsLeft} cambio(s) restante(s)`}
      >
        <DialogBody>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-2">
        {/* Columna Izquierda: Cancha Interactiva */}
        <div className="md:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2 px-1 text-xs text-fg-muted font-semibold">
            <span>Tocá un titular para sustituirlo</span>
            {outPlayer && (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Sale: {outPlayer.last_name || outPlayer.first_name}
              </span>
            )}
          </div>

          <MiniPitch>
            {onField.map((player, idx) => {
              const coords = layout[idx] || { x: 50, y: 50 }
              const isSelected = player.id === (selectedOutId || preselectOutId)
              const isInjured = player.is_injured || player.fitness_after_match <= 30

              return (
                <button
                  key={player.id || idx}
                  type="button"
                  onClick={() => handleSelectOut(player.id)}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all z-10 group cursor-pointer focus:outline-hidden',
                    isSelected && 'scale-110 z-20'
                  )}
                  title={`${nameOf(player)} (${player.position || 'JUG'})`}
                >
                  <div
                    className={cn(
                      'size-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 transition-all',
                      isSelected
                        ? 'border-amber-400 bg-amber-500 text-zinc-950 ring-4 ring-amber-400/50 animate-pulse'
                        : isInjured
                        ? 'border-red-500 bg-red-950/80 text-red-200'
                        : 'border-white/80 bg-zinc-900/90 text-white group-hover:border-accent group-hover:scale-105'
                    )}
                  >
                    {player.shirt_number || idx + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[9px] px-1 py-0.2 rounded font-semibold tracking-tight truncate max-w-[65px] mt-0.5 shadow-sm',
                      isSelected
                        ? 'bg-amber-400 text-zinc-950 font-bold'
                        : 'bg-zinc-950/80 text-zinc-200'
                    )}
                  >
                    {player.last_name || player.first_name}
                  </span>
                </button>
              )
            })}
          </MiniPitch>
        </div>

        {/* Columna Derecha: Banco de Suplentes */}
        <div className="md:col-span-6 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted flex items-center gap-1.5">
              <ArrowLeftRight className="size-3.5 text-accent" />
              Banco de Suplentes ({bench.length})
            </h4>
            {outPlayer && (
              <span className="text-[11px] text-accent font-semibold">
                Ordenado por afinidad a {outPlayer.slot_base || outPlayer.position}
              </span>
            )}
          </div>

          {subsLeft === 0 ? (
            <div className="p-4 rounded-xl border border-line bg-surface/50 text-center text-fg-subtle text-sm">
              Ya realizaste todos los cambios permitidos en este partido.
            </div>
          ) : !outPlayer ? (
            <div className="p-6 rounded-xl border border-line/60 bg-surface/30 text-center flex flex-col items-center justify-center h-full min-h-[220px]">
              <ArrowLeftRight className="size-8 text-fg-subtle mb-2 opacity-50" />
              <p className="text-sm font-semibold text-fg">Seleccioná un jugador en la cancha</p>
              <p className="text-xs text-fg-subtle mt-1 max-w-xs">
                Tocá cualquier ficha del campo para ver a los suplentes recomendados para esa posición.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto max-h-[340px] space-y-2 pr-1 custom-scrollbar">
              {sortedBench.length === 0 ? (
                <p className="text-sm text-fg-subtle p-4 text-center">No quedan suplentes disponibles en el banco.</p>
              ) : (
                sortedBench.map(sub => {
                  const targetSlot = outPlayer.slot_base || slotBase(outPlayer.position)
                  const slotScore = Math.round(ratingAtSlot(sub, targetSlot))

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleConfirmSub(sub)}
                      className="w-full p-2.5 rounded-xl border border-line bg-surface hover:bg-surface-2 hover:border-accent text-left transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-7 rounded-lg bg-surface-3 flex items-center justify-center font-bold text-xs text-fg">
                          {sub.shirt_number || '·'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-fg truncate group-hover:text-accent">
                            {nameOf(sub)}
                          </p>
                          <p className="text-[10px] text-fg-subtle">
                            Pos. natural: <span className="font-semibold text-fg-muted">{sub.position}</span> · {sub.age} años
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-accent block">
                            {slotScore} pts
                          </span>
                          <span className="text-[9px] text-fg-subtle block">
                            como {targetSlot}
                          </span>
                        </div>
                        <span className="size-7 rounded-lg bg-accent/15 group-hover:bg-accent text-accent group-hover:text-accent-fg flex items-center justify-center transition-all">
                          <Check className="size-4" />
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
