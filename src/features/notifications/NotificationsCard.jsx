import React, { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, CardBody, Switch } from '../../components/ui'
import { disablePush, enablePush, getPrefs, pushStatus, sendTestPush, setPrefs } from '../../lib/push'
import { track } from '../../lib/analytics'
import { friendlyError } from '../../lib/errors'

const KINDS = [
  { id: 'friends', label: 'Sala de amigos', hint: 'Se jugó una fecha o te falta el planteo.' },
  { id: 'club', label: 'Tu club te espera', hint: 'Un recordatorio si pasan varios días sin entrar.' },
  { id: 'news', label: 'Novedades', hint: 'Cuando el juego trae algo nuevo. Como máximo una por semana.' }
]

const MESSAGES = {
  'ios-install': 'En iPhone los avisos funcionan con el juego instalado: tocá Compartir, “Agregar a inicio” y abrilo desde ahí.',
  unsupported: 'Este navegador no permite recibir avisos.',
  blocked: 'Bloqueaste los avisos en este navegador. Para activarlos, cambiá el permiso de notificaciones del sitio en los ajustes del navegador.'
}

/** Avisos push: activarlos en este dispositivo, elegir qué tipos recibir, probarlos y apagarlos. El permiso se pide solo al tocar "Activar". */
export default function NotificationsCard({ userId }) {
  const [status, setStatus] = useState(null)
  const [prefs, setPrefsState] = useState({ friends: true, club: true, news: true })
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    const s = await pushStatus()
    setStatus(s)
    if (s.state === 'on' && userId) setPrefsState(await getPrefs(userId).catch(() => ({ friends: true, club: true, news: true })))
  }, [userId])
  useEffect(() => { refresh() }, [refresh])

  const run = async (fn) => {
    setBusy(true)
    try { return await fn() } catch (err) { toast.error(friendlyError(err, 'No pudimos completar la acción.')); return null } finally { setBusy(false) }
  }

  const enable = () => run(async () => {
    const result = await enablePush()
    if (result === 'on') { track('push_enabled'); toast.success('Avisos activados en este dispositivo.') }
    else if (result === 'blocked') toast.error('Los avisos quedaron bloqueados en el navegador.')
    await refresh()
  })
  const disable = () => run(async () => { await disablePush(); track('push_disabled'); toast.success('Avisos apagados en este dispositivo.'); await refresh() })
  const toggle = (id, value) => run(async () => {
    const next = { ...prefs, [id]: value }
    setPrefsState(next)
    await setPrefs(next)
  })
  const test = () => run(async () => {
    const ok = await sendTestPush()
    if (ok) toast.success('Te mandamos un aviso de prueba.')
    else toast.error('No pudimos mandar el aviso de prueba.')
  })

  if (!status) return null
  const note = MESSAGES[status.state === 'unsupported' ? status.reason : status.state]

  return (
    <section aria-labelledby="more-notifications">
      <h2 id="more-notifications" className="eyebrow mb-2 px-1">Notificaciones</h2>
      <Card as="div"><CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface-3 text-accent" aria-hidden="true">{status.state === 'on' ? <Bell className="size-5" /> : <BellOff className="size-5" />}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">{status.state === 'on' ? 'Avisos activados en este dispositivo' : 'Avisos en este dispositivo'}</p>
            <p className="text-xs text-fg-subtle">{status.state === 'on' ? 'Te avisamos de lo importante, sin spam y nunca de noche.' : note || 'Enterate cuando se juega una fecha de tu sala o si te falta elegir el planteo.'}</p>
          </div>
        </div>

        {status.state === 'off' && <Button onClick={enable} loading={busy} className="w-full sm:w-auto">Activar avisos</Button>}

        {status.state === 'on' && (
          <>
            <ul className="space-y-3">
              {KINDS.map(k => (
                <li key={k.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span id={`push-${k.id}`} className="block text-sm font-medium text-fg">{k.label}</span>
                    <span className="block text-xs text-fg-subtle">{k.hint}</span>
                  </span>
                  <Switch checked={prefs[k.id]} onCheckedChange={(v) => toggle(k.id, v)} aria-labelledby={`push-${k.id}`} disabled={busy} />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={test} loading={busy}>Mandarme un aviso de prueba</Button>
              <Button variant="ghost" size="sm" onClick={disable} loading={busy}>Apagar en este dispositivo</Button>
            </div>
          </>
        )}
      </CardBody></Card>
    </section>
  )
}
