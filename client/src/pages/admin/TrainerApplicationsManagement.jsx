import React, { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Building2,
  History,
  AlertCircle
} from 'lucide-react'
import { trainerApplicationsApi } from '../../api/trainerApplications'
import { Button } from '../../design-system/Button'
import { Badge } from '../../design-system/Badge'
import { Card, CardHeader, CardTitle, CardDescription } from '../../design-system/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../design-system/Table'
import { Modal } from '../../design-system/Modal'
import { TableRowSkeleton } from '../../design-system/Skeleton'
import { EmptyState } from '../../design-system/EmptyState'
import { Toast } from '../../design-system/Toast'

export function TrainerApplicationsManagement() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('PENDING') // 'PENDING', 'APPROVED', 'REJECTED', or ''
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  // Detail & Review Modal
  const [selectedApp, setSelectedApp] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [rejectingMode, setRejectingMode] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const showToast = (type, title, message) => {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const data = await trainerApplicationsApi.getApplications({
        status: statusFilter,
        search,
      })
      setApplications(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      showToast('error', 'Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications()
    }, 250)
    return () => clearTimeout(timer)
  }, [statusFilter, search])

  const openDetails = (app) => {
    setSelectedApp(app)
    setRejectingMode(false)
    setRejectionReason(app.rejection_reason || '')
    setActionError(null)
    setDetailModalOpen(true)
  }

  const handleApprove = async (app) => {
    setSubmitting(true)
    setActionError(null)
    try {
      const res = await trainerApplicationsApi.approveApplication(app.id)
      showToast('success', 'Approved', res.detail)
      setDetailModalOpen(false)
      fetchApplications()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!selectedApp) return
    if (!rejectionReason.trim()) {
      setActionError('Please provide a clear rejection reason.')
      return
    }
    setSubmitting(true)
    setActionError(null)
    try {
      const res = await trainerApplicationsApi.rejectApplication(selectedApp.id, rejectionReason.trim())
      showToast('info', 'Rejected', res.detail)
      setDetailModalOpen(false)
      fetchApplications()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'APPROVED') return <Badge variant="success">Approved</Badge>
    if (status === 'REJECTED') return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="warning">Pending Review</Badge>
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-slate-800" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Trainer Applications
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review instructor applications, verify qualifications, and approve or reject trainer access.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'PENDING', label: 'Pending', icon: Clock },
          { id: 'APPROVED', label: 'Approved', icon: CheckCircle2 },
          { id: 'REJECTED', label: 'Rejected', icon: XCircle },
          { id: '', label: 'All Applications', icon: ClipboardCheck },
        ].map((tab) => {
          const Icon = tab.icon
          const active = statusFilter === tab.id
          return (
            <button
              key={tab.id || 'all'}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>
              {statusFilter === 'PENDING'
                ? 'Pending Applications'
                : statusFilter === 'APPROVED'
                ? 'Approved Applications'
                : statusFilter === 'REJECTED'
                ? 'Rejected Applications'
                : 'All Trainer Applications'}
            </CardTitle>
            <CardDescription>
              {applications.length} application(s) found
            </CardDescription>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search applicant name, email, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Relevant Skills</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12">
                    <EmptyState
                      icon={ClipboardCheck}
                      title="No Applications Found"
                      description={
                        search
                          ? 'No trainer applications match your search criteria.'
                          : `There are currently no ${statusFilter ? statusFilter.toLowerCase() : ''} trainer applications.`
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-900 block text-xs">
                          {app.applicant_name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {app.applicant_email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-700">
                        {app.department_name || 'Unassigned'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 line-clamp-1 max-w-xs">
                        {app.skills || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={Eye}
                        onClick={() => openDetails(app)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Application Detail & Review Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Trainer Application Details"
        description={selectedApp ? `Reviewing application from ${selectedApp.applicant_name}` : ''}
      >
        {selectedApp && (
          <div className="space-y-4">
            {actionError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Applicant Overview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900">{selectedApp.applicant_name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{selectedApp.applicant_email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedApp.applicant_phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedApp.department_name || 'Unassigned'}</span>
              </div>
            </div>

            {/* Qualifications, Experience, Skills, Introduction */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-800 block mb-0.5">Qualifications</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap">
                  {selectedApp.qualifications || '—'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-800 block mb-0.5">Professional Experience</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap">
                  {selectedApp.experience || '—'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-800 block mb-0.5">Relevant Skills</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap">
                  {selectedApp.skills || '—'}
                </p>
              </div>
              <div>
                <span className="font-semibold text-slate-800 block mb-0.5">Short Introduction</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-wrap">
                  {selectedApp.introduction || '—'}
                </p>
              </div>
            </div>

            {/* Rejection Reason (if rejected) */}
            {selectedApp.status === 'REJECTED' && selectedApp.rejection_reason && !rejectingMode && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                <span className="font-semibold block mb-0.5">Recorded Rejection Reason:</span>
                <p className="whitespace-pre-wrap">{selectedApp.rejection_reason}</p>
              </div>
            )}

            {/* Previous Application History */}
            {selectedApp.history && selectedApp.history.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  <History className="w-3.5 h-3.5" />
                  <span>Previous Submissions ({selectedApp.history.length})</span>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {selectedApp.history.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Attempt #{idx + 1}
                      </span>
                      {item.reviewed_at && (
                        <span className="text-slate-400 ml-2">
                          Reviewed {new Date(item.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                      {item.rejection_reason && (
                        <p className="text-red-700 mt-1">Reason: {item.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection Input Form */}
            {rejectingMode ? (
              <form onSubmit={handleReject} className="space-y-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this application is being rejected (visible to applicant)..."
                    className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectingMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    loading={submitting}
                    leftIcon={XCircle}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>{getStatusBadge(selectedApp.status)}</div>
                <div className="flex items-center gap-2">
                  {selectedApp.status !== 'REJECTED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={XCircle}
                      onClick={() => setRejectingMode(true)}
                      disabled={submitting}
                    >
                      Reject
                    </Button>
                  )}
                  {selectedApp.status !== 'APPROVED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={CheckCircle2}
                      loading={submitting}
                      onClick={() => handleApprove(selectedApp)}
                    >
                      Approve Application
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
