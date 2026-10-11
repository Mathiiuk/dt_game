import React from 'react'
import { Layers, Move, Save, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { Badge, Button, ChoiceChips } from '../../components/ui'
import { cn } from '../../lib/utils'
import { effectOf } from '../../domain/tacticalStyle'

/** Cinta de arriba en el celular: formación, estilo, nivel y química de un vistazo, y guardar apenas hay cambios */
export function SummaryBar({ formation, styleLabel, avg, chemistry, out, hurt, dirty, saving, onSave }) {
  return (
    <div className="mb-2 border-b border-line pb-2">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-fg">{formation} <span className="font-normal text-fg-muted">· {styleLabel}</span></p>
        {dirty && <Button size="sm" onClick={onSave} loading={saving}>{!saving && <Save />}Guardar</Button>}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Resumen del once">
        <li><Badge tone="neutral" className="num">Nivel {avg}</Badge></li>
        <li><Badge tone={chemistry >= 70 ? 'accent' : chemistry < 40 ? 'danger' : 'warning'} className="num">Química {chemistry}%</Badge></li>
        {out > 0 && <li><Badge tone="warning" className="num">{out} fuera de puesto</Badge></li>}
        {hurt > 0 && <li><Badge tone="danger" className="num">{hurt} lesionado{hurt > 1 ? 's' : ''}</Badge></li>}
      </ul>
    </div>
  )
}

/** Barra que aparece al tocar una ficha: qué puesto es y el botón para cambiar al jugador (no se abre nada solo) */
export function SelectionBar({ slotName, playerName, onChange, onCancel }) {
  return (
    <section aria-label={`Puesto elegido: ${slotName}`} className="mb-2 flex items-center gap-2 rounded-lg border border-accent/50 bg-accent-soft px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-accent">Puesto {slotName}</p>
        <p className="truncate text-sm font-semibold text-fg">{playerName || 'Vacío'}</p>
      </div>
      <Button size="sm" onClick={onChange}>Cambiar jugador</Button>
      <Button size="icon" variant="ghost" onClick={onCancel} aria-label="Cancelar la selección" className="shrink-0"><X /></Button>
    </section>
  )
}

/** Barra de abajo: tres hojas (Estilo, Ajustes, Más) y el modo Editar posiciones */
export function Dock({ editMode, onToggleEdit, onOpen }) {
  const item = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[0.6875rem] font-semibold text-fg-muted transition-colors hover:text-fg active:bg-surface-2'
  return (
    <nav aria-label="Herramientas de la pizarra" className="mt-2 flex items-stretch gap-1 rounded-xl border border-line bg-surface px-1 py-1">
      <button type="button" className={item} onClick={() => onOpen('style')}><Sparkles className="size-5" aria-hidden="true" />Estilo</button>
      <button type="button" className={item} onClick={() => onOpen('fine')}><SlidersHorizontal className="size-5" aria-hidden="true" />Ajustes</button>
      <button type="button" className={item} onClick={() => onOpen('more')}><Layers className="size-5" aria-hidden="true" />Más</button>
      <button type="button" aria-pressed={editMode} onClick={onToggleEdit} className={cn(item, editMode && 'bg-accent-soft text-accent')}>
        <Move className="size-5" aria-hidden="true" />{editMode ? 'Editando' : 'Editar'}
      </button>
    </nav>
  )
}

/** Una instrucción en una sola línea de opciones y, debajo, lo que hace la elegida */
export function CompactInstruction({ title, group, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-fg">{title}</p>
      <ChoiceChips label={title} value={value} onChange={onChange} options={options.map(o => ({ value: o.id, label: o.label }))} />
      <p className="text-xs text-fg-muted">{effectOf(group, value)}</p>
    </div>
  )
}
