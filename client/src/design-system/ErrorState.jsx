import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({
  title = 'Something went wrong',
  message = 'Failed to load content. Please verify your connection or try again.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-red-200 bg-red-50/40 ${className}`}
    >
      <div className="h-11 w-11 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3.5">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-4">
          <Button variant="outline" size="sm" leftIcon={RotateCcw} onClick={onRetry}>
            Retry Operation
          </Button>
        </div>
      )}
    </div>
  )
}
