import React, { useState, useEffect } from 'react'
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronRight,
  RefreshCw,
  X,
  PlayCircle,
  Award,
  AlertCircle,
  FileCheck
} from 'lucide-react'
import { assessmentsApi } from '../../api/assessments'

export function EmployeeAssessmentPortal() {
  const [activeTab, setActiveTab] = useState('assigned') // 'assigned' or 'history'
  const [loading, setLoading] = useState(true)
  const [assignedAssessments, setAssignedAssessments] = useState([])
  const [submissionHistory, setSubmissionHistory] = useState([])
  const [error, setError] = useState(null)

  // Test Taking State
  const [activeAssessment, setActiveAssessment] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submittingTest, setSubmittingTest] = useState(false)
  const [testResult, setTestResult] = useState(null)

  // Details Modal
  const [selectedSubmissionResult, setSelectedSubmissionResult] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [assignedRes, histRes] = await Promise.all([
        assessmentsApi.getMyAssignedAssessments(),
        assessmentsApi.getMySubmissions(),
      ])

      setAssignedAssessments(Array.isArray(assignedRes) ? assignedRes : [])
      setSubmissionHistory(Array.isArray(histRes) ? histRes : [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load your assessments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const startTest = (asm) => {
    setActiveAssessment(asm)
    setAnswers({})
    setCurrentQuestionIndex(0)
    setTestResult(null)
  }

  const handleSelectAnswer = (qId, answerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: answerValue,
    }))
  }

  const handleSubmitTest = async () => {
    if (!activeAssessment) return
    if (!window.confirm('Are you ready to submit your assessment answers for final evaluation?')) return

    try {
      setSubmittingTest(true)
      const result = await assessmentsApi.submitAssessment(activeAssessment.id, answers)
      setTestResult(result)
      loadData()
    } catch (err) {
      alert(err.message || 'Error submitting assessment')
    } finally {
      setSubmittingTest(false)
    }
  }

  const passedCount = submissionHistory.filter((s) => s.is_passed).length
  const totalAssigned = assignedAssessments.length

  const questions = activeAssessment?.questions || []
  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learner Assessment & Outcome Testing</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              My Assessments & Evaluations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify your curriculum learning outcomes, take accredited tests, and review performance benchmarks.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500">Assigned Assessments</span>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{totalAssigned}</p>
            <span className="text-[11px] text-slate-400">Linked to enrolled curricula</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-emerald-700">Passed Benchmarks</span>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">{passedCount}</p>
            <span className="text-[11px] text-emerald-600/80">Certified mastery</span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-indigo-700">Total Attempts Taken</span>
            <p className="text-2xl font-semibold text-indigo-900 mt-2">{submissionHistory.length}</p>
            <span className="text-[11px] text-indigo-600/80">Completed evaluations</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-amber-700">Pending Actions</span>
            <p className="text-2xl font-semibold text-amber-900 mt-2">
              {assignedAssessments.filter((a) => !a.has_passed).length}
            </p>
            <span className="text-[11px] text-amber-600/80">Assessments remaining</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('assigned')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'assigned'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Assigned Assessments ({assignedAssessments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>My Results & Submission History ({submissionHistory.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'assigned' ? (
        assignedAssessments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Assigned Assessments</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You do not have any pending assessments for your enrolled courses or training programs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedAssessments.map((a) => {
              const attemptsUsed = a.attempt_count || 0
              const canAttempt = attemptsUsed < a.max_attempts && !a.has_passed

              return (
                <div
                  key={a.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
                        {a.code}
                      </span>
                      {a.has_passed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Passed ({a.best_percentage}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {attemptsUsed > 0 ? `Attempt ${attemptsUsed} of ${a.max_attempts}` : 'Not Started'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {a.course_title && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span>{a.course_code}: {a.course_title}</span>
                        </span>
                      )}
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                        Benchmark: {a.passing_percentage}%
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{a.time_limit_minutes > 0 ? `${a.time_limit_minutes} min` : 'Untimed'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {a.questions_count} Questions &bull; {a.total_points} Points
                    </span>

                    <button
                      onClick={() => startTest(a)}
                      className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition shadow-xs ${
                        a.has_passed
                          ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{a.has_passed ? 'Retake Practice' : attemptsUsed > 0 ? 'Retake Assessment' : 'Start Assessment'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Submission History List */
        submissionHistory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Assessment History</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any assessments yet. Choose an assessment from the assigned tab to begin.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Attempt</th>
                  <th className="py-3 px-4">Score & Outcome</th>
                  <th className="py-3 px-4">Feedback</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissionHistory.map((s) => {
                  const asm = s.assessment_details || {}
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{asm.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{asm.code}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        Attempt #{s.attempt_number}
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

                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {s.trainer_feedback ? (
                          <span className="italic truncate block">"{s.trainer_feedback}"</span>
                        ) : (
                          <span className="text-slate-400">Automated evaluation</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(s.submitted_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedSubmissionResult(s)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          View Question Breakdown
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Taking Assessment Interactive Modal */}
      {activeAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-700 uppercase tracking-wider block">
                  {activeAssessment.code}
                </span>
                <h2 className="text-sm font-semibold text-slate-900">{activeAssessment.title}</h2>
              </div>
              <button
                onClick={() => {
                  if (testResult || window.confirm('Exit without submitting? Your answers will not be saved.')) {
                    setActiveAssessment(null)
                    setTestResult(null)
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Content or Result View */}
            <div className="flex-1 p-6 overflow-y-auto">
              {testResult ? (
                /* Immediate Post-Submission Feedback */
                <div className="space-y-5 text-center py-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                      testResult.is_passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {testResult.is_passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {testResult.is_passed ? 'Assessment Benchmark Achieved!' : 'Benchmark Not Met'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {testResult.is_passed
                        ? 'Congratulations! You successfully verified this curriculum competency.'
                        : 'Review the learning modules and attempt the assessment again.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 inline-block text-left w-full max-w-sm mx-auto space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Total Score:</span>
                      <span className="font-bold text-slate-900">
                        {testResult.score} / {testResult.total_points}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Percentage:</span>
                      <span className="font-bold text-slate-900">{testResult.percentage}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Required Benchmark:</span>
                      <span className="font-bold text-indigo-600">{activeAssessment.passing_percentage}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Attempt Number:</span>
                      <span className="font-bold text-slate-900">#{testResult.attempt_number}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setActiveAssessment(null)
                        setTestResult(null)
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
                    >
                      Return to Assessments
                    </button>
                  </div>
                </div>
              ) : currentQuestion ? (
                /* Question Screen */
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                    <span className="font-semibold text-indigo-600">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {currentQuestion.points} points
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {currentQuestion.prompt}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5 pt-2">
                    {currentQuestion.options?.map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQuestion.id, opt.id)}
                          className={`w-full text-left p-3.5 rounded-lg border text-xs font-medium flex items-center gap-3 transition ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span>
                            <strong className="mr-1">{opt.id}:</strong> {opt.text}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No questions found in this assessment.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!testResult && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                <button
                  type="button"
                  disabled={currentQuestionIndex <= 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-4 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={submittingTest}
                      onClick={handleSubmitTest}
                      className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                    >
                      {submittingTest ? 'Submitting...' : 'Submit Answers'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Breakdown Details Modal */}
      {selectedSubmissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Assessment Result Breakdown</h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedSubmissionResult.assessment_details?.title} &bull; Attempt #{selectedSubmissionResult.attempt_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmissionResult(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Assessment Target</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {selectedSubmissionResult.assessment_details?.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500 block">Score Achieved</span>
                  <span className="text-base font-bold text-slate-900">
                    {selectedSubmissionResult.score} / {selectedSubmissionResult.total_points} ({selectedSubmissionResult.percentage}%)
                  </span>
                </div>
              </div>

              {selectedSubmissionResult.trainer_feedback && (
                <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                  <span className="font-semibold block mb-0.5">Faculty Feedback:</span>
                  "{selectedSubmissionResult.trainer_feedback}"
                </div>
              )}

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Question Breakdown & Rationale
                </span>
                {selectedSubmissionResult.answers?.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                      ans.is_correct
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-rose-200 bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900">
                        {idx + 1}. {ans.question_prompt}
                      </span>
                      <span className="font-mono">
                        {ans.points_awarded} pts
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Your Selected Answer: <span className="font-semibold text-slate-800">{String(ans.selected_answer)}</span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Correct Key: <span className="font-semibold text-emerald-700">{String(ans.correct_answer)}</span>
                    </div>

                    {ans.explanation && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                        Explanation: {ans.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
