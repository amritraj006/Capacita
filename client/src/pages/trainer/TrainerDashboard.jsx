import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  CheckSquare,
  Award,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { dashboardApi } from '../../api/dashboard'

export function TrainerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    dashboardApi.getTrainerDashboard()
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load trainer dashboard')
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
    assigned_programs_count,
    assigned_programs,
    assigned_employees_count,
    assigned_employees,
    upcoming_activities,
    learner_progress,
    assessment_info
  } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Trainer Instruction Hub</h1>
        <p className="text-sm text-slate-500 mt-0.5">Assigned cohort batches, active trainees, and assessment grading</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Assigned Programs</p>
              <p className="text-2xl font-bold text-slate-900">{assigned_programs_count}</p>
              <p className="text-xs text-slate-400 mt-1">Lead instructor cohorts</p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-700">
              <GraduationCap size={18} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Assigned Learners</p>
              <p className="text-2xl font-bold text-slate-900">{assigned_employees_count}</p>
              <p className="text-xs text-slate-400 mt-1">Unique active trainees</p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700">
              <Users size={18} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Cohort Completion</p>
              <p className="text-2xl font-bold text-slate-900">{learner_progress.completion_rate}%</p>
              <p className="text-xs text-slate-400 mt-1">{learner_progress.completed} of {learner_progress.total_enrolled} finished</p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50 text-purple-700">
              <TrendingUp size={18} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Pending Grading</p>
              <p className="text-2xl font-bold text-slate-900">{assessment_info.pending_evaluations}</p>
              <p className="text-xs text-slate-400 mt-1">Submissions awaiting review</p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-50 text-amber-700">
              <CheckSquare size={18} />
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Training Programs & Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Assigned Training Programs */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Assigned Training Programs</h2>
            <span className="text-xs text-slate-400">{assigned_programs.length} Active Batches</span>
          </div>
          {assigned_programs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No training programs currently assigned to your account.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assigned_programs.map(prog => (
                <div key={prog.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {prog.code}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          prog.status === 'IN_PROGRESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {prog.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mt-1.5">{prog.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {prog.start_date || 'TBD'} to {prog.end_date || 'TBD'} &bull; {prog.location_or_link || 'Online'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">{prog.enrolled_count} Enrolled</p>
                      <p className="text-[11px] text-slate-400">{prog.completed_count} Completed</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Training Activities */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Upcoming Training Activities</h2>
            <Clock size={16} className="text-slate-400" />
          </div>
          {upcoming_activities.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No upcoming sessions scheduled at this moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming_activities.map(act => (
                <div key={act.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 mt-0.5">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                      <span className="text-[11px] font-mono text-slate-500">{act.code}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Starts: <strong className="text-slate-700">{act.start_date || 'Scheduled Soon'}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{act.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assessment Performance & Assigned Learners Sample */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Assessment Telemetry */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Assessment Outcomes</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Total Submissions</span>
                <span className="font-semibold text-slate-800">{assessment_info.total_submissions}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Passed Assessments</span>
                <span className="font-semibold text-emerald-600">{assessment_info.passed_submissions}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Average Benchmark Score</span>
                <span className="font-semibold text-indigo-600">{assessment_info.average_score}%</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, assessment_info.average_score)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Learners Table (sample) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Assigned Cohort Learners</h2>
            <span className="text-xs text-slate-400">{assigned_employees.length} learners shown</span>
          </div>
          {assigned_employees.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No learners enrolled in assigned programs yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-2.5">Learner</th>
                    <th className="text-left px-5 py-2.5">ID</th>
                    <th className="text-left px-5 py-2.5">Department</th>
                    <th className="text-left px-5 py-2.5">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assigned_employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-2.5 font-medium text-slate-800">{emp.name}</td>
                      <td className="px-5 py-2.5 text-slate-500 font-mono">{emp.employee_id}</td>
                      <td className="px-5 py-2.5 text-slate-600">{emp.department}</td>
                      <td className="px-5 py-2.5 text-slate-600">{emp.designation || 'Staff'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard
