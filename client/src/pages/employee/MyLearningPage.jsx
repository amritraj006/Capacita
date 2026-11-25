import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Clock,
  PlayCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  X,
  Sparkles,
  RefreshCw,
  Download
} from 'lucide-react'
import { enrollmentsApi } from '../../api/enrollments'

export function MyLearningPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ enrolled_courses: [], enrolled_programs: [] })
  const [activeTab, setActiveTab] = useState('courses')
  const [error, setError] = useState(null)

  // Module Viewer Modal State
  const [activeEnrollment, setActiveEnrollment] = useState(null)
  const [modules, setModules] = useState([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [togglingModuleId, setTogglingModuleId] = useState(null)
  const [launchingCourseId, setLaunchingCourseId] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await enrollmentsApi.getMyLearning()
      setData(res)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to load your learning activities.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Open modules viewer modal
  const openModuleViewer = async (enrollment) => {
    setActiveEnrollment(enrollment)
    setActiveModuleIndex(0)
    setLoadingModules(true)
    try {
      const moduleList = await enrollmentsApi.getEnrollmentModules(enrollment.id)
      setModules(moduleList.modules || (Array.isArray(moduleList) ? moduleList : []))
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingModules(false)
    }
  }

  // Open course from within a training program
  const handleOpenProgramCourse = async (programEnrollmentId, courseId) => {
    try {
      setLaunchingCourseId(courseId)
      const courseEnrollment = await enrollmentsApi.openProgramCourse(programEnrollmentId, courseId)
      await openModuleViewer(courseEnrollment)
      // Background reload to update counts
      loadData()
    } catch (err) {
      alert(err.message || 'Unable to open course materials.')
    } finally {
      setLaunchingCourseId(null)
    }
  }

  // Toggle completion
  const handleToggleModule = async (moduleId) => {
    if (!activeEnrollment) return
    setTogglingModuleId(moduleId)
    try {
      const result = await enrollmentsApi.toggleModuleCompletion(activeEnrollment.id, moduleId)
      
      // Update active enrollment in local state
      setActiveEnrollment((prev) => ({
        ...prev,
        progress_percentage: result.progress_percentage,
        completed_modules: result.completed_modules,
        status: result.status,
      }))

      // Update modules list
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? { ...m, is_completed: result.module_completed, completed_at: result.module_completed ? new Date().toISOString() : null }
            : m
        )
      )

      // Update parent data list
      setData((prev) => ({
        ...prev,
        enrolled_courses: prev.enrolled_courses.map((item) =>
          item.id === activeEnrollment.id
            ? {
                ...item,
                progress_percentage: result.progress_percentage,
                completed_modules: result.completed_modules,
                status: result.status,
              }
            : item
        ),
      }))
    } catch (err) {
      alert(err.message || 'Error updating module completion.')
    } finally {
      setTogglingModuleId(null)
    }
  }

  const courses = data.enrolled_courses || []
  const programs = data.enrolled_programs || []

  const totalAssigned = courses.length + programs.length
  const completedCount =
    courses.filter((c) => c.status === 'COMPLETED').length +
    programs.filter((p) => p.status === 'COMPLETED').length
  const inProgressCount =
    courses.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'ENROLLED').length +
    programs.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'ENROLLED').length

  const currentModule = modules[activeModuleIndex]

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Learner Workspace</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              My Learning Activities
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Access your enrolled courses and training programs, study materials, and complete learning modules.
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

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50/70 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Enrolled Activities</span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{totalAssigned}</p>
            <span className="text-[11px] text-slate-400">Courses & Programs</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Active / In Progress</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-semibold text-amber-900 mt-2">{inProgressCount}</p>
            <span className="text-[11px] text-amber-600/80">Pending completion</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">{completedCount}</p>
            <span className="text-[11px] text-emerald-600/80">Completed courses & programs</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('courses')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Assigned Courses ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('programs')}
          className={`pb-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
            activeTab === 'programs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Training Programs ({programs.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'courses' ? (
        courses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Enrolled Courses Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You are currently not enrolled in any individual courses. Check your Training Programs tab or contact your administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((enrollment) => {
              const course = enrollment.course_details || {}
              const pct = enrollment.progress_percentage || 0
              const isCompleted = enrollment.status === 'COMPLETED'

              return (
                <div
                  key={enrollment.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {course.code || 'COURSE'}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {course.title || 'Untitled Course'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {course.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {course.category || 'General'}
                      </span>
                      {course.duration_hours && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {course.duration_hours} hrs
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                      <span className="font-medium">
                        {enrollment.completed_modules || 0} of {enrollment.total_modules || 0} Modules Completed
                      </span>
                      <span className="font-semibold text-slate-900">{pct}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <button
                      onClick={() => openModuleViewer(enrollment)}
                      className="mt-4 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shadow-xs"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Access Course Modules</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : programs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Scheduled Training Programs</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You are not enrolled in any training programs at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((enrollment) => {
            const prog = enrollment.program_details || {}
            return (
              <div
                key={enrollment.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 transition shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {prog.code || 'PROGRAM'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {prog.status || 'Ongoing'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                        {enrollment.enrollment_type || 'Mandatory'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">{prog.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">{prog.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">Enrolled Date</span>
                    <span className="text-xs font-medium text-slate-700">
                      {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {prog.start_date ? new Date(prog.start_date).toLocaleDateString() : 'TBD'} &mdash;{' '}
                      {prog.end_date ? new Date(prog.end_date).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Trainer: {prog.lead_trainer_name || 'Assigned Instructor'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{prog.location_or_link || 'Capacita Learning Portal'}</span>
                  </div>
                </div>

                {prog.courses && prog.courses.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-2">
                      Included Courses in Program ({prog.courses.length}) &mdash; Click to Study
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {prog.courses.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-900 block leading-tight">
                                {c.code}: {c.title}
                              </span>
                              {c.duration_hours && (
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
                                  Duration: {c.duration_hours} hrs
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenProgramCourse(enrollment.id, c.id)}
                            disabled={launchingCourseId === c.id}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition shadow-xs disabled:opacity-50"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>{launchingCourseId === c.id ? 'Loading Modules...' : 'Study Course'}</span>
                          </button>
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

      {/* Interactive Module Viewer Modal */}
      {activeEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600">
                    {activeEnrollment.course_details?.code}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {activeEnrollment.course_details?.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>
                    Progress: {activeEnrollment.completed_modules || 0} / {activeEnrollment.total_modules || 0} completed
                  </span>
                  <span className="font-semibold text-indigo-700">
                    ({activeEnrollment.progress_percentage || 0}%)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveEnrollment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Split view (Module list sidebar + Module content viewer) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Modules Sidebar */}
              <div className="w-full md:w-72 border-r border-slate-200 bg-slate-50/40 p-3 overflow-y-auto space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                  Course Modules ({modules.length})
                </span>
                {loadingModules ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading modules...</div>
                ) : modules.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No modules in this course.</div>
                ) : (
                  modules.map((m, idx) => {
                    const isActive = idx === activeModuleIndex
                    return (
                      <button
                        key={m.id}
                        onClick={() => setActiveModuleIndex(idx)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition flex items-start justify-between gap-2 ${
                          isActive
                            ? 'bg-indigo-50/90 text-indigo-900 border border-indigo-200'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {m.content_type === 'VIDEO' ? (
                            <PlayCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          ) : m.content_type === 'DOCUMENT' ? (
                            <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="block leading-tight text-slate-800 line-clamp-2">
                              {m.title}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {m.content_type ? m.content_type.toLowerCase() : 'text'}
                            </span>
                          </div>
                        </div>

                        {m.is_completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 mt-0.5" />
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Module Content Area */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
                {currentModule ? (
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                          Module {currentModule.order} &bull; {currentModule.content_type}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                          {currentModule.title}
                        </h3>
                      </div>

                      <button
                        onClick={() => handleToggleModule(currentModule.id)}
                        disabled={togglingModuleId === currentModule.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border shadow-xs ${
                          currentModule.is_completed
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {currentModule.is_completed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed &mdash; Unmark</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark as Complete</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Content View */}
                    <div className="mt-5 space-y-4">
                      {/* Attached Document / File */}
                      {currentModule.file_url && (
                        <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                            <div>
                              <span className="text-xs font-semibold text-slate-900 block">Attached Course Document / Material</span>
                              <span className="text-[11px] text-slate-500">Download or preview learning material</span>
                            </div>
                          </div>
                          <a
                            href={currentModule.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Open / Download</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        </div>
                      )}

                      {currentModule.content_type === 'VIDEO' ? (
                        <div className="space-y-3">
                          <div className="aspect-video w-full rounded-lg bg-slate-950 overflow-hidden flex items-center justify-center">
                            <video
                              controls
                              className="w-full h-full"
                              src={currentModule.content_data}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                          <p className="text-xs text-slate-500">
                            Streaming source: <span className="font-mono text-slate-600">{currentModule.content_data}</span>
                          </p>
                        </div>
                      ) : currentModule.content_type === 'LINK' || (currentModule.content_data && currentModule.content_data.trim().startsWith('http')) ? (
                        <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                          <p className="font-medium text-slate-900 text-sm">External Learning Resource</p>
                          <p className="text-xs text-slate-600">Access the designated online material or reference guide at the link below:</p>
                          <a
                            href={currentModule.content_data.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition shadow-xs"
                          >
                            <span>Visit Resource URL</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-3">
                          <p className="font-medium text-slate-900 text-sm">Learning Material & Content Guide</p>
                          <div className="whitespace-pre-wrap">{currentModule.content_data || 'No written text provided for this module.'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Select a module to view instructional content.
                  </div>
                )}

                {/* Navigation Between Modules */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    disabled={activeModuleIndex <= 0}
                    onClick={() => setActiveModuleIndex((prev) => prev - 1)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous Module
                  </button>

                  <button
                    disabled={activeModuleIndex >= modules.length - 1}
                    onClick={() => setActiveModuleIndex((prev) => prev + 1)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-40"
                  >
                    Next Module
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
