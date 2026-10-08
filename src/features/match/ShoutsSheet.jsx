import React from 'react'
import { Dialog, DialogContent, DialogBody } from '../../components/ui/dialog'
import { SHOUT_TYPES } from '../../api/matchEngine'
import { Megaphone } from 'lucide-react'

export default function ShoutsSheet({ 
  open, 
  onClose, 
  shoutWait, 
  activeOrder, 
  onApplyOrder 
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose?.() }}>
      <DialogContent
        placement="center" 
        size="sm"
        title="Órdenes e Instrucciones desde el Banco" 
        description={shoutWait > 0 ? `Enfriamiento activo: podés volver a gritar en ${shoutWait} min.` : 'Gritá a la banda para cambiar la actitud del equipo.'}
      >
        <DialogBody>
          <div className="space-y-2.5 py-2 max-w-md mx-auto">
        {SHOUT_TYPES.map(order => {
          const isSelected = activeOrder === order.id
          return (
            <button 
              key={order.id}
              disabled={shoutWait > 0}
              onClick={() => {
                onApplyOrder(order)
                onClose()
              }}
              className={`w-full p-3 text-left rounded-xl border transition-all flex items-start gap-3 ${
                isSelected 
                  ? 'border-accent bg-accent-soft text-accent font-bold ring-1 ring-accent'
                  : 'border-line bg-surface hover:border-line hover:bg-surface-2 text-fg disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <Megaphone className={`size-5 shrink-0 mt-0.5 ${isSelected ? 'text-accent' : 'text-fg-subtle'}`} />
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-sm text-fg">{order.label}</span>
                <span className="text-xs text-fg-subtle block mt-0.5">{order.desc}</span>
              </div>
            </button>
          )
        })}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
