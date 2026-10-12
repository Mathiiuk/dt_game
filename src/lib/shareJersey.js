import { DEFAULT_JERSEY_PATTERN, normalizeJerseyPattern } from '../domain/jerseyKits'

/** Colores y diseño de la camiseta de un club (para las tarjetas de compartir) */
export const kitOf = (club) => ({
  primary: club?.primary_color || '#047857',
  secondary: club?.secondary_color || '#FFFFFF',
  pattern: club?.jersey_pattern || DEFAULT_JERSEY_PATTERN
})

/** Dibuja la camiseta en un canvas (misma silueta y estampados que el componente Jersey); `size` es el lado del cuadro de 100 x 100 */
export function drawJersey(ctx, { x, y, size, primary, secondary, pattern }) {
  const k = size / 100
  const p = (px, py) => [x + px * k, y + py * k]
  const silhouette = () => {
    ctx.beginPath()
    ctx.moveTo(...p(25, 25)); ctx.lineTo(...p(10, 40)); ctx.lineTo(...p(22, 50)); ctx.lineTo(...p(28, 42))
    ctx.lineTo(...p(28, 90)); ctx.lineTo(...p(72, 90)); ctx.lineTo(...p(72, 42)); ctx.lineTo(...p(78, 50))
    ctx.lineTo(...p(90, 40)); ctx.lineTo(...p(75, 25)); ctx.lineTo(...p(65, 25))
    ctx.bezierCurveTo(...p(63, 33), ...p(37, 33), ...p(35, 25))
    ctx.closePath()
  }
  const rect = (rx, ry, w, h) => ctx.fillRect(x + rx * k, y + ry * k, w * k, h * k)
  const kind = normalizeJerseyPattern(pattern)

  ctx.save()
  silhouette()
  ctx.fillStyle = primary
  ctx.fill()
  ctx.clip()
  ctx.fillStyle = secondary
  if (kind === 'CENTER_STRIPE') rect(42, 20, 16, 72)
  if (kind === 'STRIPES_VERTICAL') [30, 46, 62].forEach(rx => rect(rx, 20, 8, 72))
  if (kind === 'STRIPES_HORIZONTAL') [34, 52, 70].forEach(ry => rect(5, ry, 90, 8))
  if (kind === 'HALVES') rect(50, 20, 45, 72)
  if (kind === 'SASH') {
    ctx.beginPath()
    ctx.moveTo(...p(28, 30)); ctx.lineTo(...p(44, 30)); ctx.lineTo(...p(72, 86)); ctx.lineTo(...p(56, 86))
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  silhouette()
  ctx.strokeStyle = '#27272a'
  ctx.lineWidth = Math.max(2, 2 * k)
  ctx.stroke()
  ctx.restore()
}
