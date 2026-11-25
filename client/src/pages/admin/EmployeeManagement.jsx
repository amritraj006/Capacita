import React, { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Search,
  Edit2,
  Power,
  Building2,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { employeesApi } from '../../api/employees'
import { departmentsApi } from '../../api/departments'
import { apiClient } from '../../api/client'
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

export function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState(null)

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false)
  const [targetEmployee, setTargetEmployee] = useState(null)

  // Learning History Modal
  const [historyEmp, setHistoryEmp] = useState(null)
  const [historyData, setHistoryData] = useState({ enrollments: [], certificates: [] })
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'EMPLOYEE',
    department_id: '',
    designation: '',
    phone: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const showToast = (type, title, message) => {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const data = await employeesApi.getEmployees({
        search,
        department: selectedDept,
        is_active: statusFilter,
      })
      setEmployees(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      showToast('error', 'Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartmentsList = async () => {
    try {
      const data = await departmentsApi.getDepartments()
      setDepartments(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.warn('Failed to load departments dropdown:', err)
    }
  }

  useEffect(() => {
    fetchDepartmentsList()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedDept, statusFilter])

  const handleOpenCreate = () => {
    setFormData({
      employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      email: '',
      first_name: '',
      last_name: '',
      role: 'EMPLOYEE',
      department_id: departments[0]?.id || '',
      designation: '',
      phone: '',
      password: 'CapacitaEmp@2026',
    })
    setFormError(null)
    setCreateModalOpen(true)
  }

  const handleOpenEdit = (emp) => {
    setTargetEmployee(emp)
    setFormData({
      employee_id: emp.employee_id,
      email: emp.email,
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      role: emp.role,
      department_id: emp.department_id || '',
      designation: emp.designation,
      phone: emp.phone || '',
    })
    setFormError(null)
    setEditModalOpen(true)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.designation) return

    setSubmitting(true)
    setFormError(null)

    try {
      await employeesApi.createEmployee(formData)
      showToast('success', 'Created', `Employee ${formData.employee_id} created successfully.`)
      setCreateModalOpen(false)
      fetchEmployees()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!formData.designation) return

    setSubmitting(true)
    setFormError(null)

    try {
      await employeesApi.updateEmployee(targetEmployee.id, {
        designation: formData.designation,
        department_id: formData.department_id,
        phone: formData.phone,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      })
      showToast('success', 'Updated', `Employee ${targetEmployee.employee_id} updated.`)
      setEditModalOpen(false)
      fetchEmployees()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!targetEmployee) return
    try {
      const res = await employeesApi.toggleStatus(targetEmployee.id)
      showToast('info', 'Status Updated', res.detail)
      setConfirmToggleOpen(false)
      fetchEmployees()
    } catch (err) {
      showToast('error', 'Error', err.message)
    }
  }

  const handleViewHistory = async (emp) => {
    setHistoryEmp(emp)
    setLoadingHistory(true)
    try {
      const [enrRes, certRes] = await Promise.all([
        apiClient(`/enrollments/?employee=${emp.id}`).then((r) => (r.ok ? r.json() : [])),
        apiClient(`/certificates/?employee=${emp.id}`).then((r) => (r.ok ? r.json() : [])),
      ])
      setHistoryData({
        enrollments: Array.isArray(enrRes) ? enrRes : enrRes.results || [],
        certificates: Array.isArray(certRes) ? certRes : certRes.results || [],
      })
    } catch {
      setHistoryData({ enrollments: [], certificates: [] })
    } finally {
      setLoadingHistory(false)
    }
  }

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-slate-800" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employee Directory & Accounts
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain organizational profiles, assign departments, and control account activation status.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenCreate}>
          Add Employee
        </Button>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Staff & Learner Directory</CardTitle>
            <CardDescription>
              Showing {employees.length} records matching current filters
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ID, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:bg-white"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow hover={false}>
              <TableHead>Employee ID</TableHead>
              <TableHead>Employee & Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
            ) : employees.length === 0 ? (
              <TableRow hover={false}>
                <TableCell colSpan={7} className="text-center py-8">
                  <EmptyState
                    title="No employees found"
                    description="No employee accounts match the selected filters or search parameters."
                    actionLabel="Add Employee"
                    onAction={handleOpenCreate}
                  />
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => {
                const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'No Name Provided'
                const initials = emp.first_name
                  ? `${emp.first_name[0]}${emp.last_name ? emp.last_name[0] : ''}`
                  : 'EM'
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-slate-800">
                        {emp.employee_id}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">{fullName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {emp.department_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {emp.department_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-800 font-medium">
                      {emp.designation}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          emp.role === 'ADMIN' ? 'primary' : emp.role === 'TRAINER' ? 'warning' : 'neutral'
                        }
                        size="sm"
                      >
                        {emp.role}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={emp.is_active ? 'success' : 'danger'} dot size="sm">
                        {emp.is_active ? 'Active' : 'Deactivated'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={BookOpen}
                          onClick={() => handleViewHistory(emp)}
                        >
                          History
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={Edit2}
                          onClick={() => handleOpenEdit(emp)}
                        >
                          Edit
                        </Button>
                        <button
                          title={emp.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                          onClick={() => {
                            setTargetEmployee(emp)
                            setConfirmToggleOpen(true)
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            emp.is_active
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <CardFooter>
          <span className="text-xs text-slate-500">
            Total active employees: {employees.filter((e) => e.is_active).length} of {employees.length}
          </span>
          <Button variant="outline" size="sm" onClick={fetchEmployees}>
            ↻ Refresh Directory
          </Button>
        </CardFooter>
      </Card>

      {/* CREATE EMPLOYEE MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Employee"
        description="Creates an employee record and activates their portal access credentials."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={submitting}>
              Create Employee Profile
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Employee ID *"
              required
              placeholder="e.g. EMP-1042"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Account Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              >
                <option value="EMPLOYEE">Employee / Learner</option>
                <option value="TRAINER">Trainer / Faculty</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="First name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <Input
            label="Work Email *"
            type="email"
            required
            placeholder="employee@capacita.org"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Designation / Title *"
              required
              placeholder="e.g. Systems Engineer"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Temporary Password"
              type="password"
              placeholder="Defaults to CapacitaEmp@2026"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* EDIT EMPLOYEE MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Profile: ${targetEmployee?.employee_id}`}
        description="Update employee organizational details, title, and contact information."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={submitting}>
              Save Updates
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Designation / Title *"
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Account Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
              >
                <option value="EMPLOYEE">Employee / Learner</option>
                <option value="TRAINER">Trainer / Faculty</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <Input
              label="Contact Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* CONFIRM TOGGLE STATUS DIALOG */}
      <ConfirmDialog
        isOpen={confirmToggleOpen}
        onClose={() => setConfirmToggleOpen(false)}
        onConfirm={handleToggleStatus}
        variant={targetEmployee?.is_active ? 'danger' : 'primary'}
        title={targetEmployee?.is_active ? 'Deactivate Employee' : 'Reactivate Employee'}
        message={
          targetEmployee?.is_active
            ? `Are you sure you want to deactivate ${targetEmployee.employee_id} (${targetEmployee.email})? They will immediately lose access to their portal account and ongoing courses.`
            : `Are you sure you want to reactivate ${targetEmployee?.employee_id} (${targetEmployee?.email})? They will regain access to their portal account.`
        }
        confirmText={targetEmployee?.is_active ? 'Yes, Deactivate' : 'Yes, Reactivate'}
      />

      {/* LEARNING HISTORY MODAL */}
      <Modal
        isOpen={!!historyEmp}
        onClose={() => setHistoryEmp(null)}
        title={`Learning History: ${historyEmp?.first_name || ''} ${historyEmp?.last_name || ''} (${historyEmp?.employee_id || ''})`}
        description="Enrolled courses, training programs, and earned certificates."
        footer={
          <Button variant="secondary" onClick={() => setHistoryEmp(null)}>
            Close
          </Button>
        }
      >
        {loadingHistory ? (
          <p className="text-xs text-slate-400 py-4 text-center">Loading learning history...</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto text-xs">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Enrollments ({historyData.enrollments.length})</h4>
              {historyData.enrollments.length === 0 ? (
                <p className="text-slate-400">No enrollments recorded.</p>
              ) : (
                <div className="space-y-2">
                  {historyData.enrollments.map((enr) => (
                    <div key={enr.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {enr.course_details?.title || enr.training_program_details?.title || 'Program'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Progress: {enr.progress_percentage || 0}% &bull; Enrolled {new Date(enr.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={enr.status === 'COMPLETED' ? 'success' : 'primary'} size="sm">
                        {enr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Certificates ({historyData.certificates.length})</h4>
              {historyData.certificates.length === 0 ? (
                <p className="text-slate-400">No certificates issued yet.</p>
              ) : (
                <div className="space-y-2">
                  {historyData.certificates.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{c.title}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{c.certificate_number}</p>
                      </div>
                      <Badge variant="success" size="sm">{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
