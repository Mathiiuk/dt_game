import React from 'react'
import { Layers, Move, Save, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { Badge, Button, ChoiceChips, HelpHint } from '../../components/ui'
import { HELP } from '../../domain/tacticsHelp'
import { cn } from '../../lib/utils'
import { effectOf } from '../../domain/tacticalStyle'

/**
 * Franja de arriba en el celular: UNA sola línea de altura fija. Muestra el resumen (formación, nivel, química, bajas, Guardar y "?")
 * o, mientras hay una ficha elegida, el puesto y "Cambiar jugador" en el mismo lugar: la pizarra no se mueve ni genera scroll.
 */
export function TopBar({ selection, editing = false, onDoneEditing, ...summary }) {
  return (
    <div data-top-slot className="mb-2 h-11 border-y border-b-line-strong border-t-[3px] border-t-fg [border-top-style:double]">
      {selection ? <SelectionBar {...selection} /> : editing ? <EditBar onDone={onDoneEditing} /> : <SummaryBar {...summary} />}
    </div>
  )
}

/** Modo Editar: el aviso ocupa el lugar del resumen (misma altura) y "Listo" vuelve a la pizarra normal */
function EditBar({ onDone }) {
  return (
    <div className="flex h-full items-center gap-2 rounded-lg bg-primary-soft pl-3 pr-1">
      <p className="min-w-0 flex-1 text-xs leading-tight text-fg">Modo editar: arrastrá una ficha o tocá un lugar de la cancha para moverla.</p>
      <Button size="sm" onClick={onDone}>Listo</Button>
    </div>
  )
}

/** Resumen en una línea: formación y estilo (se recorta si falta lugar), nivel, química, bajas y guardar */
export function SummaryBar({ formation, styleLabel, avg, chemistry, out, hurt, banned = 0, dirty, saving, onSave, canSave = true }) {
  const flags = [
    hurt > 0 && `${hurt} lesionado${hurt > 1 ? 's' : ''}`,
    banned > 0 && `${banned} suspendido${banned > 1 ? 's' : ''}`,
    out > 0 && `${out} fuera de puesto`
  ].filter(Boolean)
  const flagCount = (hurt || 0) + (banned || 0) + (out || 0)
  return (
    <div className="flex h-full items-center gap-2">
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{formation} <span className="font-normal text-fg-muted">· {styleLabel}</span></p>
      <ul className="flex shrink-0 items-center gap-1.5" aria-label="Resumen del once">
        <li><Badge tone="neutral" className="num whitespace-nowrap font-display text-[0.9375rem] font-bold">Niv. {avg}</Badge></li>
        <li><Badge tone={chemistry >= 70 ? 'accent' : chemistry < 40 ? 'danger' : 'warning'} className="num whitespace-nowrap font-display text-[0.9375rem] font-bold">Quím. {chemistry}%</Badge></li>
        {flags.length > 0 && <li><Badge tone={hurt > 0 || banned > 0 ? 'danger' : 'warning'} className="num whitespace-nowrap font-display text-[0.9375rem] font-bold" aria-label={flags.join(', ')}>⚠ {flagCount}</Badge></li>}
      </ul>
      {dirty && <Button size="icon" onClick={onSave} loading={saving} disabled={!canSave} aria-label="Guardar" title={canSave ? 'Guardar' : 'Necesitás conexión para esto'} className="shrink-0">{!saving && <Save />}</Button>}
      <HelpTopic help={HELP.board} className="-mr-3" />
    </div>
  )
}

/** "?" con la ayuda de un tema (textos en domain/tacticsHelp); `help.legend` suma los colores y símbolos de la cancha */
export function HelpTopic({ help, className }) {
  return (
    <HelpHint topic={help.topic} title={help.title} className={className}>
      {help.body.map(line => <p key={line}>{line}</p>)}
      {help.legend && <BoardLegend />}
    </HelpHint>
  )
}

/** Colores del anillo, líneas de química y símbolos de bajas: lo que antes se mostraba suelto bajo la cancha */
export function BoardLegend() {
  const ring = 'size-2.5 rounded-full border-2'
  return (
    <div className="space-y-2 border-t border-line pt-3 text-xs">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Colores del anillo">
        <li className="flex items-center gap-1.5"><span className={`${ring} border-accent`} />Natural</li>
        <li className="flex items-center gap-1.5"><span className={`${ring} border-warning`} />Compatible</li>
        <li className="flex items-center gap-1.5"><span className={`${ring} border-ring-adapted`} />Adaptado</li>
        <li className="flex items-center gap-1.5"><span className={`${ring} border-danger`} />Fuera de puesto</li>
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Líneas de química">
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-link-good" />Química buena</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-link-ok" />Regular</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-link-bad" />Mala</li>
      </ul>
      <ul className="space-y-1.5" aria-label="Símbolos de bajas">
        <li className="flex items-center gap-2"><span className="grid size-4 place-items-center rounded-full bg-danger text-[0.625rem] font-bold leading-none text-danger-fg">+</span>Cruz roja: lesionado</li>
        <li className="flex items-center gap-2"><span className="h-4 w-3 rounded-[2px] bg-danger" />Tarjeta roja: expulsado, se pierde el próximo partido</li>
        <li className="flex items-center gap-2"><span className="h-4 w-3 rounded-[2px] bg-card-yellow" />Tarjeta amarilla: suspendido por 5 amarillas</li>
        <li className="flex items-center gap-2"><span className="h-3.5 w-2.5 rounded-[2px] border border-dashed border-card-yellow bg-card-yellow/40" />Amarilla punteada: tiene 4, con otra se suspende</li>
      </ul>
    </div>
  )
}

/** Al tocar una ficha: qué puesto es y el botón para cambiar al jugador (no se abre nada solo). Ocupa el lugar del resumen, en la misma línea */
export function SelectionBar({ slotName, playerName, onChange, onCancel }) {
  return (
    <section aria-label={`Puesto elegido: ${slotName}`} className="flex h-full items-center gap-2 rounded-lg bg-primary-soft pl-3 pr-1">
      <p className="min-w-0 flex-1 truncate text-sm"><span className="eyebrow mr-1.5 text-primary">{slotName}</span><span className="font-semibold text-fg">{playerName || 'Vacío'}</span></p>
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
      <button type="button" aria-pressed={editMode} onClick={onToggleEdit} className={cn(item, editMode && 'bg-primary-soft text-primary')}>
        <Move className="size-5" aria-hidden="true" />{editMode ? 'Editando' : 'Editar'}
      </button>
    </nav>
  )
}

/** Una instrucción en una sola línea de opciones y, debajo, lo que hace la elegida */
export function CompactInstruction({ title, group, value, onChange, options, help }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center"><p className="text-sm font-semibold text-fg">{title}</p>{help && <HelpTopic help={help} className="-my-3" />}</div>
      <ChoiceChips label={title} value={value} onChange={onChange} options={options.map(o => ({ value: o.id, label: o.label }))} />
      <p className="text-xs text-fg-muted">{effectOf(group, value)}</p>
    </div>
  )
}

/** Qué significa cada símbolo de las fichas, en una línea (solo cuando hay alguna baja en el once) */
export function StatusLegend() {
  return (
    <p className="mt-1 px-1 text-xs text-fg-muted">
      <span className="font-semibold text-danger">+</span> lesionado · tarjeta roja: expulsado · <span className="font-semibold text-gold">tarjeta amarilla</span>: suspendido por 5 amarillas
    </p>
  )
}
