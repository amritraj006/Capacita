import React from 'react'

export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white ${className}`}>
      <table className="w-full text-left text-sm text-slate-600 border-collapse">
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children }) {
  return <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">{children}</thead>
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function TableRow({ children, className = '', hover = true, ...props }) {
  return (
    <tr
      className={`transition-colors ${hover ? 'hover:bg-slate-50/75' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '' }) {
  return <th scope="col" className={`px-5 py-3 font-semibold ${className}`}>{children}</th>
}

export function TableCell({ children, className = '' }) {
  return <td className={`px-5 py-3.5 text-slate-800 ${className}`}>{children}</td>
}
