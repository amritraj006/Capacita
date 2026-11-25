import React, { useState, useEffect } from 'react'
import {
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  UserCheck,
  CheckCircle,
  Award,
  Activity,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { dashboardApi } from '../../api/dashboard'

function MetricCard({ title, value, subtext, icon: Icon, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    dashboardApi.getAdminDashboard()
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load administrator dashboard')
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

  const {
    total_employees = 0,
    total_departments = 0,
    total_courses = 0,
    total_training_programs = 0,
    total_active_enrollments = 0,
    completed_training_programs = 0,
    recent_activities = [],
  } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Organization-wide training, enrollment, and completion overview</p>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Employees"
          value={total_employees}
          subtext="Registered employee accounts"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Total Departments"
          value={total_departments}
          subtext="Organizational units"
          icon={Building2}
          color="slate"
        />
        <MetricCard
          title="Total Courses"
          value={total_courses}
          subtext="Available learning resources"
          icon={BookOpen}
          color="emerald"
        />
        <MetricCard
          title="Total Training Programs"
          value={total_training_programs}
          subtext="Structured training cohorts"
          icon={GraduationCap}
          color="purple"
        />
        <MetricCard
          title="Active Enrollments"
          value={total_active_enrollments}
          subtext="Enrolled & in-progress learners"
          icon={UserCheck}
          color="amber"
        />
        <MetricCard
          title="Completed Training Programs"
          value={completed_training_programs}
          subtext="Programs marked completed"
          icon={CheckCircle}
          color="indigo"
        />
      </div>

      {/* Recent Training Activities */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Recent Training Activities</h2>
          </div>
          <span className="text-xs text-slate-400">Latest records</span>
        </div>

        {recent_activities && recent_activities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recent_activities.map((act) => (
              <div key={act.id} className="px-5 py-3 hover:bg-slate-50/60 transition-colors flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-600">
                  {act.type === 'CERTIFICATE' ? (
                    <Award size={15} className="text-indigo-600" />
                  ) : act.type === 'ASSESSMENT' ? (
                    <CheckCircle size={15} className="text-emerald-600" />
                  ) : (
                    <BookOpen size={15} className="text-blue-600" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                    {act.timestamp && (
                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">No training activity recorded yet.</div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
