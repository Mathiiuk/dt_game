import React from 'react'
import { portraitOf } from '../../domain/playerPortrait'

/** Retrato ilustrado del jugador (decorativo): cara, peinado y camiseta con los colores del club */
export function PlayerPortrait({ player, primary = '#047857', secondary = '#FFFFFF', className = 'size-10' }) {
  const { skin, hair, style, beard } = portraitOf(player)
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="8" fill="var(--color-surface-3, #e8e0cb)" />
      <path d="M8,64 C8,50 20,46 32,46 C44,46 56,50 56,64 Z" fill={primary} />
      <path d="M26,46 C28,52 36,52 38,46" fill="none" stroke={secondary} strokeWidth="3" />
      <rect x="27" y="38" width="10" height="10" fill={skin} />
      {style === 'largo' && <path d="M17,30 C15,14 49,14 47,30 L48,46 L40,46 L40,28 L24,28 L24,46 L16,46 Z" fill={hair} />}
      <ellipse cx="32" cy="28" rx="13" ry="15" fill={skin} />
      {beard && <path d="M20,30 C20,44 44,44 44,30 C40,38 24,38 20,30 Z" fill={hair} opacity="0.85" />}
      {style === 'corto' && <path d="M19,26 C18,10 46,10 45,26 C42,19 22,19 19,26 Z" fill={hair} />}
      {style === 'rulos' && <g fill={hair}><circle cx="22" cy="17" r="6" /><circle cx="32" cy="14" r="7" /><circle cx="42" cy="17" r="6" /><circle cx="19" cy="24" r="4" /><circle cx="45" cy="24" r="4" /></g>}
      {style === 'largo' && <path d="M19,26 C18,11 46,11 45,26 C41,20 23,20 19,26 Z" fill={hair} />}
      {style === 'rapado' && <path d="M19,25 C19,13 45,13 45,25 C41,19 23,19 19,25 Z" fill={hair} opacity="0.35" />}
      {style === 'jopo' && <path d="M20,26 C17,6 47,6 44,26 C42,17 22,17 20,26 Z" fill={hair} />}
      <circle cx="27" cy="29" r="1.6" fill="#1c1410" />
      <circle cx="37" cy="29" r="1.6" fill="#1c1410" />
      <path d="M28,36 C30,38 34,38 36,36" fill="none" stroke="#1c1410" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
