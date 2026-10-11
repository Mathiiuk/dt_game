import { useCallback, useEffect, useRef, useState } from 'react'
import { markBusy, clearBusy } from '../../lib/busy'
import { MIN_VISIBLE_MS, PHRASE_EVERY_MS, SHOW_AFTER_MS, weekDays, weekSummary } from '../../domain/weekFlavor'

const BUSY = 'advance-week'
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Avanza la semana mostrando "La semana pasa" solo si la espera se nota (> SHOW_AFTER_MS).
 * Nunca alarga la espera: al llegar la respuesta se cierra, salvo un mínimo visible para que se lea.
 * `run` hace el avance; `fromDate` es la fecha de juego antes de avanzar (los días que se muestran son los reales);
 * `readSnapshot` (opcional) lee caja y próximo partido antes y después para el resumen.
 * Devuelve `{ result, shown }`: si `shown` es true, el resumen ya cuenta lo que pasó (sin aviso extra).
 */
export function useAdvanceWeek() {
  const [visible, setVisible] = useState(false)
  const [tick, setTick] = useState(0)
  const [summary, setSummary] = useState(null)
  const [days, setDays] = useState(() => weekDays(null))
  const timers = useRef({})
  const timerBag = timers.current
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; clearTimeout(timerBag.show); clearInterval(timerBag.tick); clearBusy(BUSY) }
  }, [timerBag])

  const stopTimers = () => { clearTimeout(timers.current.show); clearInterval(timers.current.tick) }

  const advance = useCallback(async ({ run, readSnapshot, fromDate }) => {
    markBusy(BUSY)
    setSummary(null)
    setDays(weekDays(fromDate))
    setTick(0)
    let shownAt = null
    timers.current.show = setTimeout(() => {
      shownAt = Date.now()
      if (mounted.current) setVisible(true)
      timers.current.tick = setInterval(() => { if (mounted.current) setTick(t => t + 1) }, PHRASE_EVERY_MS)
    }, SHOW_AFTER_MS)
    try {
      const before = readSnapshot ? await readSnapshot().catch(() => null) : null
      const result = await run()
      const after = readSnapshot ? await readSnapshot().catch(() => null) : null
      stopTimers()
      if (shownAt === null) return { result, shown: false }
      const left = MIN_VISIBLE_MS - (Date.now() - shownAt)
      if (left > 0) await wait(left)
      if (mounted.current) setSummary(weekSummary({ budgetBefore: before?.budget, budgetAfter: after?.budget, injuriesRecovered: result?.stats?.injuriesRecovered, week: result?.week, today: result?.date, nextMatchDate: after ? after.nextMatchDate : undefined }))
      return { result, shown: true }
    } catch (error) {
      stopTimers()
      if (mounted.current) setVisible(false)
      throw error
    } finally {
      clearBusy(BUSY)
    }
  }, [])

  const close = useCallback(() => { setVisible(false); setSummary(null) }, [])

  return { advance, visible, tick, summary, days, close }
}
