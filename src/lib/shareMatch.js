import { shareText, shareUrl, outcomeOf } from '../domain/matchShare'
import { momentUrl } from '../domain/momentShare'
import { drawJersey } from './shareJersey'

const HEADLINE = { win: '¡GANAMOS!', draw: 'EMPATE PELEADO', loss: 'DERROTA DOLOROSA' }
const SLAB = '"Roboto Slab", Georgia, serif'
const CONDENSED = '"Barlow Condensed", "Arial Narrow", sans-serif'
const SANS = 'Inter, system-ui, sans-serif'

// Los mismos colores del juego: papel de diario (claro) y noche de redacción (oscuro)
const PALETTES = {
  light: { paper: '#F5EFE0', ink: '#14213D', muted: '#4A5470', line: '#B9AB86', red: '#BE2A35', blue: '#1F4E9D', win: '#1E7A4D', draw: '#8A6A0B', loss: '#BE2A35', gold: '#8A6A0B' },
  dark: { paper: '#101521', ink: '#F1EBDA', muted: '#A9B1C7', line: '#3A456A', red: '#FF8A8A', blue: '#7FA8FF', win: '#5be39b', draw: '#e8c86a', loss: '#ff7a6b', gold: '#e8c86a' }
}

/** Paleta de la tarjeta: la pedida, o la del tema que la persona está usando (claro si no se sabe) */
export function cardPalette(theme) {
  const current = theme || (typeof document !== 'undefined' ? document.documentElement.dataset.theme : undefined)
  return PALETTES[current === 'dark' ? 'dark' : 'light']
}

const withSpacing = (ctx, spacing, draw) => {
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing
  draw()
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
}

/** Cabezal de diario (filete doble, nombre, lema) y pie con el sitio; deja el centro libre para el titular */
function drawFrame(ctx, c) {
  ctx.fillStyle = c.paper
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.textAlign = 'center'
  ctx.fillStyle = c.ink
  ctx.fillRect(60, 70, 960, 6)
  ctx.fillRect(60, 84, 960, 2)
  withSpacing(ctx, '14px', () => {
    ctx.font = `800 104px ${SLAB}`
    ctx.fillText('VESTUARIO', 540, 196)
  })
  ctx.fillStyle = c.muted
  withSpacing(ctx, '8px', () => {
    ctx.font = `600 34px ${CONDENSED}`
    ctx.fillText('EL DIARIO DEL DT', 540, 252)
  })
  ctx.fillStyle = c.ink
  ctx.fillRect(60, 282, 960, 2)
  ctx.fillStyle = c.line
  ctx.fillRect(60, 1150, 960, 2)
  ctx.fillStyle = c.blue
  ctx.font = `600 44px ${SANS}`
  ctx.fillText('Probalo gratis en vestuario.com.ar', 540, 1240)
}

const headlineSize = (text) => (String(text).length > 12 ? 84 : 116)

/** Dibuja la tarjeta del resultado (1080 x 1350) en un canvas como portada de diario: titular, marcador, equipos y enlace */
export function drawShareCard(ctx, { club, rival, mine, theirs, kit, theme }) {
  const c = cardPalette(theme)
  const result = outcomeOf(mine, theirs)
  drawFrame(ctx, c)
  if (kit) drawJersey(ctx, { x: 440, y: 305, size: 200, ...kit })
  ctx.fillStyle = c[result]
  ctx.font = `800 ${headlineSize(HEADLINE[result])}px ${SLAB}`
  ctx.fillText(HEADLINE[result], 540, 640)
  ctx.fillStyle = c.ink
  ctx.font = `800 250px ${SLAB}`
  ctx.fillText(`${mine} - ${theirs}`, 540, 900)
  ctx.font = `700 56px ${SLAB}`
  ctx.fillText(club || 'Mi club', 540, 1020)
  ctx.fillStyle = c.muted
  ctx.font = `500 44px ${SANS}`
  ctx.fillText(`vs ${rival || 'El rival'}`, 540, 1090)
}

const toBlob = (canvas) => new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

/**
 * Comparte una tarjeta: con imagen si el dispositivo lo permite, si no con texto, y si no copia al portapapeles.
 * `draw(ctx)` pinta la tarjeta (1080 x 1350). Devuelve 'shared', 'copied' o 'cancelled'.
 */
export async function shareImage({ draw, text, url, fileName }, { doc = document, nav = navigator } = {}) {
  try {
    if (nav.share) {
      let files
      if (nav.canShare) {
        const canvas = doc.createElement('canvas')
        canvas.width = 1080
        canvas.height = 1350
        const ctx = canvas.getContext?.('2d')
        if (ctx) {
          draw(ctx)
          const blob = await toBlob(canvas)
          const file = blob && new File([blob], fileName, { type: 'image/png' })
          if (file && nav.canShare({ files: [file] })) files = [file]
        }
      }
      await nav.share(files ? { files, text, title: 'Vestuario' } : { text, title: 'Vestuario', url })
      return 'shared'
    }
    await nav.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'cancelled'
  }
}

/** Comparte el resultado de un partido */
export function shareMatchResult(data, deps) {
  return shareImage({ draw: (ctx) => drawShareCard(ctx, data), text: shareText(data), url: shareUrl(), fileName: 'resultado-vestuario.png' }, deps)
}

/** Tarjeta de un momento (campeonato, ascenso, fichaje, temporada, reto) como portada de diario */
export function drawMomentCard(ctx, moment) {
  const c = cardPalette(moment.theme)
  drawFrame(ctx, c)
  if (moment.kit) drawJersey(ctx, { x: 440, y: 305, size: 200, ...moment.kit })
  ctx.fillStyle = c[moment.tone] || c.red
  ctx.font = `800 ${headlineSize(moment.headline)}px ${SLAB}`
  ctx.fillText(moment.headline, 540, 640)
  ctx.fillStyle = c.ink
  ctx.font = `800 ${moment.big.length > 8 ? 120 : 250}px ${SLAB}`
  ctx.fillText(moment.big, 540, 900)
  ctx.font = `700 56px ${SLAB}`
  ctx.fillText(moment.club, 540, 1020)
  ctx.fillStyle = c.muted
  ctx.font = `500 44px ${SANS}`
  ctx.fillText(moment.sub, 540, 1090)
}

/** Comparte un momento del club (ver `momentCard`) */
export function shareMoment(moment, deps) {
  return shareImage({ draw: (ctx) => drawMomentCard(ctx, moment), text: moment.text, url: momentUrl(moment.kind), fileName: 'momento-vestuario.png' }, deps)
}
