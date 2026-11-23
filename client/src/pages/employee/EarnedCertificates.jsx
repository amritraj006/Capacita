import React, { useEffect, useState, useRef } from 'react'
import { Award, Printer, Loader2, AlertCircle, CheckCircle, ShieldOff } from 'lucide-react'
import { certificatesApi } from '../../api/certificates'
import { useAuth } from '../../context/AuthContext'

function StatusBadge({ status }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle size={11} /> Verified
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
      <ShieldOff size={11} /> Revoked
    </span>
  )
}

function CertificatePrintView({ cert }) {
  return (
    <div className="certificate-print-view p-10 text-center border-4 border-slate-700 rounded-2xl max-w-2xl mx-auto font-serif">
      <div className="mb-6">
        <div className="text-2xl font-bold tracking-wide text-slate-900">CAPACITA</div>
        <div className="text-xs text-slate-400 tracking-widest uppercase mt-0.5">Digital Capacity Building Portal</div>
      </div>
      <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">Certificate of Completion</div>
      <div className="w-24 h-0.5 bg-slate-300 mx-auto mb-6" />
      <p className="text-sm text-slate-500 mb-2">This is to certify that</p>
      <p className="text-2xl font-bold text-slate-900 mb-2">
        {cert.employee_details?.first_name} {cert.employee_details?.last_name}
      </p>
      <p className="text-xs text-slate-400 mb-6">Employee ID: {cert.employee_details?.employee_id}</p>
      <p className="text-sm text-slate-600 mb-2">has successfully completed</p>
      <p className="text-lg font-semibold text-slate-800 mb-6">
        {cert.course_title || cert.program_title || 'Learning Programme'}
      </p>
      {cert.grade_score && (
        <p className="text-sm text-slate-500 mb-4">
          Grade Score: <span className="font-semibold text-slate-700">{cert.grade_score}%</span>
        </p>
      )}
      <div className="w-24 h-0.5 bg-slate-300 mx-auto mb-6" />
      <p className="text-xs text-slate-400 mb-1">
        Issued on {new Date(cert.issued_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <p className="text-xs text-slate-400 mb-4">
        {cert.issued_by_name && <>Issued by {cert.issued_by_name}</>}
      </p>
      <div className="bg-slate-50 rounded-lg px-4 py-2 inline-block">
        <span className="text-xs text-slate-400">Certificate No: </span>
        <span className="text-xs font-mono font-semibold text-slate-700">{cert.certificate_number}</span>
      </div>
      <div className="mt-2">
        <span className="text-xs text-slate-400">Verification Code: </span>
        <span className="text-xs font-mono font-semibold text-slate-700">{cert.verification_code}</span>
      </div>
    </div>
  )
}

export function EarnedCertificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [printCert, setPrintCert] = useState(null)
  const printRef = useRef(null)

  useEffect(() => {
    certificatesApi.getMyCertificates()
      .then(data => {
        setCertificates(Array.isArray(data) ? data : (data.results || []))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load certificates.')
        setLoading(false)
      })
  }, [])

  const handlePrint = (cert) => {
    setPrintCert(cert)
    setTimeout(() => window.print(), 300)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        <AlertCircle size={16} /> {error}
      </div>
    )
  }

  return (
    <>
      {/* Print-only view — hidden on screen, shown on print */}
      {printCert && (
        <div className="hidden print:block" ref={printRef}>
          <CertificatePrintView cert={printCert} />
        </div>
      )}

      <div className="print:hidden space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Earned Certificates</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your verified learning achievement certificates</p>
        </div>

        {certificates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
            <Award size={40} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-500 text-sm font-medium">No certificates earned yet</p>
            <p className="text-xs text-slate-400 mt-1">Complete a course or training programme to earn your first certificate.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                {/* Top bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-slate-700 to-slate-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <Award size={20} className="text-slate-500" />
                    </div>
                    <StatusBadge status={cert.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1">
                    {cert.course_title || cert.program_title || 'Learning Certificate'}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{cert.title}</p>

                  {cert.grade_score && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span className="text-xs text-slate-500">Score: <strong>{cert.grade_score}%</strong></span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-slate-400 mb-4">
                    <div>
                      <span className="font-medium text-slate-600">Issued: </span>
                      {new Date(cert.issued_at).toLocaleDateString('en-GB', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </div>
                    {cert.expiry_date && (
                      <div>
                        <span className="font-medium text-slate-600">Expires: </span>
                        {new Date(cert.expiry_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-600">Cert No: </span>
                      <span className="font-mono">{cert.certificate_number}</span>
                    </div>
                  </div>

                  {/* Verification code badge */}
                  <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Verification Code</p>
                      <p className="font-mono text-sm font-semibold text-slate-700 tracking-wider">
                        {cert.verification_code}
                      </p>
                    </div>
                    <Award size={16} className="text-slate-300" />
                  </div>

                  <button
                    onClick={() => handlePrint(cert)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Printer size={14} /> Print / Save as PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print\\:block { display: block !important; }
          .certificate-print-view { page-break-inside: avoid; }
        }
      `}</style>
    </>
  )
}
