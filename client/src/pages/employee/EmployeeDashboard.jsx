import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  GraduationCap,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  CheckSquare,
  ChevronRight
} from 'lucide-react'
import { dashboardApi } from '../../api/dashboard'

export function EmployeeDashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    dashboardApi.getEmployeeDashboard()
      .then(res => {
        setData(res)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load employee dashboard')
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
    assigned_courses = [],
    active_training_programs = [],
    learning_progress = { total_courses: 0, completed_courses: 0, total_modules: 0, completed_modules: 0, overall_progress: 0 },
    pending_assessments = [],
    completed_courses = [],
    earned_certificates = []
  } = data || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">My Learning Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track your courses, upcoming trainings, and verified certificates</p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate && onNavigate('my-learning', 'My Learning')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs cursor-pointer hover:border-slate-300 transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Enrolled Courses</p>
              <p className="text-2xl font-bold text-slate-900">{learning_progress.total_courses || 0}</p>
              <p className="text-xs text-slate-400 mt-1">{learning_progress.completed_courses || 0} completed</p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-700">
              <BookOpen size={18} />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('my-learning', 'My Learning')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs cursor-pointer hover:border-slate-300 transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Training Cohorts</p>
              <p className="text-2xl font-bold text-slate-900">{active_training_programs.length}</p>
              <p className="text-xs text-slate-400 mt-1">Active program enrollments</p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50 text-purple-700">
              <GraduationCap size={18} />
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Overall Progress</p>
              <p className="text-2xl font-bold text-slate-900">{learning_progress.overall_progress || 0}%</p>
              <p className="text-xs text-slate-400 mt-1">
                {learning_progress.completed_modules || 0} of {learning_progress.total_modules || 0} modules
              </p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700">
              <TrendingUp size={18} />
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('my-certificates', 'My Certificates')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs cursor-pointer hover:border-slate-300 transition"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Verified Certs</p>
              <p className="text-2xl font-bold text-slate-900">{earned_certificates.length}</p>
              <p className="text-xs text-slate-400 mt-1">Institutional certificates</p>
            </div>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-700">
              <Award size={18} />
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Courses Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Assigned Courses & Curriculum Progress</h2>
            <span className="text-xs text-slate-400">{assigned_courses.length} Courses</span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('my-learning', 'My Learning')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
            >
              <span>Go to Learning Workspace</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        {assigned_courses.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No courses currently assigned. Check back later or request enrollment from your administrator.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assigned_courses.map(course => (
              <div
                key={course.enrollment_id}
                onClick={() => onNavigate && onNavigate('my-learning', 'My Learning')}
                className="p-5 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {course.code}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        course.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {course.status}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {course.category}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 mt-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {course.completed_modules} of {course.total_modules} modules completed
                    </p>
                  </div>
                  <div className="w-full sm:w-48">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-900">{course.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          course.progress_percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${course.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Pending Assessments & Active Training Cohorts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Assessments */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} className="text-purple-600" />
              <h2 className="text-sm font-semibold text-slate-800">Pending Assessments</h2>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('my-assessments', 'My Assessments')}
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 transition"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          {pending_assessments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <CheckCircle size={24} className="mx-auto mb-2 text-emerald-400" />
              All assigned tests completed and evaluated!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pending_assessments.map(asm => (
                <div
                  key={asm.id}
                  onClick={() => onNavigate && onNavigate('my-assessments', 'My Assessments')}
                  className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {asm.code}
                      </span>
                      <h3 className="text-xs font-semibold text-slate-800 mt-1">{asm.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Evaluating: {asm.course_or_program}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-slate-700 font-medium">Pass: {asm.passing_percentage}%</p>
                      <p className="text-slate-400 text-[11px]">{asm.time_limit_minutes} mins</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Training Cohorts */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-800">Active Training Programs</h2>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('my-learning', 'My Learning')}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          {active_training_programs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No cohort programs active right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {active_training_programs.map(tp => (
                <div
                  key={tp.enrollment_id}
                  onClick={() => onNavigate && onNavigate('my-learning', 'My Learning')}
                  className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        {tp.code}
                      </span>
                      <h3 className="text-xs font-semibold text-slate-800 mt-1">{tp.title}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tp.location}</p>
                    </div>
                    <div className="text-right text-xs">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {tp.status}
                      </span>
                      <p className="text-slate-400 text-[11px] mt-1">{tp.start_date || 'TBD'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard
