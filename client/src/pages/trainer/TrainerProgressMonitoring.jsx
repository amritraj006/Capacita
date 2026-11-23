import React, { useEffect, useState } from 'react'
import { Users, ChevronDown, ChevronUp, Loader2, AlertCircle, TrendingUp, BookOpen, CheckCircle, Clock } from 'lucide-react'
import { progressApi } from '../../api/progress'
import { employeesApi } from '../../api/employees'

function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 w-10 text-right">{value}%</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    ENROLLED: { cls: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Enrolled' },
    IN_PROGRESS: { cls: 'bg-amber-50 text-amber-700 border-amber-100', label: 'In Progress' },
    COMPLETED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Completed' },
    DROPPED: { cls: 'bg-red-50 text-red-700 border-red-100', label: 'Dropped' },
  }
  const s = map[status] || { cls: 'bg-slate-50 text-slate-600 border-slate-100', label: status }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  )
}

function LearnerRow({ employee }) {
  const [expanded, setExpanded] = useState(false)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const toggleExpand = () => {
    setExpanded(prev => !prev)
    if (!progress && !loading) {
      setLoading(true)
      progressApi.getLearnerProgress(employee.id)
        .then(data => { setProgress(data); setLoading(false) })
        .catch(() => { setErr('Could not load progress.'); setLoading(false) })
    }
  }

  return (
    <>
      <tr
        className="hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={toggleExpand}
      >
        <td className="px-5 py-3">
          <div className="font-medium text-slate-800">{employee.user?.first_name} {employee.user?.last_name}</div>
          <div className="text-xs text-slate-400">{employee.employee_id}</div>
        </td>
        <td className="px-5 py-3 text-slate-500 text-sm">{employee.department?.name || '—'}</td>
        <td className="px-5 py-3 text-slate-500 text-sm">{employee.designation || '—'}</td>
        <td className="px-5 py-3">
          {expanded
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="px-5 pb-4 bg-slate-50 border-b border-slate-100">
            {loading && (
              <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Loading progress...
              </div>
            )}
            {err && <p className="text-sm text-red-500 py-3">{err}</p>}
            {progress && (
              <div className="space-y-3 pt-3">
                {progress.tracks && progress.tracks.length === 0 && (
                  <p className="text-sm text-slate-400">No enrollment tracks found.</p>
                )}
                {progress.tracks?.map(track => (
                  <div key={track.enrollment_id} className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <BookOpen size={13} className="text-slate-400" />
                          <span className="text-sm font-medium text-slate-800">{track.target_title}</span>
                          <span className="text-xs text-slate-400">{track.target_code}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={track.status} />
                          <span className="text-xs text-slate-400">
                            {track.completed_modules}/{track.total_modules} modules
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{track.progress_percentage}%</span>
                    </div>
                    <ProgressBar value={track.progress_percentage} />
                    {track.modules && track.modules.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {track.modules.map(mod => (
                          <div key={mod.id} className="flex items-center gap-2 text-xs text-slate-500">
                            {mod.is_completed
                              ? <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                              : <Clock size={12} className="text-slate-300 flex-shrink-0" />}
                            <span className={mod.is_completed ? 'text-slate-700' : 'text-slate-400'}>
                              {mod.order}. {mod.title}
                            </span>
                            {mod.is_completed && mod.completed_at && (
                              <span className="ml-auto text-slate-300">
                                {new Date(mod.completed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function TrainerProgressMonitoring() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    employeesApi.getEmployees({ page_size: 100 })
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results || [])
        setEmployees(list)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load employees.')
        setLoading(false)
      })
  }, [])

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase()
    return (
      emp.employee_id?.toLowerCase().includes(q) ||
      emp.user?.first_name?.toLowerCase().includes(q) ||
      emp.user?.last_name?.toLowerCase().includes(q) ||
      emp.department?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Progress Monitoring</h1>
        <p className="text-sm text-slate-500 mt-0.5">View detailed learning progress for each learner</p>
      </div>

      <div className="relative max-w-sm">
        <input
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Search learners..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-sm text-red-600">
            <AlertCircle size={16} /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-sm text-slate-400">
            <Users size={32} className="mx-auto mb-3 text-slate-200" />
            No learners found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Learner</th>
                <th className="text-left px-5 py-3">Department</th>
                <th className="text-left px-5 py-3">Designation</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(emp => (
                <LearnerRow key={emp.id} employee={emp} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
