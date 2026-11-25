import React, { useState, useEffect } from 'react'
import {
  UserCog,
  Plus,
  Search,
  Edit2,
  Power,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Users
} from 'lucide-react'
import { usersApi } from '../../api/users'
import { Button } from '../../design-system/Button'
import { Input } from '../../design-system/Input'
import { Badge } from '../../design-system/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../../design-system/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../design-system/Table'
import { Modal } from '../../design-system/Modal'
import { ConfirmDialog } from '../../design-system/ConfirmDialog'
import { TableRowSkeleton } from '../../design-system/Skeleton'
import { EmptyState } from '../../design-system/EmptyState'
import { Toast } from '../../design-system/Toast'

export function TrainerManagement() {
  const [activeRoleTab, setActiveRoleTab] = useState('TRAINER') // 'TRAINER' or 'ADMIN'
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false)
  const [targetUser, setTargetUser] = useState(null)

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    role: 'TRAINER',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const showToast = (type, title, message) => {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getUsers({
        role: activeRoleTab,
        search,
        is_active: statusFilter,
        approved_only: activeRoleTab === 'TRAINER',
      })
      setUsersList(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      showToast('error', 'Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [activeRoleTab, search, statusFilter])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      role: activeRoleTab,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email) return

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingUser) {
        const payload = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        }
        if (formData.password) payload.password = formData.password
        await usersApi.updateUser(editingUser.id, payload)
        showToast('success', 'Updated', `${formData.role === 'ADMIN' ? 'Administrator' : 'Trainer'} ${formData.email} updated.`)
      } else {
        await usersApi.createUser({
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: activeRoleTab,
          password: formData.password || (activeRoleTab === 'ADMIN' ? 'CapacitaAdmin@2026' : 'CapacitaTrainer@2026'),
        })
        showToast('success', 'Created', `${activeRoleTab === 'ADMIN' ? 'Administrator' : 'Trainer'} account ${formData.email} created successfully.`)
      }
      setModalOpen(false)
      fetchUsers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!targetUser) return
    try {
      const res = await usersApi.toggleStatus(targetUser.id)
      showToast('info', 'Status Updated', res.detail)
      setConfirmToggleOpen(false)
      fetchUsers()
    } catch (err) {
      showToast('error', 'Action Restricted', err.message)
      setConfirmToggleOpen(false)
    }
  }

  const isTrainerTab = activeRoleTab === 'TRAINER'

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-slate-800" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Staff & Account Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage authorized Trainer and Administrator accounts with role-based access.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenCreate}>
          {isTrainerTab ? 'Add Trainer' : 'Add Administrator'}
        </Button>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveRoleTab('TRAINER')
            setSearch('')
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
            isTrainerTab
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Trainers & Faculty</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveRoleTab('ADMIN')
            setSearch('')
          }}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
            !isTrainerTab
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System Administrators</span>
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>{isTrainerTab ? 'Trainer Accounts' : 'Administrator Accounts'}</CardTitle>
            <CardDescription>
              {usersList.length} {isTrainerTab ? 'trainer' : 'administrator'} account(s) registered
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                {isTrainerTab && <TableHead>Assigned Cohorts</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={isTrainerTab ? 6 : 5} />
                ))
              ) : usersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isTrainerTab ? 6 : 5} className="py-12">
                    <EmptyState
                      icon={isTrainerTab ? GraduationCap : ShieldCheck}
                      title={`No ${isTrainerTab ? 'Trainers' : 'Administrators'} Found`}
                      description={
                        search
                          ? 'No accounts matching your search filters.'
                          : `Get started by clicking 'Add ${isTrainerTab ? 'Trainer' : 'Administrator'}'.`
                      }
                      actionLabel={`Add ${isTrainerTab ? 'Trainer' : 'Administrator'}`}
                      onAction={handleOpenCreate}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                usersList.map((usr) => (
                  <TableRow key={usr.id}>
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-900 block text-xs">
                          {usr.first_name || usr.last_name
                            ? `${usr.first_name} ${usr.last_name}`
                            : 'Unnamed Account'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {usr.email}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={usr.role === 'ADMIN' ? 'primary' : 'secondary'}>
                        {usr.role === 'ADMIN' ? 'Administrator' : 'Trainer'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-slate-600">
                        {usr.phone || <span className="text-slate-400">&mdash;</span>}
                      </span>
                    </TableCell>

                    {isTrainerTab && (
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                          <span>{usr.assigned_programs_count || 0} Programs</span>
                        </span>
                      </TableCell>
                    )}

                    <TableCell>
                      <Badge variant={usr.is_active ? 'success' : 'neutral'}>
                        {usr.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(usr)}
                          title="Edit Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTargetUser(usr)
                            setConfirmToggleOpen(true)
                          }}
                          className={usr.is_active ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}
                          title={usr.is_active ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingUser
            ? `Edit ${editingUser.role === 'ADMIN' ? 'Administrator' : 'Trainer'}`
            : `Add New ${activeRoleTab === 'ADMIN' ? 'Administrator' : 'Trainer'}`
        }
        description={`Configure account credentials and role assignments for ${activeRoleTab === 'ADMIN' ? 'administrative system control' : 'training instruction'}.`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="e.g. Robert"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              placeholder="e.g. Vance"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            disabled={!!editingUser}
            placeholder="user@organization.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            helperText={editingUser ? 'Email address cannot be modified after creation.' : undefined}
          />

          <Input
            label="Phone (Optional)"
            placeholder="+1 555-0199"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label={editingUser ? 'Reset Password (Optional)' : 'Initial Password'}
            type="password"
            placeholder={editingUser ? 'Leave blank to preserve current' : 'At least 8 characters'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-800 block">Designated Role:</span>
            <span>
              {activeRoleTab === 'ADMIN'
                ? 'Administrator — Full platform access, user management, and configuration.'
                : 'Trainer — Instruction, cohort management, and assessment evaluations.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingUser ? 'Save Changes' : `Create ${activeRoleTab === 'ADMIN' ? 'Administrator' : 'Trainer'}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deactivate / Activate Dialog */}
      <ConfirmDialog
        isOpen={confirmToggleOpen}
        onClose={() => setConfirmToggleOpen(false)}
        title={targetUser?.is_active ? 'Deactivate Account' : 'Activate Account'}
        description={
          targetUser?.is_active
            ? `Are you sure you want to deactivate ${targetUser?.email}? The user will no longer be able to log in.`
            : `Activate ${targetUser?.email}? The user will regain access to their portal workspace.`
        }
        confirmLabel={targetUser?.is_active ? 'Deactivate' : 'Activate'}
        variant={targetUser?.is_active ? 'danger' : 'primary'}
        onConfirm={handleToggleStatus}
      />
    </div>
  )
}
