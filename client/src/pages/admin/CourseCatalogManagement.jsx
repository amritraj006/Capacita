import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  FilePlus,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { coursesApi } from '../../api/courses'

export function CourseCatalogManagement() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('ALL')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddModuleModal, setShowAddModuleModal] = useState(false)
  const [selectedCourseForModule, setSelectedCourseForModule] = useState(null)
  const [expandedCourseId, setExpandedCourseId] = useState(null)

  // Form states
  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    description: '',
    category: 'Software Engineering',
    level: 'BEGINNER',
  })

  const [moduleForm, setModuleForm] = useState({
    title: '',
    content_type: 'TEXT',
    content_data: '',
    order: 1,
  })

  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  const loadCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await coursesApi.getCourses()
      setCourses(Array.isArray(res) ? res : res.results || [])
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    setModalError(null)
    try {
      setSubmitting(true)
      await coursesApi.createCourse(courseForm)
      setShowCreateModal(false)
      setCourseForm({ code: '', title: '', description: '', category: 'Software Engineering', level: 'BEGINNER' })
      loadCourses()
    } catch (err) {
      setModalError(err.message || 'Failed to create course.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddModule = async (e) => {
    e.preventDefault()
    if (!selectedCourseForModule) return
    setModalError(null)
    try {
      setSubmitting(true)
      await coursesApi.addModule(selectedCourseForModule.id, moduleForm)
      setShowAddModuleModal(false)
      setModuleForm({ title: '', content_type: 'TEXT', content_data: '', order: 1 })
      loadCourses()
    } catch (err) {
      setModalError(err.message || 'Failed to add module.')
    } finally {
      setSubmitting(false)
    }
  }

  const openAddModuleModal = (course) => {
    setSelectedCourseForModule(course)
    const nextOrder = (course.modules?.length || 0) + 1
    setModuleForm({ title: '', content_type: 'TEXT', content_data: '', order: nextOrder })
    setModalError(null)
    setShowAddModuleModal(true)
  }

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course and all its modules?')) return
    try {
      await coursesApi.deleteCourse(id)
      setCourses((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete course.')
    }
  }

  const filteredCourses = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchLevel = levelFilter === 'ALL' || c.level === levelFilter
    return matchSearch && matchLevel
  })

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Curriculum Management</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Course Catalog & Modular Curriculum
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create and maintain institutional courses, structure learning modules, and configure learning content.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadCourses}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                setModalError(null)
                setShowCreateModal(true)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Course</span>
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
            placeholder="Search by course code, title, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-slate-700"
          >
            <option value="ALL">All Proficiency Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Courses List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading course catalog...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Courses Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No courses matching the criteria. Click "Create Course" to add a new curriculum.
            </p>
          </div>
        ) : (
          filteredCourses.map((c) => {
            const isExpanded = expandedCourseId === c.id
            const modules = c.modules || []

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider font-mono">
                        {c.code}
                      </span>
                      <span className="text-xs text-slate-300">&bull;</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {c.category}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                        {c.level}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Archived'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500 max-w-3xl line-clamp-2">{c.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openAddModuleModal(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>Add Module</span>
                    </button>

                    <button
                      onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{modules.length} Modules</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Modules List */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 p-5 space-y-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Curriculum Modules Breakdown ({modules.length})
                      </span>
                    </div>

                    {modules.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No modules created yet for this course. Click "Add Module" to start structuring learning material.
                      </p>
                    ) : (
                      modules.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white border border-slate-200/80 rounded-lg p-3 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                              {m.order}
                            </span>
                            <div>
                              <span className="font-semibold text-slate-900 block">{m.title}</span>
                              <span className="text-[11px] text-slate-400 capitalize">
                                Type: {m.content_type.toLowerCase()}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono max-w-xs truncate">
                            {m.content_data.substring(0, 60)}...
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-900">Create New Course</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CS-201"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Level</label>
                  <select
                    value={courseForm.level}
                    onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Cloud Architectures"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineering"
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of course curriculum and learning outcomes..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                  {submitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showAddModuleModal && selectedCourseForModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Add Learning Module</h2>
                <span className="text-[11px] text-slate-500 font-mono">{selectedCourseForModule.code}</span>
              </div>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddModule} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Module Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Module 1: Introduction to Zero Trust"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Content Type</label>
                  <select
                    value={moduleForm.content_type}
                    onChange={(e) => setModuleForm({ ...moduleForm, content_type: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="TEXT">Text Content</option>
                    <option value="VIDEO">Video Stream URL</option>
                    <option value="DOCUMENT">Document / Guide</option>
                    <option value="LINK">External Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sequence Order</label>
                  <input
                    type="number"
                    min="1"
                    value={moduleForm.order}
                    onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Content Data / URL / Text Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    moduleForm.content_type === 'VIDEO'
                      ? 'https://example.com/stream.mp4'
                      : 'Instructional text or documentation content...'
                  }
                  value={moduleForm.content_data}
                  onChange={(e) => setModuleForm({ ...moduleForm, content_data: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
