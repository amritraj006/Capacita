import React, { useState, useEffect } from 'react'
import {
  XCircle,
  RefreshCw,
  Trash2,
  LogOut,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Send
} from 'lucide-react'
import { authApi } from '../../api/auth'
import { departmentsApi } from '../../api/departments'
import { Button } from '../../design-system/Button'
import { Input } from '../../design-system/Input'
import { ConfirmDialog } from '../../design-system/ConfirmDialog'

export function TrainerRejectedPage({ onLogout, onRefresh }) {
  const [application, setApplication] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [reapplyMode, setReapplyMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department_id: '',
    qualifications: '',
    experience: '',
    skills: '',
    introduction: '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [appData, deptData] = await Promise.all([
        authApi.getMyTrainerApplication(),
        departmentsApi.getDepartments().catch(() => []),
      ])
      setApplication(appData)
      setDepartments(Array.isArray(deptData) ? deptData : deptData.results || [])

      const nameParts = (appData.applicant_name || '').split(' ')
      setFormData({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        phone: appData.applicant_phone || '',
        department_id: appData.department || '',
        qualifications: appData.qualifications || '',
        experience: appData.experience || '',
        skills: appData.skills || '',
        introduction: appData.introduction || '',
      })
    } catch (err) {
      setError(err.message || 'Unable to load application details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReapplySubmit = async (e) => {
    e.preventDefault()
    if (!formData.qualifications.trim() || !formData.experience.trim() || !formData.skills.trim() || !formData.introduction.trim()) {
      setError('Please complete all required application fields.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await authApi.reapplyTrainer({
        ...formData,
        department_id: formData.department_id || null,
      })
      if (onRefresh) {
        await onRefresh()
      }
    } catch (err) {
      setError(err.message || 'Failed to resubmit application.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError(null)
    try {
      await authApi.deleteTrainerAccount()
      if (onLogout) {
        onLogout()
      }
    } catch (err) {
      setError(err.message || 'Failed to delete account.')
      setDeleteDialogOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-xs text-slate-500 font-medium">Loading application status...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        {!reapplyMode ? (
          <>
            {/* Status Header */}
            <div className="text-center space-y-2 pb-6 border-b border-slate-100">
              <div className="inline-flex h-14 w-14 rounded-2xl bg-red-50 text-red-600 items-center justify-center mb-2 border border-red-200/70">
                <XCircle className="h-7 w-7" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 tracking-wide uppercase">
                Application Status: Not Approved
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Your Trainer Application Was Rejected
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                An administrator reviewed your trainer application and provided the feedback below. You may update your credentials and submit your application again, or delete your account.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Admin Rejection Reason */}
            <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-1.5">
              <div className="flex items-center gap-2 text-red-800 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Rejection Reason from Administrator</span>
              </div>
              <p className="text-sm text-red-900 whitespace-pre-wrap leading-relaxed">
                {application?.rejection_reason || 'No specific reason provided.'}
              </p>
            </div>

            {/* Two Required Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                className="w-full"
                leftIcon={RefreshCw}
                onClick={() => {
                  setError(null)
                  setReapplyMode(true)
                }}
              >
                Submit Application Again
              </Button>

              <Button
                variant="danger"
                className="w-full"
                leftIcon={Trash2}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete My Account
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </>
        ) : (
          /* Reapply Form Pre-filled */
          <form onSubmit={handleReapplySubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Resubmit Trainer Application</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your qualifications and details below. Your previous submission history will be preserved.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReapplyMode(false)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
              <Input
                label="Last Name"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone (Optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Department
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Qualifications <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                placeholder="Degrees, certifications, credentials..."
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Professional Experience <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                placeholder="Years of experience, industry roles, training background..."
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Relevant Skills <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Core competencies, technologies, instructional domains..."
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Short Introduction <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.introduction}
                onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                placeholder="Brief summary of your teaching style and goals..."
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" type="button" onClick={() => setReapplyMode(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={submitting} leftIcon={Send}>
                Submit Updated Application
              </Button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Account Permanently"
        description="Are you sure you want to permanently delete your account and trainer application? This action cannot be undone."
        confirmLabel="Delete My Account"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
