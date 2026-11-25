import React, { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
} from 'lucide-react'
import { departmentsApi } from '../../api/departments'
import { Button } from '../../design-system/Button'
import { Input } from '../../design-system/Input'
import { Badge } from '../../design-system/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../../design-system/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../design-system/Table'
import { Modal } from '../../design-system/Modal'
import { TableRowSkeleton } from '../../design-system/Skeleton'
import { EmptyState } from '../../design-system/EmptyState'
import { Toast } from '../../design-system/Toast'

export function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [formData, setFormData] = useState({ name: '', code: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // View Employees Modal
  const [membersDept, setMembersDept] = useState(null)
  const [membersList, setMembersList] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const showToast = (type, title, message) => {
    setToast({ type, title, message })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const data = await departmentsApi.getDepartments({ search })
      setDepartments(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      showToast('error', 'Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDepartments()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleOpenCreate = () => {
    setEditingDept(null)
    setFormData({ name: '', code: '', description: '' })
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (dept) => {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.code) return

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingDept) {
        await departmentsApi.updateDepartment(editingDept.id, formData)
        showToast('success', 'Updated', `Department ${formData.code} updated.`)
      } else {
        await departmentsApi.createDepartment(formData)
        showToast('success', 'Created', `Department ${formData.code} created successfully.`)
      }
      setModalOpen(false)
      fetchDepartments()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewMembers = async (dept) => {
    setMembersDept(dept)
    setLoadingMembers(true)
    try {
      const emps = await departmentsApi.getDepartmentEmployees(dept.id)
      setMembersList(Array.isArray(emps) ? emps : emps.results || [])
    } catch (err) {
      showToast('error', 'Error', err.message)
      setMembersList([])
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return
    try {
      await departmentsApi.deleteDepartment(dept.id)
      showToast('success', 'Deleted', `Department ${dept.name} deleted.`)
      fetchDepartments()
    } catch (err) {
      showToast('error', 'Cannot Delete', err.message)
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
            <Building2 className="h-6 w-6 text-slate-800" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Department Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize business units, divisions, and manage employee organizational assignments.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenCreate}>
          Add Department
        </Button>
      </div>

      {/* Department Directory Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Organizational Departments</CardTitle>
            <CardDescription>
              {departments.length} departments currently registered in the database
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
            />
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow hover={false}>
              <TableHead>Code</TableHead>
              <TableHead>Department Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Active Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} columns={6} />)
            ) : departments.length === 0 ? (
              <TableRow hover={false}>
                <TableCell colSpan={6} className="text-center py-8">
                  <EmptyState
                    title="No departments found"
                    description="No organizational departments match your search query."
                    actionLabel="Add Department"
                    onAction={handleOpenCreate}
                  />
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <span className="font-mono text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-800">
                      {dept.code}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {dept.name}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-slate-500">
                    {dept.description || 'No description provided.'}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleViewMembers(dept)}
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:underline font-medium"
                    >
                      <Users className="h-3.5 w-3.5 text-indigo-500" />
                      {dept.employees_count} employees
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={dept.is_active ? 'success' : 'neutral'} dot>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={Edit2}
                        onClick={() => handleOpenEdit(dept)}
                      >
                        Edit
                      </Button>
                      <button
                        title="Delete Department"
                        onClick={() => handleDeleteDept(dept)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <CardFooter>
          <span className="text-xs text-slate-500">
            Total registered: {departments.length} departments
          </span>
          <Button variant="outline" size="sm" onClick={fetchDepartments}>
            ↻ Refresh
          </Button>
        </CardFooter>
      </Card>

      {/* Create / Edit Department Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create New Department'}
        description="Configure organizational unit details and assignment identifiers."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Input
                label="Code *"
                required
                placeholder="e.g. ENG"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Department Name *"
                required
                placeholder="e.g. Software Engineering"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description & Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Outline unit responsibilities and scope..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400"
            />
          </div>
        </form>
      </Modal>

      {/* Department Employees Modal */}
      <Modal
        isOpen={!!membersDept}
        onClose={() => setMembersDept(null)}
        title={`Employees in ${membersDept?.name || ''}`}
        description="List of employees currently assigned to this department."
        footer={
          <Button variant="secondary" onClick={() => setMembersDept(null)}>
            Close
          </Button>
        }
      >
        {loadingMembers ? (
          <p className="text-xs text-slate-400 py-4 text-center">Loading employees...</p>
        ) : membersList.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No employees assigned to this department.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {membersList.map((emp) => (
              <div key={emp.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900">
                    {emp.first_name} {emp.last_name} <span className="font-mono text-slate-400">({emp.employee_id})</span>
                  </p>
                  <p className="text-slate-500">{emp.email} &bull; {emp.designation}</p>
                </div>
                <Badge variant={emp.is_active ? 'success' : 'danger'} size="sm">
                  {emp.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
