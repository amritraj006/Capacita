import React, { useState } from 'react'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Button } from '../design-system/Button'
import { Badge } from '../design-system/Badge'
import { ShieldCheck, ShieldAlert, Play, CheckCircle2, XCircle } from 'lucide-react'

export function RbacVerificationPanel() {
  const { user, role } = useAuth()
  const [testResults, setTestResults] = useState({})
  const [running, setRunning] = useState(false)

  const runAllTests = async () => {
    setRunning(true)
    const results = {}

    // Test Admin endpoint
    try {
      const res = await authApi.testAdminOnly()
      results.admin = res
    } catch (err) {
      results.admin = { ok: false, status: 500, data: { detail: err.message } }
    }

    // Test Trainer endpoint
    try {
      const res = await authApi.testTrainerOnly()
      results.trainer = res
    } catch (err) {
      results.trainer = { ok: false, status: 500, data: { detail: err.message } }
    }

    // Test Employee endpoint
    try {
      const res = await authApi.testEmployeeOnly()
      results.employee = res
    } catch (err) {
      results.employee = { ok: false, status: 500, data: { detail: err.message } }
    }

    setTestResults(results)
    setRunning(false)
  }

  const endpointList = [
    {
      id: 'admin',
      name: 'Administrator Endpoint',
      url: '/api/accounts/test/admin-only/',
      allowedFor: 'ADMIN only',
      shouldSucceed: role === 'ADMIN',
    },
    {
      id: 'trainer',
      name: 'Trainer Endpoint',
      url: '/api/accounts/test/trainer-only/',
      allowedFor: 'ADMIN & TRAINER',
      shouldSucceed: role === 'ADMIN' || role === 'TRAINER',
    },
    {
      id: 'employee',
      name: 'Employee / Authenticated Endpoint',
      url: '/api/accounts/test/employee-only/',
      allowedFor: 'ALL AUTHENTICATED USERS',
      shouldSucceed: true,
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Live Server-Side RBAC Enforcement Check
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tests actual Django REST API endpoints using your active JWT token to verify that 403 Forbidden is strictly enforced on the server.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Play}
          loading={running}
          onClick={runAllTests}
        >
          Execute Security Verification
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {endpointList.map((ep) => {
          const result = testResults[ep.id]
          return (
            <div
              key={ep.id}
              className={`p-4 rounded-xl border transition-all ${
                result
                  ? result.ok
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-red-50/40 border-red-200'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-800">{ep.name}</span>
                {result ? (
                  result.ok ? (
                    <Badge variant="success" dot>HTTP {result.status} Allowed</Badge>
                  ) : (
                    <Badge variant="danger" dot>HTTP {result.status} Blocked</Badge>
                  )
                ) : (
                  <Badge variant="neutral">Not tested</Badge>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-500 truncate mb-2">
                {ep.url}
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                <p>Rule: <strong>{ep.allowedFor}</strong></p>
                <p>
                  Expected for your role ({role}):{' '}
                  <strong className={ep.shouldSucceed ? 'text-emerald-700' : 'text-red-700'}>
                    {ep.shouldSucceed ? 'Should Pass (200)' : 'Should Be Blocked (403)'}
                  </strong>
                </p>
              </div>

              {result && (
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    {result.ok === ep.shouldSucceed ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Backend Enforced Correctly
                      </span>
                    ) : (
                      <span className="text-red-700 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                        Unexpected Response
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {result.data?.message || result.data?.detail || JSON.stringify(result.data)}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
