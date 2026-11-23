import React, { useState, useEffect } from 'react'
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  X,
  FileCheck,
  Award,
  Sparkles
} from 'lucide-react'
import { assessmentsApi } from '../../api/assessments'

export function TrainerGradingHub() {
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Grading Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [trainerFeedback, setTrainerFeedback] = useState('')
  const [questionGrades, setQuestionGrades] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await assessmentsApi.getSubmissions()
      setSubmissions(Array.isArray(res) ? res : res.results || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load learner submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [])

  const openGradingModal = (sub) => {
    setSelectedSubmission(sub)
    setTrainerFeedback(sub.trainer_feedback || '')
    const grades = {}
    sub.answers?.forEach((ans) => {
      grades[ans.id] = {
        points_awarded: ans.points_awarded,
        comment: ans.evaluator_comment || '',
      }
    })
    setQuestionGrades(grades)
    setModalError(null)
  }

  const handleGradeSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSubmission) return
    setModalError(null)

    try {
      setSubmitting(true)
      await assessmentsApi.evaluateSubmission(selectedSubmission.id, {
        trainer_feedback: trainerFeedback,
        question_grades: questionGrades,
      })
      setSelectedSubmission(null)
      loadSubmissions()
    } catch (err) {
      setModalError(err.message || 'Failed to submit evaluation')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = submissions.filter((s) => {
    const emp = s.employee_details || {}
    const asm = s.assessment_details || {}
    const matchSearch =
      `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asm.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asm.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalSubmissions = submissions.length
  const evaluatedCount = submissions.filter((s) => s.status === 'EVALUATED').length
  const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED').length
  const passRate =
    totalSubmissions > 0
      ? Math.round((submissions.filter((s) => s.is_passed).length / totalSubmissions) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Trainer Instruction & Assessment Grading</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Learner Assessments & Grading Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review completed submissions, evaluate written criteria, adjust points, and provide constructive qualitative feedback.
            </p>
          </div>

          <button
            onClick={loadSubmissions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500">Trainee Submissions</span>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{totalSubmissions}</p>
            <span className="text-[11px] text-slate-400">Total submitted tests</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-amber-700">Pending Review</span>
            <p className="text-2xl font-semibold text-amber-900 mt-2">{pendingCount}</p>
            <span className="text-[11px] text-amber-600/80">Requires trainer grading</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-emerald-700">Evaluated / Finalized</span>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">{evaluatedCount}</p>
            <span className="text-[11px] text-emerald-600/80">Verified grades</span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-indigo-700">Cohort Pass Rate</span>
            <p className="text-2xl font-semibold text-indigo-900 mt-2">{passRate}%</p>
            <span className="text-[11px] text-indigo-600/80">Met benchmark threshold</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search trainee name, ID, or assessment code..."
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
            <option value="ALL">All Evaluation Statuses</option>
            <option value="SUBMITTED">Pending Review</option>
            <option value="EVALUATED">Evaluated</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Submissions Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no submissions matching your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Trainee</th>
                  <th className="py-3 px-4">Assessment Target</th>
                  <th className="py-3 px-4">Score & Outcome</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => {
                  const emp = s.employee_details || {}
                  const asm = s.assessment_details || {}

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {emp.employee_id} &bull; {emp.department_name}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{asm.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {asm.code} &bull; Attempt #{s.attempt_number}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {s.score} / {s.total_points}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                              s.is_passed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {s.is_passed ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {s.percentage}% &bull; {s.is_passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            s.status === 'EVALUATED'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.evaluated_by_name && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            by {s.evaluated_by_name}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(s.submitted_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openGradingModal(s)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          Grade & Feedback
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Evaluate Submission & Feedback</h2>
                <span className="text-[11px] text-slate-500">
                  {selectedSubmission.employee_details?.first_name} {selectedSubmission.employee_details?.last_name} &bull; {selectedSubmission.assessment_details?.code} (Attempt #{selectedSubmission.attempt_number})
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              {/* Assessment Summary Header */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Assessment Target</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {selectedSubmission.assessment_details?.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500 block">Current Auto-grade</span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedSubmission.score} / {selectedSubmission.total_points} ({selectedSubmission.percentage}%)
                  </span>
                </div>
              </div>

              {/* Question list for grading */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Question Responses & Points Allocation
                </span>
                {selectedSubmission.answers?.map((ans, idx) => {
                  const currentGrade = questionGrades[ans.id] || { points_awarded: ans.points_awarded, comment: '' }

                  return (
                    <div
                      key={ans.id}
                      className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-900">
                          {idx + 1}. {ans.question_prompt}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 font-normal">Award:</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={currentGrade.points_awarded}
                            onChange={(e) =>
                              setQuestionGrades({
                                ...questionGrades,
                                [ans.id]: {
                                  ...currentGrade,
                                  points_awarded: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className="w-16 text-center text-xs border border-slate-200 rounded p-1 font-bold bg-white"
                          />
                          <span className="text-slate-400">pts</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 block">Learner's Answer:</span>
                          <span className="font-semibold text-slate-800">{String(ans.selected_answer)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Answer Key:</span>
                          <span className="font-semibold text-emerald-700">{String(ans.correct_answer)}</span>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Item remark / evaluator comment..."
                        value={currentGrade.comment}
                        onChange={(e) =>
                          setQuestionGrades({
                            ...questionGrades,
                            [ans.id]: {
                              ...currentGrade,
                              comment: e.target.value,
                            },
                          })
                        }
                        className="w-full text-xs border border-slate-200 rounded p-1.5 bg-white"
                      />
                    </div>
                  )
                })}
              </div>

              {/* Overall Faculty Feedback */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Faculty Feedback & Recommendations
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed constructive feedback, strengths demonstrated, or areas needing improvement..."
                  value={trainerFeedback}
                  onChange={(e) => setTrainerFeedback(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
