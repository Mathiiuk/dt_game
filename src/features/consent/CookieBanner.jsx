import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applyStoredConsent, getConsent, setConsent } from '../../lib/consent'
import { Button } from '../../components/ui'

/** Aviso de cookies de medición y publicidad: se muestra una vez y recuerda la elección */
export default function CookieBanner() {
  const [open, setOpen] = useState(() => getConsent() === null)

  useEffect(() => { applyStoredConsent() }, [])

  if (!open) return null

  const choose = (choice) => { setConsent(choice); setOpen(false) }

  return (
    <section aria-label="Aviso de cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border border-line bg-surface p-4 shadow-lg sm:bottom-5">
      <p className="text-sm text-fg-muted">
        Usamos cookies para medir cuánta gente visita Vestuario y mejorar el juego. No incluyen tu nombre ni tu correo.
        {' '}<Link to="/privacidad" className="font-medium text-fg underline underline-offset-4">Política de privacidad</Link>
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => choose('denied')}>Solo necesarias</Button>
        <Button size="sm" onClick={() => choose('granted')}>Aceptar</Button>
      </div>
    </section>
  )
}
