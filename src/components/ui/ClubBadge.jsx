import React, { useId } from 'react'
import { cn } from '../../lib/utils'
import { CREST_PATTERNS, resolveClubPattern } from '../../domain/clubBadges'

export { CREST_PATTERNS, resolveClubPattern }


const SIZES = {
  xs: 'size-6 text-[9px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-sm',
  xl: 'size-18 text-base',
  '2xl': 'size-24 text-xl'
}

/**
 * Escudo vectorial SVG arcade para clubes de fútbol argentino.
 * Renderiza patrones históricos auténticos, colores primario y secundario, y sigla distintiva.
 */
export function ClubBadge({
  club,
  name,
  shortName,
  primaryColor,
  secondaryColor,
  pattern,
  size = 'md',
  className,
  showLabel = false
}) {
  const uniqueId = useId().replace(/:/g, '')
  const clubName = club?.name || name || 'Club'
  const acronym = (club?.short_name || shortName || clubName.slice(0, 3)).toUpperCase()
  const primary = club?.primary_color || primaryColor || club?.colors || '#10B981'
  const secondary = club?.secondary_color || secondaryColor || '#FFFFFF'
  const crestPattern = pattern || resolveClubPattern(club || { name: clubName, short_name: acronym })

  const sizeClass = SIZES[size] || size

  return (
    <div className={cn('inline-flex flex-col items-center justify-center gap-1 select-none', className)}>
      <svg
        viewBox="0 0 100 120"
        className={cn('shrink-0 filter drop-shadow-md transition-transform hover:scale-105', sizeClass)}
        role="img"
        aria-label={`Escudo de ${clubName}`}
      >
        <defs>
          {/* Silueta de escudo heráldico curvado clásico */}
          <clipPath id={`shield-clip-${uniqueId}`}>
            <path d="M 12 10 L 88 10 L 88 64 C 88 94 50 114 50 114 C 50 114 12 94 12 64 Z" />
          </clipPath>

          {/* Brillo arcade suave superior */}
          <linearGradient id={`sheen-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Capa de fondo con el patrón recortado a la forma del escudo */}
        <g clipPath={`url(#shield-clip-${uniqueId})`}>
          {/* Fondo primario */}
          <rect width="100" height="120" fill={primary} />

          {/* Patrones heráldicos argentinos */}
          {crestPattern === CREST_PATTERNS.SASH_DIAGONAL && (
            <polygon points="-20,20 120,-30 120,40 -20,90" fill={secondary} />
          )}

          {crestPattern === CREST_PATTERNS.STRIPE_HORIZONTAL && (
            <rect y="38" width="100" height="34" fill={secondary} />
          )}

          {crestPattern === CREST_PATTERNS.STRIPES_VERTICAL && (
            <g fill={secondary}>
              <rect x="22" y="0" width="16" height="120" />
              <rect x="62" y="0" width="16" height="120" />
            </g>
          )}

          {crestPattern === CREST_PATTERNS.CHEVRON_V && (
            <polygon points="50,78 92,10 74,10 50,56 26,10 8,10" fill={secondary} />
          )}

          {crestPattern === CREST_PATTERNS.HALVES && (
            <rect x="50" y="0" width="50" height="120" fill={secondary} />
          )}

          {/* Brillo de superficie */}
          <rect width="100" height="120" fill={`url(#sheen-${uniqueId})`} pointerEvents="none" />

          {/* Franja central tipográfica con sigla */}
          <g>
            <rect
              x="8"
              y="50"
              width="84"
              height="26"
              rx="4"
              fill="rgba(10, 15, 20, 0.82)"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="1.2"
            />
            <text
              x="50"
              y="69"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize={acronym.length > 3 ? '17' : '20'}
              fontWeight="900"
              letterSpacing="1px"
              style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.9))' }}
            >
              {acronym}
            </text>
          </g>
        </g>

        {/* Borde exterior del escudo con relieve metálico */}
        <path
          d="M 12 10 L 88 10 L 88 64 C 88 94 50 114 50 114 C 50 114 12 94 12 64 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M 10 8 L 90 8 L 90 64 C 90 96 50 116 50 116 C 50 116 10 96 10 64 Z"
          fill="none"
          stroke="#090D10"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      </svg>

      {showLabel && (
        <span className="text-[11px] font-semibold text-fg-muted truncate max-w-[90px] text-center">
          {clubName}
        </span>
      )}
    </div>
  )
}

export default ClubBadge
