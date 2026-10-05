import { useEffect, useState } from 'react'
import { QUOTE_TIMING, nextQuoteIndex, visibleMs } from './quoteCycle'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Máquina de estados del flash de frases: idle → enter → visible → exit → wait → (siguiente) → enter…
 * Con movimiento reducido, o en pausa, la frase queda quieta en pantalla.
 */
export function useQuoteCycle(quotes, { paused = false } = {}) {
  // Arranca siempre en la primera y oculta: así el HTML prerenderizado y el primer render coinciden
  const [state, setState] = useState({ index: 0, phase: 'idle' })
  const [reduced] = useState(prefersReducedMotion)
  const { index, phase } = state
  const quote = quotes[index] || quotes[0]

  useEffect(() => {
    if (reduced) {
      setState(s => (s.phase === 'visible' ? s : { ...s, phase: 'visible' }))
      return
    }
    if (paused && phase === 'visible') return
    const go = (next, ms) => setTimeout(() => setState(s => ({ ...s, phase: next })), ms)
    let timer
    if (phase === 'idle') timer = go('enter', 60)
    else if (phase === 'enter') timer = go('visible', QUOTE_TIMING.enter)
    else if (phase === 'visible' && quotes.length > 1) timer = go('exit', visibleMs(quote.text))
    else if (phase === 'exit') timer = go('wait', QUOTE_TIMING.exit)
    else if (phase === 'wait') {
      timer = setTimeout(() => setState(s => ({ index: nextQuoteIndex(s.index, quotes.length), phase: 'enter' })), QUOTE_TIMING.wait)
    }
    return () => clearTimeout(timer)
  }, [phase, index, paused, reduced, quotes, quote.text])

  return { quote, phase, reduced }
}
