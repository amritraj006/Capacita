import React, { useState, useEffect } from 'react'
import {
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Edit2,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { employeesApi } from '../../api/employees'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../design-system/Button'
import { Input } from '../../design-system/Input'
import { Badge } from '../../design-system/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../design-system/Card'
import { Modal } from '../../design-system/Modal'
import { Skeleton } from '../../design-system/Skeleton'
import { Toast } from '../../design-system/Toast'

export function EmployeeProfileView() {
  const { user, refreshProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Edit fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const showToast = (type, title, message) => {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await employeesApi.getMyProfile()
      setProfile(data)
      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setPhone(data.phone || '')
    } catch (err) {
      console.warn('Employee profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const updated = await employeesApi.updateMyProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
      })
      setProfile(updated)
      await refreshProfile()
      showToast('success', 'Profile Updated', 'Personal profile details saved successfully.')
      setEditModalOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const initials = profile?.first_name
    ? `${profile.first_name[0]}${profile.last_name ? profile.last_name[0] : ''}`
    : user?.email?.slice(0, 2).toUpperCase() || 'EM'

  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user?.email
    : user?.email

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Employee Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal identity, organizational unit alignment, and contact information.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={Edit2}
          onClick={() => setEditModalOpen(true)}
        >
          Edit Profile Information
        </Button>
      </div>

      {loading ? (
        <div className="p-8 bg-white rounded-xl border border-slate-200 space-y-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity Card */}
          <Card className="lg:col-span-1 p-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm mb-4">
              {initials}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{profile?.designation || 'Staff Member'}</p>

            <div className="mt-3 flex items-center gap-2">
              <Badge variant="primary" size="sm">
                {profile?.role || user?.role}
              </Badge>
              <Badge variant={profile?.is_active ? 'success' : 'danger'} size="sm" dot>
                {profile?.is_active ? 'Active Status' : 'Inactive'}
              </Badge>
            </div>

            <div className="w-full mt-6 pt-6 border-t border-slate-100 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Employee ID:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {profile?.employee_id || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {profile?.email || user?.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Contact:</span>
                <span className="text-slate-800">{profile?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Joined Date:</span>
                <span className="text-slate-800">
                  {profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {/* Department & Organizational Alignment */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Organizational Department & Alignment</CardTitle>
              <CardDescription>
                Unit assignment, organizational code, and reporting structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-600" />
                    <h4 className="text-sm font-semibold text-slate-900">
                      {profile?.department_name || 'Department Unassigned'}
                    </h4>
                  </div>
                  {profile?.department_code && (
                    <Badge variant="neutral" size="sm">
                      Unit Code: {profile.department_code}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Employees within this department are mapped to relevant capacity building tracks,
                  compliance assessments, and departmental training initiatives.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 block mb-1">Corporate Designation</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {profile?.designation || 'Specialist'}
                  </span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-400 block mb-1">Account Permissions</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Learner Portal Authorized
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Personal Information"
        description="Update your contact phone and name information."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdate} loading={submitting}>
              Save Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <Input
            label="Contact Phone"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
            ℹ️ <strong>Note:</strong> Corporate email, employee ID, and department assignments are governed by System Administrators.
          </div>
        </form>
      </Modal>
    </div>
  )
}
