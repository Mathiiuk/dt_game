import React from 'react'
import { ResponsiveOverlay } from '../../components/ui/responsive-overlay'
import { SHOUT_TYPES } from '../../api/matchEngine'

export default function ShoutsSheet({ 
  open, 
  onClose,
  shoutWait,
  activeOrder,
  onApplyOrder
}) {
  return (
    <ResponsiveOverlay 
      open={open} 
      onClose={onClose} 
      title="�rdenes al equipo" 
      placement="bottom"
      size="sm"
    >
      <div className="space-y-3 py-2">
        {shoutWait > 0 && <p className="text-sm text-fg-subtle">Pod�s volver a gritar en {shoutWait} min.</p>}
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
              className={`w-full p-4 text-left rounded-xl border transition-all ${
                isSelected 
                  ? 'border-accent bg-accent-soft text-accent font-bold'
                  : 'border-line bg-bg/60 text-fg hover:border-line hover:bg-surface-3'
              }`}
            >
              <span className="block font-bold text-base">{order.label}</span>
              <span className="text-sm text-fg-subtle">{order.desc}</span>
            </button>
          )
        })}
      </div>
    </ResponsiveOverlay>
  )
}
