import React from 'react'
import { ChevronRight, Home } from 'lucide-react'

export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center text-xs text-slate-500" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 sm:space-x-2">
        <li className="inline-flex items-center">
          <span className="inline-flex items-center text-slate-400 hover:text-slate-700 transition-colors">
            <Home className="h-3.5 w-3.5 mr-1" />
            <span>Capacita</span>
          </span>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-slate-900 truncate">
                  {item.label}
                </span>
              ) : (
                <span className="hover:text-slate-800 transition-colors cursor-pointer truncate">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
