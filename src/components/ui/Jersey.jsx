import React, { useId } from 'react'
import { normalizeJerseyPattern } from '../../domain/jerseyKits'

const BODY = 'M25,25 L10,40 L22,50 L28,42 L28,90 L72,90 L72,42 L78,50 L90,40 L75,25 L65,25 C63,33 37,33 35,25 Z'

/** Camiseta titular del club con el diseño elegido; el estampado se recorta a la silueta */
export function Jersey({ primary = '#047857', secondary = '#FFFFFF', pattern, className, label = 'Vista previa de la camiseta titular' }) {
  const clipId = `jersey-${useId().replace(/:/g, '')}`
  const kind = normalizeJerseyPattern(pattern)
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={label}>
      <defs><clipPath id={clipId}><path d={BODY} /></clipPath></defs>
      <path d={BODY} fill={primary} />
      <g clipPath={`url(#${clipId})`} fill={secondary}>
        {kind === 'CENTER_STRIPE' && <rect x="42" y="20" width="16" height="72" opacity="0.9" />}
        {kind === 'STRIPES_VERTICAL' && [30, 46, 62].map(x => <rect key={x} x={x} y="20" width="8" height="72" />)}
        {kind === 'STRIPES_HORIZONTAL' && [34, 52, 70].map(y => <rect key={y} x="5" y={y} width="90" height="8" />)}
        {kind === 'SASH' && <polygon points="28,30 44,30 72,86 56,86" />}
        {kind === 'HALVES' && <rect x="50" y="20" width="45" height="72" />}
      </g>
      <path d={BODY} fill="none" stroke="#27272a" strokeWidth="2" />
      <path d="M35,25 C37,33 63,33 65,25" fill="none" stroke={secondary} strokeWidth="3" />
    </svg>
  )
}
