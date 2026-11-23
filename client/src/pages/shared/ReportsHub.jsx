import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  CheckSquare,
  Search,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { reportsApi } from '../../api/reports'

export function ReportsHub() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('department')
  const [search, setSearch] = useState('')

  useEffect(() => {
    reportsApi.getReports()
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load system reports')
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
    department_participation,
    employee_progress,
    course_completion,
    training_activities,
    assessment_performance
  } = data

  const tabs = [
    { id: 'department', label: 'Department Participation', icon: Building2 },
    { id: 'employee', label: 'Employee Progress', icon: Users },
    { id: 'course', label: 'Course Completion', icon: BookOpen },
    { id: 'training', label: 'Training Activities', icon: GraduationCap },
    { id: 'assessment', label: 'Assessment Performance', icon: CheckSquare },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Institutional Reporting Hub</h1>
        <p className="text-sm text-slate-500 mt-0.5">Comprehensive audit, progress, and capacity building reports</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch('') }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Report Content Panels */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* 1. Department-wise training participation */}
        {activeTab === 'department' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Department</th>
                  <th className="text-right px-5 py-3">Total Employees</th>
                  <th className="text-right px-5 py-3">Enrollments</th>
                  <th className="text-right px-5 py-3">Completed</th>
                  <th className="text-right px-5 py-3">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {department_participation
                  .filter(d => d.department_name.toLowerCase().includes(search.toLowerCase()))
                  .map(dept => (
                    <tr key={dept.department_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{dept.department_name}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{dept.employee_count}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{dept.total_enrollments}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{dept.completed_enrollments}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{dept.completion_rate}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Employee learning progress */}
        {activeTab === 'employee' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Employee</th>
                  <th className="text-left px-5 py-3">ID</th>
                  <th className="text-left px-5 py-3">Department</th>
                  <th className="text-right px-5 py-3">Total Enrolled</th>
                  <th className="text-right px-5 py-3">In Progress</th>
                  <th className="text-right px-5 py-3">Completed</th>
                  <th className="text-right px-5 py-3">Modules Done</th>
                  <th className="text-right px-5 py-3">Certs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employee_progress
                  .filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.employee_id.toLowerCase().includes(search.toLowerCase()))
                  .map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{emp.name}</td>
                      <td className="px-5 py-3 font-mono text-slate-500">{emp.employee_id}</td>
                      <td className="px-5 py-3 text-slate-600">{emp.department}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{emp.total_enrollments}</td>
                      <td className="px-5 py-3 text-right text-amber-600">{emp.in_progress}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{emp.completed}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{emp.modules_completed}</td>
                      <td className="px-5 py-3 text-right font-bold text-indigo-700">{emp.certificates_count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Course completion reports */}
        {activeTab === 'course' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Course Title</th>
                  <th className="text-left px-5 py-3">Category</th>
                  <th className="text-left px-5 py-3">Level</th>
                  <th className="text-right px-5 py-3">Enrolled</th>
                  <th className="text-right px-5 py-3">In Progress</th>
                  <th className="text-right px-5 py-3">Completed</th>
                  <th className="text-right px-5 py-3">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {course_completion
                  .filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
                  .map(course => (
                    <tr key={course.course_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-700">{course.code}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{course.title}</td>
                      <td className="px-5 py-3 text-slate-500">{course.category}</td>
                      <td className="px-5 py-3 text-slate-500">{course.level}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{course.total_enrolled}</td>
                      <td className="px-5 py-3 text-right text-amber-600">{course.in_progress}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{course.completed}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{course.completion_rate}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Training activity reports */}
        {activeTab === 'training' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Program Title</th>
                  <th className="text-left px-5 py-3">Lead Trainer</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Timeline</th>
                  <th className="text-right px-5 py-3">Enrolled</th>
                  <th className="text-right px-5 py-3">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {training_activities
                  .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase()))
                  .map(prog => (
                    <tr key={prog.training_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-purple-700">{prog.code}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{prog.title}</td>
                      <td className="px-5 py-3 text-slate-600">{prog.lead_trainer}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {prog.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{prog.start_date || 'TBD'} &rarr; {prog.end_date || 'TBD'}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{prog.enrolled_participants}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{prog.completed_participants}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Assessment performance reports */}
        {activeTab === 'assessment' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Code</th>
                  <th className="text-left px-5 py-3">Assessment Title</th>
                  <th className="text-left px-5 py-3">Curriculum Target</th>
                  <th className="text-right px-5 py-3">Threshold</th>
                  <th className="text-right px-5 py-3">Submissions</th>
                  <th className="text-right px-5 py-3">Passed</th>
                  <th className="text-right px-5 py-3">Failed</th>
                  <th className="text-right px-5 py-3">Pass Rate</th>
                  <th className="text-right px-5 py-3">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessment_performance
                  .filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase()))
                  .map(asm => (
                    <tr key={asm.assessment_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-slate-700">{asm.code}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{asm.title}</td>
                      <td className="px-5 py-3 text-slate-500">{asm.target}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{asm.passing_percentage}%</td>
                      <td className="px-5 py-3 text-right text-slate-600">{asm.total_submissions}</td>
                      <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{asm.passed_count}</td>
                      <td className="px-5 py-3 text-right text-red-600">{asm.failed_count}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">{asm.pass_rate}%</td>
                      <td className="px-5 py-3 text-right font-bold text-indigo-600">{asm.average_score}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsHub
