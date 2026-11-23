import React, { useState, useEffect } from 'react'
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Users,
  RefreshCw,
  X,
  FileCheck,
  TrendingUp,
  History,
  Trash2,
  Tag
} from 'lucide-react'
import { competenciesApi } from '../../api/competencies'
import { coursesApi } from '../../api/courses'
import { trainingApi } from '../../api/training'
import { employeesApi } from '../../api/employees'

export function CompetencyFrameworkManagement() {
  const [activeTab, setActiveTab] = useState('framework') // 'framework', 'records', 'categories'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data states
  const [categories, setCategories] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [records, setRecords] = useState([])
  const [courses, setCourses] = useState([])
  const [trainingPrograms, setTrainingPrograms] = useState([])
  const [employees, setEmployees] = useState([])

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Modals
  const [showCreateCompetencyModal, setShowCreateCompetencyModal] = useState(false)
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEvaluateModal, setShowEvaluateModal] = useState(false)
  const [selectedRecordForEvaluation, setSelectedRecordForEvaluation] = useState(null)
  const [selectedRecordHistory, setSelectedRecordHistory] = useState(null)

  // Forms
  const [competencyForm, setCompetencyForm] = useState({
    code: '',
    name: '',
    category: '',
    description: '',
    target_level: 'INTERMEDIATE',
    associated_courses: [],
    associated_programs: [],
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  })

  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    competency_id: '',
    current_level: 'BASIC',
    status: 'PENDING_REVIEW',
    evaluation_notes: '',
  })

  const [evaluateForm, setEvaluateForm] = useState({
    current_level: 'INTERMEDIATE',
    status: 'VERIFIED',
    evaluation_notes: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [catRes, cmpRes, recRes] = await Promise.all([
        competenciesApi.getCategories(),
        competenciesApi.getCompetencies(),
        competenciesApi.getEmployeeCompetencies(),
      ])

      setCategories(Array.isArray(catRes) ? catRes : catRes.results || [])
      setCompetencies(Array.isArray(cmpRes) ? cmpRes : cmpRes.results || [])
      setRecords(Array.isArray(recRes) ? recRes : recRes.results || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load competency framework data')
    } finally {
      setLoading(false)
    }
  }

  const loadAuxiliaryData = async () => {
    try {
      const [crsRes, trnRes, empRes] = await Promise.all([
        coursesApi.getCourses(),
        trainingApi.getTrainingPrograms(),
        employeesApi.getEmployees(),
      ])
      setCourses(Array.isArray(crsRes) ? crsRes : crsRes.results || [])
      setTrainingPrograms(Array.isArray(trnRes) ? trnRes : trnRes.results || [])
      setEmployees(Array.isArray(empRes) ? empRes : empRes.results || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadAllData()
    loadAuxiliaryData()
  }, [])

  // Create Category Submit
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    setModalError(null)
    try {
      setSubmitting(true)
      await competenciesApi.createCategory(categoryForm)
      setShowCreateCategoryModal(false)
      setCategoryForm({ name: '', description: '' })
      loadAllData()
    } catch (err) {
      setModalError(err.message || 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  // Create Competency Submit
  const handleCreateCompetency = async (e) => {
    e.preventDefault()
    setModalError(null)
    if (!competencyForm.category) {
      setModalError('Please choose a competency category.')
      return
    }

    try {
      setSubmitting(true)
      await competenciesApi.createCompetency({
        ...competencyForm,
        category: parseInt(competencyForm.category),
      })
      setShowCreateCompetencyModal(false)
      setCompetencyForm({
        code: '',
        name: '',
        category: '',
        description: '',
        target_level: 'INTERMEDIATE',
        associated_courses: [],
        associated_programs: [],
      })
      loadAllData()
    } catch (err) {
      setModalError(err.message || 'Failed to create competency')
    } finally {
      setSubmitting(false)
    }
  }

  // Assign Competency Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    setModalError(null)
    if (!assignForm.employee_id || !assignForm.competency_id) {
      setModalError('Employee and Competency are required.')
      return
    }

    try {
      setSubmitting(true)
      await competenciesApi.createEmployeeCompetency({
        employee: parseInt(assignForm.employee_id),
        competency: parseInt(assignForm.competency_id),
        current_level: assignForm.current_level,
        status: assignForm.status,
        evaluation_notes: assignForm.evaluation_notes,
      })
      setShowAssignModal(false)
      setAssignForm({
        employee_id: '',
        competency_id: '',
        current_level: 'BASIC',
        status: 'PENDING_REVIEW',
        evaluation_notes: '',
      })
      loadAllData()
    } catch (err) {
      setModalError(err.message || 'Failed to assign competency. Employee may already have this record.')
    } finally {
      setSubmitting(false)
    }
  }

  // Open Evaluate Modal
  const openEvaluateModal = (record) => {
    setSelectedRecordForEvaluation(record)
    setEvaluateForm({
      current_level: record.current_level,
      status: record.status === 'PENDING_REVIEW' ? 'VERIFIED' : record.status,
      evaluation_notes: record.evaluation_notes || '',
    })
    setModalError(null)
    setShowEvaluateModal(true)
  }

  // Evaluate Submit
  const handleEvaluateSubmit = async (e) => {
    e.preventDefault()
    if (!selectedRecordForEvaluation) return
    setModalError(null)
    try {
      setSubmitting(true)
      await competenciesApi.evaluateCompetency(selectedRecordForEvaluation.id, evaluateForm)
      setShowEvaluateModal(false)
      loadAllData()
    } catch (err) {
      setModalError(err.message || 'Failed to submit evaluation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCompetency = async (id) => {
    if (!window.confirm('Are you sure you want to delete this competency standard?')) return
    try {
      await competenciesApi.deleteCompetency(id)
      setCompetencies((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete competency')
    }
  }

  const toggleCourseSelect = (courseId) => {
    setCompetencyForm((prev) => {
      const exists = prev.associated_courses.includes(courseId)
      return {
        ...prev,
        associated_courses: exists
          ? prev.associated_courses.filter((id) => id !== courseId)
          : [...prev.associated_courses, courseId],
      }
    })
  }

  const toggleProgramSelect = (progId) => {
    setCompetencyForm((prev) => {
      const exists = prev.associated_programs.includes(progId)
      return {
        ...prev,
        associated_programs: exists
          ? prev.associated_programs.filter((id) => id !== progId)
          : [...prev.associated_programs, progId],
      }
    })
  }

  // Filtered Framework Competencies
  const filteredCompetencies = competencies.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.category_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || c.category.toString() === categoryFilter
    const matchLvl = levelFilter === 'ALL' || c.target_level === levelFilter
    return matchSearch && matchCat && matchLvl
  })

  // Filtered Records
  const filteredRecords = records.filter((r) => {
    const emp = r.employee_details || {}
    const cmp = r.competency_details || {}
    const matchSearch =
      `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cmp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cmp.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
    const matchLvl = levelFilter === 'ALL' || r.current_level === levelFilter
    return matchSearch && matchStatus && matchLvl
  })

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Institutional Competency Framework</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Competencies & Professional Development
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Define organization-wide competency benchmarks, associate learning curricula, and record structured employee evaluations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setModalError(null)
                setShowCreateCategoryModal(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
            <button
              onClick={() => {
                setModalError(null)
                setShowAssignModal(true)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assign to Employee</span>
            </button>
            <button
              onClick={() => {
                setModalError(null)
                setShowCreateCompetencyModal(true)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Define Competency</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500">Framework Competencies</span>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{competencies.length}</p>
            <span className="text-[11px] text-slate-400">In {categories.length} categories</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-emerald-700">Verified Evaluations</span>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">
              {records.filter((r) => r.status === 'VERIFIED').length}
            </p>
            <span className="text-[11px] text-emerald-600/80">Confirmed competencies</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-amber-700">Pending Review</span>
            <p className="text-2xl font-semibold text-amber-900 mt-2">
              {records.filter((r) => r.status === 'PENDING_REVIEW').length}
            </p>
            <span className="text-[11px] text-amber-600/80">Awaiting trainer audit</span>
          </div>

          <div className="bg-rose-50/50 border border-rose-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-rose-700">Needs Development</span>
            <p className="text-2xl font-semibold text-rose-900 mt-2">
              {records.filter((r) => r.status === 'NEEDS_IMPROVEMENT').length}
            </p>
            <span className="text-[11px] text-rose-600/80">Action required</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('framework')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'framework'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Competency Standards ({competencies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'records'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Employee Evaluations & Tracking ({records.length})</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'framework'
                ? 'Search competency code, name, category...'
                : 'Search employee name, ID, or competency...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {activeTab === 'framework' ? (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
            >
              <option value="ALL">All Evaluation Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
            </select>
          )}

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="ALL">All Proficiency Levels</option>
            <option value="BASIC">Level 1: Basic Awareness</option>
            <option value="INTERMEDIATE">Level 2: Working Knowledge</option>
            <option value="ADVANCED">Level 3: Proficient</option>
            <option value="EXPERT">Level 4: Expert Mastery</option>
          </select>
        </div>
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
          Loading competency records...
        </div>
      ) : activeTab === 'framework' ? (
        /* Competency Standards List */
        filteredCompetencies.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Award className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Competencies Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No competencies match the filters. Click "Define Competency" to register a new institutional standard.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCompetencies.map((cmp) => {
              const coursesList = cmp.associated_courses_details || []
              const progsList = cmp.associated_programs_details || []

              return (
                <div
                  key={cmp.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 transition shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
                          {cmp.code}
                        </span>
                        <span className="text-xs text-slate-300">&bull;</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {cmp.category_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                          Target: {cmp.target_level}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900">{cmp.name}</h3>
                      <p className="text-xs text-slate-500 max-w-3xl">{cmp.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteCompetency(cmp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete Competency"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Associated Learning Tracks */}
                  {(coursesList.length > 0 || progsList.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Associated Learning Curricula
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {coursesList.map((c) => (
                          <div
                            key={c.id}
                            className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3 h-3 text-indigo-500" />
                            <span>Course: {c.code} ({c.title})</span>
                          </div>
                        ))}
                        {progsList.map((p) => (
                          <div
                            key={p.id}
                            className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
                          >
                            <GraduationCap className="w-3 h-3 text-amber-500" />
                            <span>Program: {p.code} ({p.title})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Employee Competencies & Evaluation Table */
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No Evaluation Records Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No employee records match your criteria. Click "Assign to Employee" to initialize a competency profile.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Competency Standard</th>
                    <th className="py-3 px-4">Current Level</th>
                    <th className="py-3 px-4">Target Benchmark</th>
                    <th className="py-3 px-4">Evaluation Status</th>
                    <th className="py-3 px-4">Evaluated By / Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((r) => {
                    const emp = r.employee_details || {}
                    const cmp = r.competency_details || {}
                    const isVerified = r.status === 'VERIFIED'
                    const needsImp = r.status === 'NEEDS_IMPROVEMENT'

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {emp.employee_id} &bull; {emp.department_name}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{cmp.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {cmp.code} &bull; {cmp.category_name}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100">
                            {r.current_level}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {cmp.target_level}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : needsImp
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          {r.evaluated_by_name ? (
                            <div className="text-[11px] text-slate-700 font-medium">
                              Audited by {r.evaluated_by_name}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">Self-reported / Initial</div>
                          )}
                          {r.evaluation_notes && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              "{r.evaluation_notes}"
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {r.evaluation_history && r.evaluation_history.length > 0 && (
                              <button
                                onClick={() => setSelectedRecordHistory(r)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition"
                                title="Audit Log / History"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => openEvaluateModal(r)}
                              className="px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                            >
                              Evaluate
                            </button>
                          </div>
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

      {/* Evaluate Competency Modal */}
      {showEvaluateModal && selectedRecordForEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Record Competency Evaluation</h2>
                <span className="text-[11px] text-slate-500">
                  {selectedRecordForEvaluation.employee_details?.first_name} {selectedRecordForEvaluation.employee_details?.last_name} &bull; {selectedRecordForEvaluation.competency_details?.code}
                </span>
              </div>
              <button
                onClick={() => setShowEvaluateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEvaluateSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assessed Proficiency Level
                </label>
                <select
                  value={evaluateForm.current_level}
                  onChange={(e) => setEvaluateForm({ ...evaluateForm, current_level: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="BASIC">Level 1: Basic Awareness</option>
                  <option value="INTERMEDIATE">Level 2: Working Knowledge</option>
                  <option value="ADVANCED">Level 3: Proficient</option>
                  <option value="EXPERT">Level 4: Expert Mastery</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Target benchmark for this competency is:{' '}
                  <span className="font-semibold text-indigo-600">
                    {selectedRecordForEvaluation.competency_details?.target_level}
                  </span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluation Status
                </label>
                <select
                  value={evaluateForm.status}
                  onChange={(e) => setEvaluateForm({ ...evaluateForm, status: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="VERIFIED">Verified (Benchmark Confirmed)</option>
                  <option value="NEEDS_IMPROVEMENT">Needs Improvement (Requires Training)</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evaluation Evidence & Feedback Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Justification, project evidence, course completion status, or improvement steps..."
                  value={evaluateForm.evaluation_notes}
                  onChange={(e) => setEvaluateForm({ ...evaluateForm, evaluation_notes: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvaluateModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Confirm Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Audit Modal */}
      {selectedRecordHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Competency Development Log</h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedRecordHistory.competency_details?.code}: {selectedRecordHistory.competency_details?.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecordHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto space-y-3">
              {selectedRecordHistory.evaluation_history.map((h) => (
                <div key={h.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900">
                      Level: {h.assessed_level} &bull; <span className="text-indigo-600">{h.status}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {new Date(h.evaluated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Evaluator: {h.evaluated_by_name}</div>
                  {h.comments && <p className="text-slate-700 mt-1 italic">"{h.comments}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Define Competency Modal */}
      {showCreateCompetencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white">
              <h2 className="text-sm font-semibold text-slate-900">Define Competency Standard</h2>
              <button
                onClick={() => setShowCreateCompetencyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompetency} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CMP-SEC-02"
                    value={competencyForm.code}
                    onChange={(e) => setCompetencyForm({ ...competencyForm, code: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={competencyForm.category}
                    onChange={(e) => setCompetencyForm({ ...competencyForm, category: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Competency Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Threat Modeling & Defensive System Architecture"
                  value={competencyForm.name}
                  onChange={(e) => setCompetencyForm({ ...competencyForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Baseline Target Level
                </label>
                <select
                  value={competencyForm.target_level}
                  onChange={(e) => setCompetencyForm({ ...competencyForm, target_level: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="BASIC">Level 1: Basic Awareness</option>
                  <option value="INTERMEDIATE">Level 2: Working Knowledge</option>
                  <option value="ADVANCED">Level 3: Proficient</option>
                  <option value="EXPERT">Level 4: Expert Mastery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Competency Description & Indicators
                </label>
                <textarea
                  rows={3}
                  placeholder="Behavioral expectations, key competencies, and demonstration criteria..."
                  value={competencyForm.description}
                  onChange={(e) => setCompetencyForm({ ...competencyForm, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Associate Courses */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associate Course Curricula ({competencyForm.associated_courses.length} linked)
                </label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2 bg-slate-50/50">
                  {courses.length === 0 ? (
                    <span className="text-xs text-slate-400">No courses available.</span>
                  ) : (
                    courses.map((c) => {
                      const isChecked = competencyForm.associated_courses.includes(c.id)
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourseSelect(c.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-mono font-medium">{c.code}</span>
                          <span>&mdash;</span>
                          <span>{c.title}</span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Associate Training Programs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associate Cohort Training Programs ({competencyForm.associated_programs.length} linked)
                </label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2 bg-slate-50/50">
                  {trainingPrograms.length === 0 ? (
                    <span className="text-xs text-slate-400">No programs available.</span>
                  ) : (
                    trainingPrograms.map((p) => {
                      const isChecked = competencyForm.associated_programs.includes(p.id)
                      return (
                        <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProgramSelect(p.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-mono font-medium">{p.code}</span>
                          <span>&mdash;</span>
                          <span>{p.title}</span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCompetencyModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Define Competency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-900">New Competency Category</h2>
              <button
                onClick={() => setShowCreateCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence & Data"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Scope of competencies covered..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign to Employee Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-900">Assign Competency to Employee</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignForm.employee_id}
                  onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user_details?.first_name} {emp.user_details?.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Competency Standard <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignForm.competency_id}
                  onChange={(e) => setAssignForm({ ...assignForm, competency_id: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">-- Choose Competency --</option>
                  {competencies.map((cmp) => (
                    <option key={cmp.id} value={cmp.id}>
                      {cmp.code}: {cmp.name} (Target: {cmp.target_level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Level</label>
                  <select
                    value={assignForm.current_level}
                    onChange={(e) => setAssignForm({ ...assignForm, current_level: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="BASIC">Level 1: Basic Awareness</option>
                    <option value="INTERMEDIATE">Level 2: Working Knowledge</option>
                    <option value="ADVANCED">Level 3: Proficient</option>
                    <option value="EXPERT">Level 4: Expert Mastery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={assignForm.status}
                    onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Development goals or reasons for assignment..."
                  value={assignForm.evaluation_notes}
                  onChange={(e) => setAssignForm({ ...assignForm, evaluation_notes: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Competency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
