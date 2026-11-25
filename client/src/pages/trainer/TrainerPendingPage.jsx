import React, { useState, useEffect } from 'react'
import { Clock, RefreshCw, LogOut, CheckCircle2, FileText, User, Mail, Phone, Building2 } from 'lucide-react'
import { authApi } from '../../api/auth'

export function TrainerPendingPage({ onLogout, onRefresh }) {
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchApplication = async () => {
    try {
      setRefreshing(true)
      const data = await authApi.getMyTrainerApplication()
      setApplication(data)
      if (data.status === 'APPROVED' && onRefresh) {
        onRefresh()
      }
    } catch (err) {
      console.warn('Error fetching application status:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchApplication()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {/* Status Header */}
        <div className="text-center space-y-2 pb-6 border-b border-slate-100">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 items-center justify-center mb-2 border border-amber-200/70 shadow-xs">
            <Clock className="h-7 w-7 animate-pulse" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 tracking-wide uppercase">
            Application Under Administrative Review
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Thank you for applying to Capacita
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Your instructor application has been submitted and is waiting for review by our administrators. Once approved, you will automatically gain access to your Trainer Dashboard and instructional cohorts.
          </p>
        </div>

        {/* Application Summary */}
        {application && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Application Summary
            </h2>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900">{application.applicant_name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-800">{application.applicant_email}</span>
                </div>
                {application.applicant_phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{application.applicant_phone}</span>
                  </div>
                )}
                {application.department_name && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{application.department_name}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Qualifications & Credentials:</span>
                <p className="text-slate-600 whitespace-pre-wrap">{application.qualifications || 'Not provided'}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Professional Experience:</span>
                <p className="text-slate-600 whitespace-pre-wrap">{application.experience || 'Not provided'}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Relevant Skills & Domains:</span>
                <p className="text-slate-600 whitespace-pre-wrap">{application.skills || 'Not provided'}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-0.5">Introduction:</span>
                <p className="text-slate-600 whitespace-pre-wrap">{application.introduction || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={fetchApplication}
            disabled={refreshing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Check Application Status
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
