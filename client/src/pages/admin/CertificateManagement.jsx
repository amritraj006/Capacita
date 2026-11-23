import React, { useEffect, useState } from 'react'
import {
  Award, Search, Shield, ShieldOff, Loader2, AlertCircle,
  RefreshCw, X, CheckCircle
} from 'lucide-react'
import { certificatesApi } from '../../api/certificates'
import { enrollmentsApi } from '../../api/enrollments'

function StatusBadge({ status }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle size={11} /> Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
      <ShieldOff size={11} /> Revoked
    </span>
  )
}

export function CertificateManagement() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Generate modal state
  const [showGenModal, setShowGenModal] = useState(false)
  const [enrollments, setEnrollments] = useState([])
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState(null)
  const [genSuccess, setGenSuccess] = useState(null)

  // Revoke state
  const [revokeLoading, setRevokeLoading] = useState(null)

  const fetchCertificates = () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (statusFilter) params.status = statusFilter
    certificatesApi.getCertificates(params)
      .then(data => {
        setCertificates(Array.isArray(data) ? data : (data.results || []))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load certificates.')
        setLoading(false)
      })
  }

  useEffect(() => { fetchCertificates() }, [statusFilter])

  const openGenModal = () => {
    setShowGenModal(true)
    setGenError(null)
    setGenSuccess(null)
    setSelectedEnrollment('')
    setEnrollLoading(true)
    // Fetch completed enrollments
    enrollmentsApi.getEnrollments({ status: 'COMPLETED' })
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results || [])
        setEnrollments(list)
        setEnrollLoading(false)
      })
      .catch(() => { setEnrollments([]); setEnrollLoading(false) })
  }

  const handleGenerate = () => {
    if (!selectedEnrollment) return
    setGenLoading(true)
    setGenError(null)
    setGenSuccess(null)
    certificatesApi.generateCertificate(selectedEnrollment)
      .then(result => {
        setGenSuccess(result.detail || 'Certificate generated successfully!')
        setGenLoading(false)
        fetchCertificates()
      })
      .catch(err => {
        setGenError(err.message || 'Failed to generate certificate.')
        setGenLoading(false)
      })
  }

  const handleRevoke = (id) => {
    if (!window.confirm('Revoke this certificate? This action cannot be undone.')) return
    setRevokeLoading(id)
    certificatesApi.revokeCertificate(id)
      .then(() => {
        setCertificates(prev => prev.map(c => c.id === id ? { ...c, status: 'REVOKED' } : c))
        setRevokeLoading(null)
      })
      .catch(err => {
        alert(err.message || 'Failed to revoke certificate.')
        setRevokeLoading(null)
      })
  }

  const filtered = certificates.filter(c => {
    const q = search.toLowerCase()
    return (
      c.certificate_number?.toLowerCase().includes(q) ||
      c.employee_details?.first_name?.toLowerCase().includes(q) ||
      c.employee_details?.last_name?.toLowerCase().includes(q) ||
      c.employee_details?.employee_id?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.verification_code?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Certificate Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Issue and manage institutional completion certificates</p>
        </div>
        <button
          onClick={openGenModal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Award size={15} /> Generate Certificate
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Search by name, ID, cert number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <button
          onClick={fetchCertificates}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-sm text-red-600">
            <AlertCircle size={16} /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-sm text-slate-400">
            <Award size={32} className="mx-auto mb-3 text-slate-200" />
            {search || statusFilter ? 'No certificates match your filters.' : 'No certificates have been issued yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Employee</th>
                  <th className="text-left px-5 py-3">Certificate #</th>
                  <th className="text-left px-5 py-3">Title</th>
                  <th className="text-left px-5 py-3">Verification Code</th>
                  <th className="text-left px-5 py-3">Issued</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">
                        {cert.employee_details?.first_name} {cert.employee_details?.last_name}
                      </div>
                      <div className="text-xs text-slate-400">{cert.employee_details?.employee_id}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-700">{cert.certificate_number}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 max-w-xs truncate">{cert.title}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {cert.verification_code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(cert.issued_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={cert.status} />
                    </td>
                    <td className="px-5 py-3">
                      {cert.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleRevoke(cert.id)}
                          disabled={revokeLoading === cert.id}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {revokeLoading === cert.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Generate Certificate</h2>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                Select a completed enrollment. Only enrollments with status <strong>Completed</strong> are eligible.
              </p>

              {enrollLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 size={16} className="animate-spin" /> Loading completed enrollments...
                </div>
              ) : (
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={selectedEnrollment}
                  onChange={e => setSelectedEnrollment(e.target.value)}
                >
                  <option value="">Select enrollment...</option>
                  {enrollments.map(enr => (
                    <option key={enr.id} value={enr.id}>
                      {enr.employee_details?.employee_id || enr.employee} —{' '}
                      {enr.course_title || enr.training_program_title || `Enrollment #${enr.id}`}
                    </option>
                  ))}
                </select>
              )}

              {genError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={14} /> {genError}
                </div>
              )}
              {genSuccess && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                  <CheckCircle size={14} /> {genSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowGenModal(false)}
                  className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!selectedEnrollment || genLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50"
                >
                  {genLoading ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
