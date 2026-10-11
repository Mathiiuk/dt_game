import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, ResponsiveOverlay } from '../../components/ui'
import { CHANGELOG, newestId, unseenEntries } from '../../data/changelog'
import { isNewAccount } from '../tutorial/tourState'
import { isSafeToUpdate } from '../../lib/updateGuard'

const key = (userId) => `vestuario-changelog-seen:${userId}`
const read = (userId) => { try { return window.localStorage.getItem(key(userId)) } catch { return null } }
const write = (userId, id) => { try { window.localStorage.setItem(key(userId), id) } catch { /* sin almacenamiento: se vuelve a mostrar */ } }

/**
 * "Novedades": después de actualizar, una sola vez por persona, qué cambió. No bloquea nada: se cierra con un toque.
 * Las cuentas nuevas no ven el historial (arrancan al día), y no aparece en un partido ni con algo a medias.
 */
export default function WhatsNew({ user, pathname }) {
  const [entries, setEntries] = useState([])
  const userId = user?.id

  useEffect(() => {
    if (!userId || !CHANGELOG.length) return
    const last = read(userId)
    if (last === null && isNewAccount(user.created_at)) { write(userId, newestId()); return }
    setEntries(unseenEntries(CHANGELOG, last).slice(0, 3))
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!entries.length || !isSafeToUpdate({ pathname })) return null
  const done = () => { write(userId, newestId()); setEntries([]) }

  return (
    <ResponsiveOverlay
      title="Novedades del juego"
      description="Esto cambió desde la última vez que jugaste."
      onClose={done}
      size="sm"
      footer={<Button onClick={done}>Entendido</Button>}
    >
      <div className="space-y-5">
        {entries.map(e => (
          <section key={e.id} aria-label={e.title}>
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-fg"><Sparkles className="size-4 text-accent" aria-hidden="true" />{e.title}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
              {e.items.map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </ResponsiveOverlay>
  )
}
