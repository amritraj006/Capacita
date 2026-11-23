import React, { useState, useEffect } from 'react'
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  RefreshCw,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck
} from 'lucide-react'
import { assessmentsApi } from '../../api/assessments'
import { coursesApi } from '../../api/courses'
import { trainingApi } from '../../api/training'

export function AssessmentManagement() {
  const [activeTab, setActiveTab] = useState('assessments') // 'assessments' or 'submissions'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data
  const [assessments, setAssessments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [courses, setCourses] = useState([])
  const [trainingPrograms, setTrainingPrograms] = useState([])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
  const [selectedAssessmentForQuestion, setSelectedAssessmentForQuestion] = useState(null)
  const [expandedAssessmentId, setExpandedAssessmentId] = useState(null)
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null)

  // Forms
  const [assessmentForm, setAssessmentForm] = useState({
    code: '',
    title: '',
    description: '',
    target_type: 'COURSE', // 'COURSE' or 'PROGRAM'
    course: '',
    training_program: '',
    passing_percentage: 70,
    time_limit_minutes: 20,
    max_attempts: 3,
  })

  const [questionForm, setQuestionForm] = useState({
    prompt: '',
    question_type: 'SINGLE_CHOICE',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_answer: 'A',
    points: 5,
    explanation: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [asmRes, subRes, crsRes, trnRes] = await Promise.all([
        assessmentsApi.getAssessments(),
        assessmentsApi.getSubmissions(),
        coursesApi.getCourses(),
        trainingApi.getTrainingPrograms(),
      ])

      setAssessments(Array.isArray(asmRes) ? asmRes : asmRes.results || [])
      setSubmissions(Array.isArray(subRes) ? subRes : subRes.results || [])
      setCourses(Array.isArray(crsRes) ? crsRes : crsRes.results || [])
      setTrainingPrograms(Array.isArray(trnRes) ? trnRes : trnRes.results || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load assessments data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateAssessment = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!assessmentForm.code || !assessmentForm.title) {
      setModalError('Code and Title are required.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        code: assessmentForm.code,
        title: assessmentForm.title,
        description: assessmentForm.description,
        course: assessmentForm.target_type === 'COURSE' && assessmentForm.course ? parseInt(assessmentForm.course) : null,
        training_program: assessmentForm.target_type === 'PROGRAM' && assessmentForm.training_program ? parseInt(assessmentForm.training_program) : null,
        passing_percentage: parseInt(assessmentForm.passing_percentage) || 70,
        time_limit_minutes: parseInt(assessmentForm.time_limit_minutes) || 0,
        max_attempts: parseInt(assessmentForm.max_attempts) || 3,
        is_active: true,
      }

      await assessmentsApi.createAssessment(payload)
      setShowCreateAssessmentModal(false)
      setAssessmentForm({
        code: '',
        title: '',
        description: '',
        target_type: 'COURSE',
        course: '',
        training_program: '',
        passing_percentage: 70,
        time_limit_minutes: 20,
        max_attempts: 3,
      })
      loadData()
    } catch (err) {
      setModalError(err.message || 'Failed to create assessment')
    } finally {
      setSubmitting(false)
    }
  }

  const openAddQuestion = (asm) => {
    setSelectedAssessmentForQuestion(asm)
    setQuestionForm({
      prompt: '',
      question_type: 'SINGLE_CHOICE',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correct_answer: 'A',
      points: 5,
      explanation: '',
    })
    setModalError(null)
    setShowAddQuestionModal(true)
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!selectedAssessmentForQuestion) return
    setModalError(null)

    let options = []
    if (questionForm.question_type === 'SINGLE_CHOICE' || questionForm.question_type === 'MULTIPLE_CHOICE') {
      options = [
        { id: 'A', text: questionForm.optionA },
        { id: 'B', text: questionForm.optionB },
        { id: 'C', text: questionForm.optionC },
        { id: 'D', text: questionForm.optionD },
      ].filter((o) => o.text.trim())
    } else if (questionForm.question_type === 'TRUE_FALSE') {
      options = [
        { id: 'True', text: 'True' },
        { id: 'False', text: 'False' },
      ]
    }

    try {
      setSubmitting(true)
      await assessmentsApi.addQuestion(selectedAssessmentForQuestion.id, {
        prompt: questionForm.prompt,
        question_type: questionForm.question_type,
        options,
        correct_answer: questionForm.correct_answer,
        points: parseInt(questionForm.points) || 1,
        explanation: questionForm.explanation,
      })
      setShowAddQuestionModal(false)
      loadData()
    } catch (err) {
      setModalError(err.message || 'Failed to add question')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment? All learner submissions will be removed.')) return
    try {
      await assessmentsApi.deleteAssessment(id)
      setAssessments((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete assessment')
    }
  }

  const handleDeleteQuestion = async (asmId, qId) => {
    if (!window.confirm('Remove this question?')) return
    try {
      await assessmentsApi.deleteQuestion(asmId, qId)
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to delete question')
    }
  }

  const filteredAssessments = assessments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.course_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const filteredSubmissions = submissions.filter((s) => {
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Assessment & Evaluation Administration</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Assessments & Learning Outcome Evaluations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create accredited course evaluations, manage question banks, and audit employee test submissions and outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setModalError(null)
                setShowCreateAssessmentModal(true)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Assessment</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500">Active Assessments</span>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{assessments.length}</p>
            <span className="text-[11px] text-slate-400">Curricula tests</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-emerald-700">Total Submissions</span>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">{submissions.length}</p>
            <span className="text-[11px] text-emerald-600/80">Attempts recorded</span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-indigo-700">Pass Rate</span>
            <p className="text-2xl font-semibold text-indigo-900 mt-2">
              {submissions.length > 0
                ? Math.round((submissions.filter((s) => s.is_passed).length / submissions.length) * 100)
                : 0}
              %
            </p>
            <span className="text-[11px] text-indigo-600/80">Benchmark achieved</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-amber-700">Pending Evaluation</span>
            <p className="text-2xl font-semibold text-amber-900 mt-2">
              {submissions.filter((s) => s.status === 'SUBMITTED').length}
            </p>
            <span className="text-[11px] text-amber-600/80">Awaiting trainer grade</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('assessments')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'assessments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Assessment Catalog ({assessments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'submissions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Learner Results & Submissions ({submissions.length})</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'assessments'
                ? 'Search assessment title, code, course...'
                : 'Search employee name, ID, or assessment...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        {activeTab === 'submissions' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="EVALUATED">Evaluated</option>
              <option value="SUBMITTED">Submitted (Pending Review)</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Tab Content */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading assessment information...
        </div>
      ) : activeTab === 'assessments' ? (
        filteredAssessments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Assessments Created</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click "Create Assessment" to set up a new test for your courses or training programs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssessments.map((a) => {
              const isExpanded = expandedAssessmentId === a.id
              const questions = a.questions || []

              return (
                <div
                  key={a.id}
                  className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition"
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
                          {a.code}
                        </span>
                        <span className="text-xs text-slate-300">&bull;</span>
                        {a.course_code && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-slate-400" />
                            <span>{a.course_code}: {a.course_title}</span>
                          </span>
                        )}
                        {a.program_code && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-amber-500" />
                            <span>{a.program_code}</span>
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                          Pass: {a.passing_percentage}%
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {a.time_limit_minutes > 0 ? `${a.time_limit_minutes} mins` : 'Untimed'}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                      <p className="text-xs text-slate-500 max-w-3xl">{a.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openAddQuestion(a)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>

                      <button
                        onClick={() => setExpandedAssessmentId(isExpanded ? null : a.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{questions.length} Items ({a.total_points} pts)</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteAssessment(a.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Assessment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Questions Breakdown */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 border-t border-slate-200 p-5 space-y-2.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Questions in this assessment ({questions.length})
                      </span>

                      {questions.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No questions added yet. Click "Add Question" to configure test questions.
                        </p>
                      ) : (
                        questions.map((q) => (
                          <div
                            key={q.id}
                            className="bg-white border border-slate-200/80 rounded-lg p-3 text-xs flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-700">Q{q.order}.</span>
                                <span className="font-semibold text-slate-900">{q.prompt}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                                  {q.points} pts
                                </span>
                              </div>

                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-2 gap-1.5 pt-1 pl-5 text-[11px] text-slate-600">
                                  {q.options.map((opt) => (
                                    <div
                                      key={opt.id}
                                      className={`p-1 rounded ${
                                        String(opt.id) === String(q.correct_answer)
                                          ? 'bg-emerald-50 text-emerald-800 font-medium'
                                          : ''
                                      }`}
                                    >
                                      <span className="font-semibold">{opt.id}:</span> {opt.text}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleDeleteQuestion(a.id, q.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Submissions Ledger */
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Submissions Recorded</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No employees have submitted this assessment yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Learner</th>
                    <th className="py-3 px-4">Assessment Target</th>
                    <th className="py-3 px-4">Score & Outcome</th>
                    <th className="py-3 px-4">Evaluation Status</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((s) => {
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
                            onClick={() => setSelectedSubmissionDetails(s)}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                          >
                            Review Submission
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
      )}

      {/* Create Assessment Modal */}
      {showCreateAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-900">Create New Assessment</h2>
              <button
                onClick={() => setShowCreateAssessmentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assessment Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ASM-DEV-201"
                    value={assessmentForm.code}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, code: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pass Benchmark (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={assessmentForm.passing_percentage}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, passing_percentage: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Microservices & Distributed Architecture Quiz"
                  value={assessmentForm.title}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of testing objectives..."
                  value={assessmentForm.description}
                  onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Curriculum</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAssessmentForm({ ...assessmentForm, target_type: 'COURSE', training_program: '' })}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium ${
                        assessmentForm.target_type === 'COURSE'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Course
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssessmentForm({ ...assessmentForm, target_type: 'PROGRAM', course: '' })}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium ${
                        assessmentForm.target_type === 'PROGRAM'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Program
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for untimed"
                    value={assessmentForm.time_limit_minutes}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, time_limit_minutes: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {assessmentForm.target_type === 'COURSE' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Course</label>
                  <select
                    value={assessmentForm.course}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, course: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- General (No single course link) --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}: {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Training Program</label>
                  <select
                    value={assessmentForm.training_program}
                    onChange={(e) => setAssessmentForm({ ...assessmentForm, training_program: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- General (No program link) --</option>
                    {trainingPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}: {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAssessmentModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestionModal && selectedAssessmentForQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Add Question to Assessment</h2>
                <span className="text-[11px] text-slate-500 font-mono">{selectedAssessmentForQuestion.code}</span>
              </div>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Prompt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the complete question prompt..."
                  value={questionForm.prompt}
                  onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Question Type</label>
                  <select
                    value={questionForm.question_type}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Written Answer (Trainer Graded)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Points</label>
                  <input
                    type="number"
                    min="1"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {questionForm.question_type === 'SINGLE_CHOICE' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700">Answer Options</label>
                  {['A', 'B', 'C', 'D'].map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-6 font-bold text-slate-500 text-xs">{key}:</span>
                      <input
                        type="text"
                        placeholder={`Option ${key} text...`}
                        value={questionForm[`option${key}`]}
                        onChange={(e) => setQuestionForm({ ...questionForm, [`option${key}`]: e.target.value })}
                        className="flex-1 text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required={key === 'A' || key === 'B'}
                      />
                    </div>
                  ))}

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correct Option Key</label>
                    <select
                      value={questionForm.correct_answer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                </div>
              )}

              {questionForm.question_type === 'TRUE_FALSE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Correct Answer</label>
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Rationale revealed to the learner after evaluation..."
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {selectedSubmissionDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Submission Evaluation Audit</h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedSubmissionDetails.employee_details?.first_name} {selectedSubmissionDetails.employee_details?.last_name} &bull; Attempt #{selectedSubmissionDetails.attempt_number}
                </span>
              </div>
              <button
                onClick={() => setSelectedSubmissionDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Assessment</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {selectedSubmissionDetails.assessment_details?.title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500 block">Final Score</span>
                  <span className="text-base font-bold text-slate-900">
                    {selectedSubmissionDetails.score} / {selectedSubmissionDetails.total_points} ({selectedSubmissionDetails.percentage}%)
                  </span>
                </div>
              </div>

              {selectedSubmissionDetails.trainer_feedback && (
                <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                  <span className="font-semibold block mb-0.5">Faculty Feedback:</span>
                  "{selectedSubmissionDetails.trainer_feedback}"
                </div>
              )}

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Question-by-Question Breakdown
                </span>
                {selectedSubmissionDetails.answers?.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                      ans.is_correct
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : ans.is_correct === false
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-slate-200 bg-slate-50/60'
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
                      Learner Answer: <span className="font-semibold text-slate-800">{String(ans.selected_answer)}</span>
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
