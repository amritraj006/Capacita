import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  Search,
  Filter,
  Plus,
  BookOpen,
  GraduationCap,
  Users,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  X,
  Clock,
  MoreVertical
} from 'lucide-react'
import { enrollmentsApi } from '../../api/enrollments'
import { employeesApi } from '../../api/employees'
import { coursesApi } from '../../api/courses'
import { trainingApi } from '../../api/training'

export function EnrollmentManagement() {
  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState([])
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Enroll Modal state
  const [showModal, setShowModal] = useState(false)
  const [employees, setEmployees] = useState([])
  const [courses, setCourses] = useState([])
  const [trainingPrograms, setTrainingPrograms] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    target_type: 'COURSE', // 'COURSE' or 'PROGRAM'
    course_id: '',
    program_id: '',
    enrollment_type: 'MANDATORY',
  })

  const loadEnrollments = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await enrollmentsApi.getEnrollments()
      const list = Array.isArray(res) ? res : res.results || []
      setEnrollments(list)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  const loadModalDependencies = async () => {
    try {
      const [empRes, courseRes, progRes] = await Promise.all([
        employeesApi.getEmployees(),
        coursesApi.getCourses(),
        trainingApi.getTrainingPrograms(),
      ])

      setEmployees(Array.isArray(empRes) ? empRes : empRes.results || [])
      setCourses(Array.isArray(courseRes) ? courseRes : courseRes.results || [])
      setTrainingPrograms(Array.isArray(progRes) ? progRes : progRes.results || [])
    } catch (err) {
      console.error('Error loading modal dependencies', err)
    }
  }

  useEffect(() => {
    loadEnrollments()
  }, [])

  const handleOpenModal = () => {
    setFormData({
      employee_id: '',
      target_type: 'COURSE',
      course_id: '',
      program_id: '',
      enrollment_type: 'MANDATORY',
    })
    setModalError(null)
    setShowModal(true)
    loadModalDependencies()
  }

  const handleEnrollSubmit = async (e) => {
    e.preventDefault()
    setModalError(null)

    if (!formData.employee_id) {
      setModalError('Please select an employee.')
      return
    }

    if (formData.target_type === 'COURSE' && !formData.course_id) {
      setModalError('Please select a course to enroll.')
      return
    }

    if (formData.target_type === 'PROGRAM' && !formData.program_id) {
      setModalError('Please select a training program.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        employee: parseInt(formData.employee_id),
        enrollment_type: formData.enrollment_type,
        course: formData.target_type === 'COURSE' ? parseInt(formData.course_id) : null,
        training_program: formData.target_type === 'PROGRAM' ? parseInt(formData.program_id) : null,
      }

      await enrollmentsApi.createEnrollment(payload)
      setShowModal(false)
      loadEnrollments()
    } catch (err) {
      setModalError(err.message || 'Failed to create enrollment. Ensure employee is not already actively enrolled.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEnrollment = async (id) => {
    if (!window.confirm('Are you sure you want to drop or delete this enrollment record?')) return
    try {
      await enrollmentsApi.deleteEnrollment(id)
      setEnrollments((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete enrollment.')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await enrollmentsApi.updateEnrollment(id, { status: newStatus })
      setEnrollments((prev) => prev.map((e) => (e.id === id ? { ...e, status: updated.status } : e)))
    } catch (err) {
      alert(err.message || 'Failed to update enrollment status.')
    }
  }

  const filteredEnrollments = enrollments.filter((e) => {
    const emp = e.employee_details || {}
    const empUser = emp.user_details || {}
    const nameMatch =
      `${empUser.first_name || ''} ${empUser.last_name || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (empUser.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.course_details?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.program_details?.title || '').toLowerCase().includes(searchTerm.toLowerCase())

    const statusMatch = statusFilter === 'ALL' || e.status === statusFilter
    const typeMatch = typeFilter === 'ALL' || e.enrollment_type === typeFilter
    return nameMatch && statusMatch && typeMatch
  })

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Institutional Enrollment Administration</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Enrollment & Trainee Allocation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Assign employees to accredited courses and cohorts, prevent duplicate active enrollments, and audit trainee status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEnrollments}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enroll Employee</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-4">
            <span className="text-xs font-medium text-slate-500">Total Enrollment Records</span>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{enrollments.length}</p>
            <span className="text-[11px] text-slate-400">Total registered</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-amber-700">In Progress / Active</span>
            <p className="text-2xl font-semibold text-amber-900 mt-2">
              {enrollments.filter((e) => e.status === 'IN_PROGRESS' || e.status === 'ENROLLED').length}
            </p>
            <span className="text-[11px] text-amber-600/80">Engaged learners</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-emerald-700">Completed Tracks</span>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">
              {enrollments.filter((e) => e.status === 'COMPLETED').length}
            </p>
            <span className="text-[11px] text-emerald-600/80">Certified outcomes</span>
          </div>

          <div className="bg-rose-50/50 border border-rose-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-rose-700">Dropped / Inactive</span>
            <p className="text-2xl font-semibold text-rose-900 mt-2">
              {enrollments.filter((e) => e.status === 'DROPPED').length}
            </p>
            <span className="text-[11px] text-rose-600/80">Withdrawn or superseded</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, email, ID, or course..."
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

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="ALL">All Enrollment Types</option>
            <option value="MANDATORY">Mandatory</option>
            <option value="VOLUNTARY">Voluntary</option>
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

      {/* Enrollments Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading enrollment records...</div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Enrollment Records Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no matching enrollments. Click "Enroll Employee" to allocate a learner.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Enrolled Track / Curriculum</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Progress Telemetry</th>
                  <th className="py-3 px-4">Status & Status Control</th>
                  <th className="py-3 px-4">Enrolled At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map((enr) => {
                  const emp = enr.employee_details || {}
                  const empUser = emp.user_details || {}
                  const targetTitle = enr.course_details
                    ? `${enr.course_details.code} - ${enr.course_details.title}`
                    : enr.program_details
                    ? `${enr.program_details.code} - ${enr.program_details.title}`
                    : 'Curriculum'
                  const pct = enr.progress_percentage || 0
                  const isCompleted = enr.status === 'COMPLETED'

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {empUser.first_name} {empUser.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {emp.employee_id} &bull; {emp.department_details?.name || 'Dept'}
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
                          {enr.course_details ? 'Individual Course' : 'Cohort Training Program'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            enr.enrollment_type === 'MANDATORY'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {enr.enrollment_type}
                        </span>
                      </td>

                      <td className="py-3 px-4 min-w-[160px]">
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
                        <select
                          value={enr.status}
                          onChange={(e) => handleStatusChange(enr.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        >
                          <option value="ENROLLED">ENROLLED</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="DROPPED">DROPPED</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(enr.enrolled_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteEnrollment(enr.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          title="Remove Enrollment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Enroll Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-900">Enroll Employee in Learning Track</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">-- Choose an employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user_details?.first_name} {emp.user_details?.last_name} ({emp.employee_id}) &mdash; {emp.department_details?.name || 'No Dept'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrollment Track Target <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target_type: 'COURSE', program_id: '' })}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      formData.target_type === 'COURSE'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Single Course</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target_type: 'PROGRAM', course_id: '' })}
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
                      formData.target_type === 'PROGRAM'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Training Program</span>
                  </button>
                </div>

                {formData.target_type === 'COURSE' ? (
                  <div>
                    <select
                      value={formData.course_id}
                      onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      required
                    >
                      <option value="">-- Choose course to enroll --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code}: {c.title} ({c.level || 'Beginner'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <select
                      value={formData.program_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      required
                    >
                      <option value="">-- Choose training cohort program --</option>
                      {trainingPrograms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code}: {p.title} ({p.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enrollment Type
                </label>
                <select
                  value={formData.enrollment_type}
                  onChange={(e) => setFormData({ ...formData, enrollment_type: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="MANDATORY">Mandatory (Compliance / Core Requirement)</option>
                  <option value="VOLUNTARY">Voluntary (Elective Professional Growth)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
