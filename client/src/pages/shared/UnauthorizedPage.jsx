import React from 'react'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '../../design-system/Button'

export function UnauthorizedPage({ onGoBack, requiredRole }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200">
      <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
        403 – Access Forbidden
      </h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
        Your current user role does not have authorization to view or execute operations on this module.
        {requiredRole && (
          <span className="block mt-1 font-semibold text-slate-700">
            Required Permission: {requiredRole}
          </span>
        )}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button variant="secondary" leftIcon={ArrowLeft} onClick={onGoBack}>
          Return to Permitted View
        </Button>
      </div>
    </div>
  )
}
