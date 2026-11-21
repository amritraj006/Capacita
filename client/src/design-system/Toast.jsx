import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export function Toast({
  type = 'success',
  title,
  message,
  onClose,
  className = '',
}) {
  const styles = {
    success: {
      bg: 'bg-white border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />,
    },
    error: {
      bg: 'bg-white border-red-200 text-red-800',
      icon: <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />,
    },
    info: {
      bg: 'bg-white border-blue-200 text-blue-800',
      icon: <Info className="h-4 w-4 text-blue-600 shrink-0" />,
    },
  }

  const current = styles[type] || styles.info

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-md ${current.bg} max-w-sm transition-all ${className}`}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-xs font-semibold text-slate-900">{title}</h4>}
        {message && <p className="text-xs text-slate-600 mt-0.5">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
