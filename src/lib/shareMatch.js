import { shareText, shareUrl, outcomeOf } from '../domain/matchShare'

const COLORS = { win: '#5be39b', draw: '#e8c86a', loss: '#ff7a6b' }
const HEADLINE = { win: '¡GANAMOS!', draw: 'EMPATE PELEADO', loss: 'DERROTA DOLOROSA' }

/** Dibuja la tarjeta del resultado (1080 x 1350) en un canvas: marca, resultado, marcador y enlace */
export function drawShareCard(ctx, { club, rival, mine, theirs }) {
  const result = outcomeOf(mine, theirs)
  ctx.fillStyle = '#0b1410'
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#5be39b'
  ctx.font = '700 56px sans-serif'
  ctx.fillText('VESTUARIO', 540, 140)
  ctx.fillStyle = COLORS[result]
  ctx.font = '700 120px sans-serif'
  ctx.fillText(HEADLINE[result], 540, 460)
  ctx.fillStyle = '#f2f7f4'
  ctx.font = '700 260px sans-serif'
  ctx.fillText(`${mine} - ${theirs}`, 540, 760)
  ctx.font = '600 52px sans-serif'
  ctx.fillText(club || 'Mi club', 540, 900)
  ctx.fillStyle = '#a9bdb2'
  ctx.font = '500 44px sans-serif'
  ctx.fillText(`vs ${rival || 'El rival'}`, 540, 970)
  ctx.fillStyle = '#5be39b'
  ctx.font = '600 44px sans-serif'
  ctx.fillText('Probalo gratis en vestuario.com.ar', 540, 1230)
}

const toBlob = (canvas) => new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

/**
 * Comparte el resultado: con imagen si el dispositivo lo permite, si no con texto, y si no copia al portapapeles.
 * Devuelve 'shared', 'copied' o 'cancelled'.
 */
export async function shareMatchResult(data, { doc = document, nav = navigator } = {}) {
  const text = shareText(data)
  try {
    if (nav.share) {
      let files
      if (nav.canShare) {
        const canvas = doc.createElement('canvas')
        canvas.width = 1080
        canvas.height = 1350
        const ctx = canvas.getContext?.('2d')
        if (ctx) {
          drawShareCard(ctx, data)
          const blob = await toBlob(canvas)
          const file = blob && new File([blob], 'resultado-vestuario.png', { type: 'image/png' })
          if (file && nav.canShare({ files: [file] })) files = [file]
        }
      }
      await nav.share(files ? { files, text, title: 'Vestuario' } : { text, title: 'Vestuario', url: shareUrl() })
      return 'shared'
    }
    await nav.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'cancelled'
  }
}
