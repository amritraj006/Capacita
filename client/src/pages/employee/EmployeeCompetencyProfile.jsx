import React, { useState, useEffect } from 'react'
import {
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronRight,
  RefreshCw,
  History,
  X,
  Target,
  ShieldCheck
} from 'lucide-react'
import { competenciesApi } from '../../api/competencies'

export function EmployeeCompetencyProfile() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ summary: {}, records: [] })
  const [error, setError] = useState(null)
  const [selectedAuditLog, setSelectedAuditLog] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await competenciesApi.getMyCompetencies()
      setData(res)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load your competency profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const records = data.records || []
  const summary = data.summary || {
    total_tracked: records.length,
    verified: records.filter((r) => r.status === 'VERIFIED').length,
    pending_review: records.filter((r) => r.status === 'PENDING_REVIEW').length,
    needs_improvement: records.filter((r) => r.status === 'NEEDS_IMPROVEMENT').length,
  }

  const getLevelNumber = (levelStr) => {
    switch (levelStr) {
      case 'BASIC':
        return 1
      case 'INTERMEDIATE':
        return 2
      case 'ADVANCED':
        return 3
      case 'EXPERT':
        return 4
      default:
        return 1
    }
  }

  const getLevelTitle = (levelStr) => {
    switch (levelStr) {
      case 'BASIC':
        return 'Level 1: Basic Awareness'
      case 'INTERMEDIATE':
        return 'Level 2: Working Knowledge'
      case 'ADVANCED':
        return 'Level 3: Proficient'
      case 'EXPERT':
        return 'Level 4: Expert Mastery'
      default:
        return levelStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Professional Capacity Profile</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              My Competencies & Skill Matrix
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track your evaluated competencies, target proficiency benchmarks, and verified professional development milestones.
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
            <span className="text-xs font-medium text-slate-500">Tracked Competencies</span>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{summary.total_tracked || 0}</p>
            <span className="text-[11px] text-slate-400">Institutional standards</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-emerald-700">Verified Competencies</span>
            <p className="text-2xl font-semibold text-emerald-900 mt-2">{summary.verified || 0}</p>
            <span className="text-[11px] text-emerald-600/80">Evaluated & confirmed</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-amber-700">Under Review</span>
            <p className="text-2xl font-semibold text-amber-900 mt-2">{summary.pending_review || 0}</p>
            <span className="text-[11px] text-amber-600/80">Awaiting faculty assessment</span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-lg p-4">
            <span className="text-xs font-medium text-indigo-700">Target Gap Identified</span>
            <p className="text-2xl font-semibold text-indigo-900 mt-2">{summary.needs_improvement || 0}</p>
            <span className="text-[11px] text-indigo-600/80">Curriculum recommended</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Competency Records List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No Competency Records Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You do not currently have any assigned competency standards. Your department head or administrator will configure your capacity track.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((r) => {
            const cmp = r.competency_details || {}
            const currentLevelNum = getLevelNumber(r.current_level)
            const targetLevelNum = getLevelNumber(cmp.target_level)
            const isVerified = r.status === 'VERIFIED'
            const meetsOrExceeds = currentLevelNum >= targetLevelNum
            const coursesList = cmp.associated_courses_details || []
            const progsList = cmp.associated_programs_details || []

            return (
              <div
                key={r.id}
                className="bg-white border border-slate-200/90 rounded-xl p-5 hover:border-slate-300 transition shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider">
                        {cmp.code}
                      </span>
                      <span className="text-xs text-slate-300">&bull;</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {cmp.category_name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'NEEDS_IMPROVEMENT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isVerified && <CheckCircle2 className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900">{cmp.name}</h3>
                    <p className="text-xs text-slate-500 max-w-3xl">{cmp.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Current:</span>
                      <span className="font-bold text-slate-900">{getLevelTitle(r.current_level)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Target Benchmark: <span className="font-semibold text-indigo-600">{getLevelTitle(cmp.target_level)}</span>
                    </div>
                  </div>
                </div>

                {/* Level Stepper Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-4 gap-2 mb-2 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <span className={currentLevelNum >= 1 ? 'text-indigo-600 font-bold' : ''}>
                      1. Basic
                    </span>
                    <span className={currentLevelNum >= 2 ? 'text-indigo-600 font-bold' : ''}>
                      2. Working
                    </span>
                    <span className={currentLevelNum >= 3 ? 'text-indigo-600 font-bold' : ''}>
                      3. Proficient
                    </span>
                    <span className={currentLevelNum >= 4 ? 'text-indigo-600 font-bold' : ''}>
                      4. Expert
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                    {[1, 2, 3, 4].map((step) => {
                      const isReached = currentLevelNum >= step
                      const isTarget = targetLevelNum === step
                      return (
                        <div
                          key={step}
                          className={`h-full rounded-sm transition-all duration-300 ${
                            isReached
                              ? isVerified
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600'
                              : isTarget
                              ? 'bg-amber-200 border-b border-amber-400'
                              : 'bg-slate-200/70'
                          }`}
                          title={`Level ${step}`}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Evaluation Notes & Evaluator */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    {r.evaluated_by_name ? (
                      <div className="text-slate-700">
                        <span className="font-medium text-slate-900">Evaluated by:</span> {r.evaluated_by_name}{' '}
                        {r.evaluated_at && (
                          <span className="text-slate-400">
                            on {new Date(r.evaluated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">No formal evaluation logged yet.</div>
                    )}
                    {r.evaluation_notes && (
                      <p className="text-slate-500 italic">
                        "{r.evaluation_notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.evaluation_history && r.evaluation_history.length > 0 && (
                      <button
                        onClick={() => setSelectedAuditLog(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
                      >
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>Development Milestones ({r.evaluation_history.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Associated Learning Tracks */}
                {(coursesList.length > 0 || progsList.length > 0) && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Accredited Curricula for Level Progression
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {coursesList.map((c) => (
                        <div
                          key={c.id}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-800 flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                          <span>
                            {c.code}: {c.title}
                          </span>
                        </div>
                      ))}
                      {progsList.map((p) => (
                        <div
                          key={p.id}
                          className="px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-100 text-xs font-medium text-amber-800 flex items-center gap-1.5"
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {p.code}: {p.title}
                          </span>
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

      {/* History Audit Modal */}
      {selectedAuditLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Evaluation Milestones & Audit Trail</h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedAuditLog.competency_details?.code}: {selectedAuditLog.competency_details?.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto space-y-3">
              {selectedAuditLog.evaluation_history.map((h) => (
                <div key={h.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900">
                      Assessed: {getLevelTitle(h.assessed_level)} &bull;{' '}
                      <span className="text-indigo-600 font-semibold">{h.status}</span>
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
    </div>
  )
}
