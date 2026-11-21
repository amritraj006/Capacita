import React, { useState, useEffect } from 'react'
import { Users, Search, Building2, Mail, Phone, Calendar } from 'lucide-react'
import { employeesApi } from '../../api/employees'
import { departmentsApi } from '../../api/departments'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../../design-system/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../design-system/Table'
import { Badge } from '../../design-system/Badge'
import { Button } from '../../design-system/Button'
import { TableRowSkeleton } from '../../design-system/Skeleton'
import { EmptyState } from '../../design-system/EmptyState'

export function TrainerLearnerDirectory() {
  const [learners, setLearners] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')

  const fetchLearners = async () => {
    try {
      setLoading(true)
      const data = await employeesApi.getEmployees({
        search,
        department: selectedDept,
        is_active: 'true',
      })
      setLearners(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      console.warn('Trainer learner directory fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    departmentsApi.getDepartments().then((data) => {
      setDepartments(Array.isArray(data) ? data : data.results || [])
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLearners()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedDept])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Cohort Trainees & Learners
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active organizational trainees available for course enrollments and cohort assignments.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Active Learner Directory</CardTitle>
            <CardDescription>
              Showing {learners.length} active organizational employees
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search trainees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>

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
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow hover={false}>
              <TableHead>Employee ID</TableHead>
              <TableHead>Learner Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)
            ) : learners.length === 0 ? (
              <TableRow hover={false}>
                <TableCell colSpan={5} className="text-center py-8">
                  <EmptyState
                    title="No trainees found"
                    description="No active trainees match your search or department filter."
                  />
                </TableCell>
              </TableRow>
            ) : (
              learners.map((emp) => {
                const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email
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
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{fullName}</p>
                          <p className="text-[11px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">
                        {emp.department_name || 'Unassigned'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700 font-medium">
                      {emp.designation}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" size="sm" dot>Active</Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <CardFooter>
          <span className="text-xs text-slate-500">
            Total verified trainees: {learners.length}
          </span>
          <Button variant="outline" size="sm" onClick={fetchLearners}>
            ↻ Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
