import React from 'react'

// Grano muy fino para que el fondo no sea un degradado plano (SVG en línea: no pesa ni pide otra descarga)
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/**
 * Fondo de la portada: "minutos antes de salir a la cancha".
 * Oscuridad de túnel, una luz puntual que baja desde arriba y las líneas de una pizarra táctica apenas visibles.
 * Es decorativo (oculto para lectores de pantalla), no usa imágenes y nunca compite con el texto.
 */
export default function Atmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-bg">
      {/* Luz del reflector: entra desde arriba, al centro */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-8%,oklch(96%_0.03_110/0.24),transparent_70%)]" />

      {/* Pizarra táctica: media cancha con un movimiento dibujado en tiza */}
      <svg
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute inset-0 size-full text-fg opacity-[0.07] [mask-image:radial-gradient(ellipse_75%_70%_at_50%_45%,black,transparent)]"
      >
        <rect x="80" y="60" width="1040" height="680" />
        <line x1="600" y1="60" x2="600" y2="740" />
        <circle cx="600" cy="400" r="110" />
        <rect x="80" y="220" width="170" height="360" />
        <rect x="80" y="320" width="60" height="160" />
        <rect x="950" y="220" width="170" height="360" />
        <rect x="1060" y="320" width="60" height="160" />
        {/* Jugadores propios (círculos) y rivales (cruces) */}
        <circle cx="360" cy="250" r="14" />
        <circle cx="430" cy="520" r="14" />
        <circle cx="760" cy="300" r="14" />
        <path d="M850 500l24 24m0-24l-24 24M700 590l24 24m0-24l-24 24M905 250l24 24m0-24l-24 24" />
        {/* Pases y desmarques */}
        <path d="M376 258C520 300 640 300 742 300M444 512C560 470 640 400 748 318" strokeDasharray="10 12" />
        <path d="M776 296C860 280 930 330 990 390m0 0l-22-4m22 4l-4-22" />
      </svg>

      {/* Bordes más oscuros: la mirada queda en el centro */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,oklch(9%_0.01_160/0.85))]" />
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  )
}
