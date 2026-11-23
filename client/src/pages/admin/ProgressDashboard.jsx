import React, { useEffect, useState } from 'react'
import { BarChart2, Users, BookOpen, TrendingUp, Award, Loader2, AlertCircle } from 'lucide-react'
import { progressApi } from '../../api/progress'

function StatCard({ icon: Icon, label, value, sub, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-50 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  )
}

export function ProgressDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    progressApi.getAnalytics()
      .then(data => { setAnalytics(data); setLoading(false) })
      .catch(err => {
        setError(err.message || 'Failed to load analytics.')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <AlertCircle size={18} /> {error}
      </div>
    )
  }

  const { total_enrollments, completed_enrollments, in_progress_enrollments, enrolled_enrollments,
          total_modules_completed, active_learners, overall_completion_rate, department_breakdown } = analytics

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Progress Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Organisation-wide learning progress overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Active Learners" value={active_learners} color="blue" />
        <StatCard icon={BookOpen} label="Total Enrollments" value={total_enrollments}
          sub={`${enrolled_enrollments} pending start`} color="slate" />
        <StatCard icon={TrendingUp} label="In Progress" value={in_progress_enrollments} color="amber" />
        <StatCard icon={Award} label="Completed" value={completed_enrollments}
          sub={`${overall_completion_rate}% completion rate`} color="emerald" />
      </div>

      {/* Modules row */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Total Modules Completed</span>
        </div>
        <p className="text-3xl font-bold text-slate-900">{total_modules_completed}</p>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Department Breakdown</h2>
        </div>
        {department_breakdown && department_breakdown.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-5 py-3">Department</th>
                <th className="text-right px-5 py-3">Enrolled</th>
                <th className="text-right px-5 py-3">Completed</th>
                <th className="text-right px-5 py-3">Rate</th>
                <th className="px-5 py-3">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {department_breakdown.map((dept) => (
                <tr key={dept.department} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{dept.department}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{dept.total_enrolled}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{dept.completed}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-700">{dept.completion_rate}%</td>
                  <td className="px-5 py-3">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${dept.completion_rate}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No department data available.</div>
        )}
      </div>
    </div>
  )
}
