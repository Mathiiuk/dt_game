import React from 'react'
import { Layers, Move, Save, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { Badge, Button, ChoiceChips, HelpHint } from '../../components/ui'
import { HELP } from '../../domain/tacticsHelp'
import { cn } from '../../lib/utils'
import { effectOf } from '../../domain/tacticalStyle'

/** Cinta de arriba en el celular: formación, estilo, nivel y química de un vistazo, y guardar apenas hay cambios */
export function SummaryBar({ formation, styleLabel, avg, chemistry, out, hurt, banned = 0, dirty, saving, onSave, canSave = true }) {
  return (
    <div className="mb-2 border-b border-line pb-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center text-sm font-semibold text-fg">
          <span className="truncate">{formation} <span className="font-normal text-fg-muted">· {styleLabel}</span></span>
          <HelpTopic help={HELP.board} className="-my-3" />
        </p>
        {dirty && <Button size="sm" onClick={onSave} loading={saving} disabled={!canSave} title={canSave ? undefined : 'Necesitás conexión para esto'}>{!saving && <Save />}Guardar</Button>}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Resumen del once">
        <li><Badge tone="neutral" className="num">Nivel {avg}</Badge></li>
        <li><Badge tone={chemistry >= 70 ? 'accent' : chemistry < 40 ? 'danger' : 'warning'} className="num">Química {chemistry}%</Badge></li>
        {out > 0 && <li><Badge tone="warning" className="num">{out} fuera de puesto</Badge></li>}
        {hurt > 0 && <li><Badge tone="danger" className="num">{hurt} lesionado{hurt > 1 ? 's' : ''}</Badge></li>}
        {banned > 0 && <li><Badge tone="danger" className="num">{banned} suspendido{banned > 1 ? 's' : ''}</Badge></li>}
        <li className="-my-3 -ml-1"><HelpTopic help={HELP.stats} /></li>
      </ul>
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
        <li className="flex items-center gap-1.5"><span className={`${ring} border-[oklch(75%_0.16_55)]`} />Adaptado</li>
        <li className="flex items-center gap-1.5"><span className={`${ring} border-danger`} />Fuera de puesto</li>
      </ul>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Líneas de química">
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[oklch(72%_0.17_150)]" />Química buena</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[oklch(82%_0.15_90)]" />Regular</li>
        <li className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[oklch(62%_0.2_25)]" />Mala</li>
      </ul>
      <ul className="space-y-1.5" aria-label="Símbolos de bajas">
        <li className="flex items-center gap-2"><span className="grid size-4 place-items-center rounded-full bg-danger text-[0.625rem] font-bold leading-none text-white">+</span>Cruz roja: lesionado</li>
        <li className="flex items-center gap-2"><span className="h-4 w-3 rounded-[2px] bg-danger" />Tarjeta roja: expulsado, se pierde el próximo partido</li>
        <li className="flex items-center gap-2"><span className="h-4 w-3 rounded-[2px] bg-warning" />Tarjeta amarilla: suspendido por 5 amarillas</li>
        <li className="flex items-center gap-2"><span className="h-3.5 w-2.5 rounded-[2px] border border-dashed border-warning bg-warning/40" />Amarilla punteada: tiene 4, con otra se suspende</li>
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
      <span className="font-semibold text-danger">+</span> lesionado · tarjeta roja: expulsado · <span className="font-semibold text-warning">tarjeta amarilla</span>: suspendido por 5 amarillas
    </p>
  )
}
