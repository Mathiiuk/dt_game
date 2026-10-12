import React, { useEffect, useState } from 'react'

const format = (d) => new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)

/**
 * Fecha del día para el mástil. Se calcula recién en el navegador: la portada se pre-dibuja en el HTML para los buscadores
 * y una fecha fija quedaría desactualizada (y no coincidiría al hidratar).
 */
export default function EditionDate({ now = () => new Date() }) {
  const [text, setText] = useState('')
  useEffect(() => { const t = format(now()); setText(t.charAt(0).toUpperCase() + t.slice(1)) }, [now])
  return <span className="min-h-[1em]">{text}</span>
}
