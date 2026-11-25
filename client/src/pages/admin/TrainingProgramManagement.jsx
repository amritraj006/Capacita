import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Users,
  BookOpen,
  Trash2,
  Edit2,
  UserPlus,
  X,
  Ban,
  CheckCircle2,
} from 'lucide-react'
import { trainingApi } from '../../api/training'
import { coursesApi } from '../../api/courses'
import { usersApi } from '../../api/users'
import { employeesApi } from '../../api/employees'
import { departmentsApi } from '../../api/departments'

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SCHEDULED: 'Upcoming',
  IN_PROGRESS: 'Ongoing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export function TrainingProgramManagement() {
  const [programs, setPrograms] = useState([])
  const [courses, setCourses] = useState([])
  const [trainers, setTrainers] = useState([])
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Create / Edit Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Enroll Participants Modal
  const [enrollProgram, setEnrollProgram] = useState(null)
  const [enrollMode, setEnrollMode] = useState('EMPLOYEES') // EMPLOYEES | DEPARTMENT
  const [selectedEmpIds, setSelectedEmpIds] = useState([])
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [enrollResult, setEnrollResult] = useState(null)

  // View Participants Modal
  const [participantsProgram, setParticipantsProgram] = useState(null)
  const [participantsList, setParticipantsList] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)

  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    lead_trainer: '',
    status: 'SCHEDULED',
    start_date: '',
    end_date: '',
    location_or_link: '',
    target_audience: '',
    max_participants: 30,
    course_ids: [],
  })

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [progRes, courseRes, trainersRes, empRes, deptRes] = await Promise.all([
        trainingApi.getTrainingPrograms(),
        coursesApi.getCourses({ is_active: true }),
        usersApi.getUsers({ role: 'TRAINER', is_active: true, approved_only: true }).catch(() => []),
        employeesApi.getEmployees({ is_active: true }).catch(() => []),
        departmentsApi.getDepartments().catch(() => []),
      ])

      setPrograms(Array.isArray(progRes) ? progRes : progRes.results || [])
      setCourses(Array.isArray(courseRes) ? courseRes : courseRes.results || [])
      setTrainers(Array.isArray(trainersRes) ? trainersRes : trainersRes.results || [])
      setEmployees(Array.isArray(empRes) ? empRes : empRes.results || [])
      setDepartments(Array.isArray(deptRes) ? deptRes : deptRes.results || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load training programs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateModal = () => {
    setEditingProgram(null)
    setForm({
      code: '',
      title: '',
      description: '',
      lead_trainer: '',
      status: 'SCHEDULED',
      start_date: '',
      end_date: '',
      location_or_link: '',
      target_audience: '',
      max_participants: 30,
      course_ids: [],
    })
    setModalError(null)
    setShowCreateModal(true)
  }

  const openEditModal = (prog) => {
    setEditingProgram(prog)
    setForm({
      code: prog.code,
      title: prog.title,
      description: prog.description || '',
      lead_trainer: prog.lead_trainer ? String(prog.lead_trainer) : '',
      status: prog.status || 'SCHEDULED',
      start_date: prog.start_date || '',
      end_date: prog.end_date || '',
      location_or_link: prog.location_or_link || '',
      target_audience: prog.target_audience || '',
      max_participants: prog.max_participants || 30,
      course_ids: (prog.courses_details || []).map((c) => c.id),
    })
    setModalError(null)
    setShowCreateModal(true)
  }

  const handleSaveProgram = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!form.code || !form.title) {
      setModalError('Code and Title are required.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        code: form.code,
        title: form.title,
        description: form.description,
        status: form.status,
        lead_trainer: form.lead_trainer ? parseInt(form.lead_trainer) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        location_or_link: form.location_or_link,
        target_audience: form.target_audience,
        max_participants: parseInt(form.max_participants) || 30,
        courses: form.course_ids,
      }

      if (editingProgram) {
        await trainingApi.updateTrainingProgram(editingProgram.id, payload)
      } else {
        await trainingApi.createTrainingProgram(payload)
      }
      setShowCreateModal(false)
      setEditingProgram(null)
      loadData()
    } catch (err) {
      setModalError(err.message || 'Failed to save training program.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickStatus = async (prog, newStatus) => {
    try {
      await trainingApi.updateTrainingProgram(prog.id, { status: newStatus })
      loadData()
    } catch (err) {
      alert(err.message || 'Failed to update status')
    }
  }

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training program?')) return
    try {
      await trainingApi.deleteTrainingProgram(id)
      setPrograms((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete training program.')
    }
  }

  const toggleCourseSelection = (courseId) => {
    setForm((prev) => {
      const exists = prev.course_ids.includes(courseId)
      return {
        ...prev,
        course_ids: exists ? prev.course_ids.filter((id) => id !== courseId) : [...prev.course_ids, courseId],
      }
    })
  }

  const openEnrollModal = (prog) => {
    setEnrollProgram(prog)
    setEnrollMode('EMPLOYEES')
    setSelectedEmpIds([])
    setSelectedDeptId('')
    setEnrollResult(null)
    setModalError(null)
  }

  const handleBulkEnroll = async (e) => {
    e.preventDefault()
    if (!enrollProgram) return
    setModalError(null)
    setEnrollResult(null)
    try {
      setSubmitting(true)
      const payload =
        enrollMode === 'DEPARTMENT'
          ? { department_id: parseInt(selectedDeptId) }
          : { employee_ids: selectedEmpIds }
      const res = await trainingApi.bulkEnroll(enrollProgram.id, payload)
      setEnrollResult(res.detail)
      loadData()
    } catch (err) {
      setModalError(err.message || 'Failed to enroll participants.')
    } finally {
      setSubmitting(false)
    }
  }

  const openParticipantsModal = async (prog) => {
    setParticipantsProgram(prog)
    setLoadingParticipants(true)
    try {
      const res = await trainingApi.getProgramEnrollments(prog.id)
      setParticipantsList(Array.isArray(res) ? res : res.results || [])
    } catch {
      setParticipantsList([])
    } finally {
      setLoadingParticipants(false)
    }
  }

  const filteredPrograms = programs.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.target_audience || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Training Program Operations</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Training Programs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create training programs, select courses, assign a trainer, set capacity, and enroll employees or departments.
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
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Program</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by program code, title, or audience..."
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
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Upcoming</option>
            <option value="IN_PROGRESS">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Program Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading training programs...
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Training Programs Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no training programs registered. Click "Create Program" to launch one.
            </p>
          </div>
        ) : (
          filteredPrograms.map((p) => {
            const coursesList = p.courses_details || []
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 transition shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                        {p.code}
                      </span>
                      <span className="text-xs text-slate-300">&bull;</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        p.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : p.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {p.enrolled_count || 0} / {p.max_participants} Enrolled ({p.completed_count || 0} Completed)
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-500 max-w-3xl">{p.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      onClick={() => openEnrollModal(p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Enroll</span>
                    </button>

                    <button
                      onClick={() => openParticipantsModal(p)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Participants</span>
                    </button>

                    <button
                      onClick={() => openEditModal(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {p.status === 'DRAFT' && (
                      <button
                        onClick={() => handleQuickStatus(p, 'SCHEDULED')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    )}

                    {p.status !== 'CANCELLED' && p.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleQuickStatus(p, 'CANCELLED')}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition"
                        title="Cancel Program"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteProgram(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {p.start_date ? new Date(p.start_date).toLocaleDateString() : 'TBD'} &mdash;{' '}
                      {p.end_date ? new Date(p.end_date).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Trainer: {p.lead_trainer_name || 'Unassigned'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.location_or_link || 'Online / Classroom'}</span>
                  </div>
                </div>

                {coursesList.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Included Courses ({coursesList.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {coursesList.map((c) => (
                        <div
                          key={c.id}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3 h-3 text-slate-400" />
                          <span>
                            {c.code}: {c.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Create / Edit Program Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-sm font-semibold text-slate-900">
                {editingProgram ? `Edit Program: ${editingProgram.code}` : 'Create Training Program'}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Program Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TRN-2026-01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="SCHEDULED">Upcoming (Auto by dates)</option>
                    <option value="IN_PROGRESS">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Program Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Security Training"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Program overview and objectives..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Trainer</label>
                  <select
                    value={form.lead_trainer}
                    onChange={(e) => setForm({ ...form, lead_trainer: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Choose Trainer --</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {`${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enrollment Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_participants}
                    onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location or Meeting Link</label>
                <input
                  type="text"
                  placeholder="e.g. Room 402 or Meeting URL"
                  value={form.location_or_link}
                  onChange={(e) => setForm({ ...form, location_or_link: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Course Selector Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Published Courses ({form.course_ids.length} selected)
                </label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto space-y-2 bg-slate-50/50">
                  {courses.length === 0 ? (
                    <span className="text-xs text-slate-400">No published courses available.</span>
                  ) : (
                    courses.map((c) => {
                      const isChecked = form.course_ids.includes(c.id)
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourseSelection(c.id)}
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

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProgram ? 'Save Changes' : 'Save Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Enroll Employees / Department Modal */}
      {enrollProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Enroll Participants</h2>
                <p className="text-[11px] text-slate-500">{enrollProgram.title}</p>
              </div>
              <button onClick={() => setEnrollProgram(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleBulkEnroll} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{modalError}</div>
              )}
              {enrollResult && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">{enrollResult}</div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnrollMode('EMPLOYEES')}
                  className={`py-2 text-xs font-medium rounded-lg border ${
                    enrollMode === 'EMPLOYEES' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Select Employees
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollMode('DEPARTMENT')}
                  className={`py-2 text-xs font-medium rounded-lg border ${
                    enrollMode === 'DEPARTMENT' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Entire Department
                </button>
              </div>

              {enrollMode === 'DEPARTMENT' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    required
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name} ({d.employees_count} employees)</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                  {employees.length === 0 ? (
                    <p className="text-xs text-slate-400">No active employees found.</p>
                  ) : (
                    employees.map((emp) => {
                      const checked = selectedEmpIds.includes(emp.id)
                      return (
                        <label key={emp.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedEmpIds((prev) =>
                                checked ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                              )
                            }
                          />
                          <span>{`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email}</span>
                          <span className="text-slate-400 font-mono">({emp.employee_id})</span>
                        </label>
                      )
                    })
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setEnrollProgram(null)} className="px-3 py-2 text-xs text-slate-600">
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || (enrollMode === 'EMPLOYEES' && selectedEmpIds.length === 0) || (enrollMode === 'DEPARTMENT' && !selectedDeptId)}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Enrolled Participants & Completion Modal */}
      {participantsProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Enrolled Participants</h2>
                <p className="text-[11px] text-slate-500">{participantsProgram.title}</p>
              </div>
              <button onClick={() => setParticipantsProgram(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto">
              {loadingParticipants ? (
                <p className="text-xs text-slate-400 text-center py-4">Loading participants...</p>
              ) : participantsList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No employees enrolled yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {participantsList.map((enr) => (
                    <div key={enr.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{enr.employee_details?.name}</p>
                        <p className="text-slate-500">
                          {enr.employee_details?.employee_id} &bull; {enr.employee_details?.department_name || 'Unassigned'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        enr.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {enr.status}
                      </span>
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
