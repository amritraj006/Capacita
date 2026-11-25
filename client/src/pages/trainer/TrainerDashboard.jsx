import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
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
    assigned_programs_count = 0,
    upcoming_programs_count = 0,
    ongoing_programs_count = 0,
    completed_programs_count = 0,
    assigned_programs = [],
    assigned_employees_count = 0,
    assigned_employees = [],
  } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Trainer Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your assigned training programs and enrolled learners</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Assigned Programs</p>
              <p className="text-2xl font-bold text-slate-900">{assigned_programs_count}</p>
            </div>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-700">
              <GraduationCap size={16} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Assigned Learners</p>
              <p className="text-2xl font-bold text-slate-900">{assigned_employees_count}</p>
            </div>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-700">
              <Users size={16} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Upcoming</p>
              <p className="text-2xl font-bold text-slate-900">{upcoming_programs_count}</p>
            </div>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-700">
              <Calendar size={16} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Ongoing</p>
              <p className="text-2xl font-bold text-slate-900">{ongoing_programs_count}</p>
            </div>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-700">
              <Clock size={16} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{completed_programs_count}</p>
            </div>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700">
              <CheckCircle size={16} />
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Training Programs & Learners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Assigned Training Programs</h2>
            <span className="text-xs text-slate-400">{assigned_programs.length} Total</span>
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
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
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

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Assigned Learners</h2>
            <span className="text-xs text-slate-400">{assigned_employees_count} Total</span>
          </div>
          {assigned_employees.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No learners enrolled in your assigned programs yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-2.5">Learner</th>
                    <th className="text-left px-5 py-2.5">ID</th>
                    <th className="text-left px-5 py-2.5">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assigned_employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-2.5 font-medium text-slate-800">{emp.name}</td>
                      <td className="px-5 py-2.5 text-slate-500 font-mono">{emp.employee_id}</td>
                      <td className="px-5 py-2.5 text-slate-600">{emp.department}</td>
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
