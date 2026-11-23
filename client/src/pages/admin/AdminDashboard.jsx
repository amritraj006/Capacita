import React, { useState, useEffect } from 'react'
import {
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Activity,
  AlertCircle,
  Loader2,
  ArrowUpRight
} from 'lucide-react'
import { dashboardApi } from '../../api/dashboard'

function MetricCard({ title, value, subtext, icon: Icon, color = 'slate' }) {
  const colorMap = {
    slate: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
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

export function AdminDashboard({ onNavigate }) {
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
    total_employees,
    total_departments,
    total_courses,
    total_training_programs,
    training_participation,
    course_completion,
    employee_learning_overview,
    recent_activities
  } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Administrator Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time telemetry and capacity building analytics</p>
        </div>
      </div>

      {/* Top Level Institutional Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value={total_employees}
          subtext="Active workforce accounts"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Departments"
          value={total_departments}
          subtext="Functional organizational units"
          icon={Building2}
          color="slate"
        />
        <MetricCard
          title="Courses"
          value={total_courses}
          subtext="Published learning paths"
          icon={BookOpen}
          color="emerald"
        />
        <MetricCard
          title="Training Programs"
          value={total_training_programs}
          subtext="Structured cohort programs"
          icon={GraduationCap}
          color="purple"
        />
      </div>

      {/* Secondary Metrics: Participation & Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Training Participation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Training Participation</h2>
              <GraduationCap size={16} className="text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{training_participation.total_enrollments}</p>
            <p className="text-xs text-slate-500 mt-1">Total cohort enrollments</p>

            <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Active Trainees (Distinct):</span>
                <span className="font-semibold text-slate-900">{training_participation.active_trainees}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Completed Cohorts:</span>
                <span className="font-semibold text-emerald-600">{training_participation.completed_trainings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Completion Information */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Course Completion</h2>
              <Award size={16} className="text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{course_completion.completion_rate}%</span>
              <span className="text-xs text-slate-400">completion rate</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${course_completion.completion_rate}%` }}
              />
            </div>

            <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Completed Courses:</span>
                <span className="font-semibold text-emerald-600">{course_completion.completed}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>In-Progress:</span>
                <span className="font-semibold text-amber-600">{course_completion.in_progress}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Learning Overview */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Learning Overview</h2>
              <TrendingUp size={16} className="text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{employee_learning_overview.active_learners}</span>
              <span className="text-xs text-slate-400">active learners</span>
            </div>

            <div className="mt-4 space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Modules Finished:</span>
                <span className="font-semibold text-slate-900">{employee_learning_overview.total_modules_completed}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pending Starts:</span>
                <span className="font-semibold text-slate-700">{employee_learning_overview.enrolled}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Platform Activities */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Recent Platform Activities</h2>
          </div>
          <span className="text-xs text-slate-400">Live operational feed</span>
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
          <div className="p-8 text-center text-sm text-slate-400">No platform activity recorded yet.</div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
