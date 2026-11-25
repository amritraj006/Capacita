import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Calendar,
  MapPin,
  BookOpen,
  Users,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react'
import { trainingApi } from '../../api/training'

export function TrainerProgramsPage() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedProgram, setSelectedProgram] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)

  const loadPrograms = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await trainingApi.getTrainingPrograms()
      setPrograms(Array.isArray(res) ? res : res.results || [])
    } catch (err) {
      setError(err.message || 'Failed to load assigned training programs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrograms()
  }, [])

  const openLearnersModal = async (prog) => {
    setSelectedProgram(prog)
    setLoadingEnrollments(true)
    try {
      const res = await trainingApi.getProgramEnrollments(prog.id)
      setEnrollments(Array.isArray(res) ? res : res.results || [])
    } catch {
      setEnrollments([])
    } finally {
      setLoadingEnrollments(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Training Programs</h1>
          <p className="text-xs text-slate-500 mt-1">
            View training programs assigned to you, associated courses, dates, and enrolled learner progress.
          </p>
        </div>
        <button
          onClick={loadPrograms}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading assigned programs...
        </div>
      ) : programs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Assigned Training Programs</h3>
          <p className="text-xs text-slate-500 mt-1">
            You have not been assigned to any training programs yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((p) => {
            const coursesList = p.courses_details || []
            return (
              <div key={p.id} className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-700">{p.code}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                        {p.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {p.enrolled_count || 0} / {p.max_participants} Enrolled
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mt-1">{p.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                  </div>

                  <button
                    onClick={() => openLearnersModal(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shrink-0"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View Learners & Progress</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {p.start_date ? new Date(p.start_date).toLocaleDateString() : 'TBD'} &mdash;{' '}
                      {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.location_or_link || 'Online / Classroom'}</span>
                  </div>
                </div>

                {coursesList.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Associated Courses ({coursesList.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {coursesList.map((c) => (
                        <div
                          key={c.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span>{c.code}: {c.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Enrolled Learners</h2>
                <p className="text-[11px] text-slate-500">{selectedProgram.title}</p>
              </div>
              <button onClick={() => setSelectedProgram(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto">
              {loadingEnrollments ? (
                <p className="text-xs text-slate-400 text-center py-4">Loading learners...</p>
              ) : enrollments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No learners enrolled in this program yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {enrollments.map((enr) => (
                    <div key={enr.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{enr.employee_details?.name}</p>
                        <p className="text-slate-500">
                          {enr.employee_details?.employee_id} &bull; {enr.employee_details?.department_name || 'Unassigned'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          enr.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {enr.status}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1">{enr.progress_percentage || 0}% progress</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
