import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Mail,
  ChevronRight
} from 'lucide-react'
import { enrollmentsApi } from '../../api/enrollments'

export function TrainerMonitoringPage() {
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await enrollmentsApi.getTrainerMonitoring()
      setEnrollments(res)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to load trainee monitoring data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredEnrollments = enrollments.filter((e) => {
    const emp = e.employee_details || {}
    const nameMatch =
      (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())

    const statusMatch = statusFilter === 'ALL' || e.status === statusFilter
    return nameMatch && statusMatch
  })

  const totalTrainees = enrollments.length
  const completedTrainees = enrollments.filter((e) => e.status === 'COMPLETED').length
  const inProgressTrainees = enrollments.filter(
    (e) => e.status === 'IN_PROGRESS' || e.status === 'ENROLLED'
  ).length
  const avgProgress =
    totalTrainees > 0
      ? Math.round(
          enrollments.reduce((acc, curr) => acc + (curr.progress_percentage || 0), 0) /
            totalTrainees
        )
      : 0

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Trainer Instruction & Trainee Telemetry</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Trainee Cohort & Progress Monitoring
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time monitoring of enrolled learners across your assigned training programs and courses.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Trainees
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500">Total Enrolled Learners</span>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{totalTrainees}</p>
            <span className="text-[11px] text-slate-400">Under your supervision</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-amber-700">Active / In Progress</span>
            <p className="text-2xl font-semibold text-amber-900 mt-2">{inProgressTrainees}</p>
            <span className="text-[11px] text-amber-600/80">Pending completion</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-emerald-700">Course Completions</span>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">{completedTrainees}</p>
            <span className="text-[11px] text-emerald-600/80">Fully certified</span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-indigo-700">Cohort Avg Progress</span>
            <p className="text-2xl font-semibold text-indigo-900 mt-2">{avgProgress}%</p>
            <span className="text-[11px] text-indigo-600/80">Curriculum completion rate</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="ENROLLED">Enrolled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DROPPED">Dropped</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Trainees Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading assigned trainees...</div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Trainees Match Filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no learners enrolled in your programs matching the search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Trainee</th>
                  <th className="py-3 px-4">Department / Role</th>
                  <th className="py-3 px-4">Assigned Curriculum</th>
                  <th className="py-3 px-4">Progress Telemetry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enr) => {
                  const emp = enr.employee_details || {}
                  const targetTitle = enr.course_details
                    ? `Course: ${enr.course_details.code} - ${enr.course_details.title}`
                    : enr.training_program_details
                    ? `Program: ${enr.training_program_details.code} - ${enr.training_program_details.title}`
                    : 'Training Track'
                  const pct = enr.progress_percentage || 0
                  const isCompleted = enr.status === 'COMPLETED'

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {emp.name || emp.email || 'Employee'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {emp.employee_id} &bull; {emp.email}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{emp.designation || 'Employee'}</div>
                        <div className="text-[11px] text-slate-400">
                          {emp.department_name || 'Unassigned'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 max-w-xs truncate">
                          {enr.course_details ? (
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          ) : (
                            <GraduationCap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="truncate">{targetTitle}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Type: {enr.enrollment_type}
                        </div>
                      </td>

                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-medium text-slate-700">
                            {enr.completed_modules || 0}/{enr.total_modules || 0} Modules
                          </span>
                          <span className="font-bold text-slate-900">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : enr.status === 'IN_PROGRESS'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {enr.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(enr.enrolled_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
