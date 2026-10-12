import React from 'react'
import { Card, Segmented } from '../../components/ui'
import { useTheme } from '../../lib/theme'

const OPTIONS = [
  { value: 'auto', label: 'Automático' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' }
]

/** Apariencia: papel (claro), noche de redacción (oscuro) o el tema del celular */
export default function ThemeToggle() {
  const { pref, setPref } = useTheme()
  return (
    <section aria-labelledby="more-theme">
      <h2 id="more-theme" className="eyebrow mb-2 px-1">Apariencia</h2>
      <Card as="div" className="space-y-2 p-4">
        <Segmented label="Apariencia" value={pref} onChange={setPref} options={OPTIONS} />
        <p className="text-xs text-fg-muted">Automático sigue el tema de tu celular: claro de día, oscuro de noche.</p>
      </Card>
    </section>
  )
}
