import React from 'react'
import { AlertCircle, HelpCircle, Check, X, ShieldAlert } from 'lucide-react'

/**
 * Bottom Sheet modal para confirmaciones de la aplicación
 * Se desliza desde el borde inferior de la pantalla (Mobile-First)
 */
export default function ActionSheet({ isOpen, config, onConfirm, onCancel }) {
  if (!isOpen || !config) return null

  const {
    title = '¿Confirmar acción?',
    description = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'emerald', // 'emerald' | 'red' | 'amber' | 'purple' | 'blue'
    icon: CustomIcon
  } = config

  const getVariantStyles = () => {
    switch (variant) {
      case 'red':
        return {
          btn: 'bg-red-500 hover:bg-red-400 text-white',
          border: 'border-red-500/30',
          iconBg: 'bg-red-500/10 text-red-400',
          icon: ShieldAlert
        }
      case 'amber':
        return {
          btn: 'bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold',
          border: 'border-amber-500/30',
          iconBg: 'bg-amber-500/10 text-amber-400',
          icon: AlertCircle
        }
      case 'purple':
        return {
          btn: 'bg-purple-600 hover:bg-purple-500 text-white font-bold',
          border: 'border-purple-500/30',
          iconBg: 'bg-purple-500/10 text-purple-400',
          icon: HelpCircle
        }
      case 'blue':
        return {
          btn: 'bg-blue-600 hover:bg-blue-500 text-white font-bold',
          border: 'border-blue-500/30',
          iconBg: 'bg-blue-500/10 text-blue-400',
          icon: HelpCircle
        }
      case 'emerald':
      default:
        return {
          btn: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold',
          border: 'border-emerald-500/30',
          iconBg: 'bg-emerald-500/10 text-emerald-400',
          icon: Check
        }
    }
  }

  const vStyles = getVariantStyles()
  const IconComponent = CustomIcon || vStyles.icon

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to cancel */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Sheet Content */}
      <div 
        className="relative w-full max-w-lg p-5 sm:p-6 bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black animate-in slide-in-from-bottom duration-300 z-10"
      >
        {/* Handle visual para mobile */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${vStyles.iconBg} border ${vStyles.border} shrink-0`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-black text-white leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 font-semibold text-xs sm:text-sm transition-colors order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm transition-colors shadow-lg order-1 sm:order-2 ${vStyles.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
