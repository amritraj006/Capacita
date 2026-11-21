import React, { useState } from 'react'
import {
  Users,
  Building2,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '../design-system/Button'
import { Input } from '../design-system/Input'
import { Badge } from '../design-system/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../design-system/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../design-system/Table'
import { Modal } from '../design-system/Modal'
import { ConfirmDialog } from '../design-system/ConfirmDialog'
import { Toast } from '../design-system/Toast'
import { Skeleton, CardSkeleton } from '../design-system/Skeleton'
import { EmptyState } from '../design-system/EmptyState'
import { ErrorState } from '../design-system/ErrorState'
import { RbacVerificationPanel } from '../components/RbacVerificationPanel'

export function DesignSystemShowcase({ activeRole, activeNavLabel }) {
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [demoInput, setDemoInput] = useState('')

  const showToast = (type, title, message) => {
    setToastMessage({ type, title, message })
    setTimeout(() => setToastMessage(null), 4000)
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <Toast
            type={toastMessage.type}
            title={toastMessage.title}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeNavLabel}
            </h1>
            <Badge variant="primary">Role: {activeRole}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise design system tokens, components, and role-based application views.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => showToast('info', 'Information', 'System data refreshed successfully.')}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setModalOpen(true)}
          >
            Create New
          </Button>
        </div>
      </div>

      {/* Real-time Server-Side RBAC Verification Panel */}
      <RbacVerificationPanel />

      {/* Role-Specific Dashboard Metrics */}
      {activeRole === 'ADMIN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Employees
              </span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">1,280</span>
              <span className="text-xs font-semibold text-emerald-600">+12 this month</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across 6 Organizational Departments</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Trainings
              </span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">24 Batches</span>
              <span className="text-xs font-semibold text-slate-500">8 In Progress</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">340 active enrollments this cycle</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Compliance Rate
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">94.8%</span>
              <span className="text-xs font-semibold text-emerald-600">Target: 90%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Mandatory regulatory courses</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Certificates Issued
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">892</span>
              <span className="text-xs font-semibold text-amber-600">Verified</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Directly accredited on platform</p>
          </Card>
        </div>
      )}

      {activeRole === 'TRAINER' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Batches</span>
            <div className="mt-2 text-2xl font-bold text-slate-900">4 Batches</div>
            <p className="text-[11px] text-slate-400 mt-1">2 Ongoing, 2 Upcoming</p>
          </Card>
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Trainees</span>
            <div className="mt-2 text-2xl font-bold text-slate-900">86 Employees</div>
            <p className="text-[11px] text-slate-400 mt-1">Active in current modules</p>
          </Card>
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Grading</span>
            <div className="mt-2 text-2xl font-bold text-amber-600">12 Submissions</div>
            <p className="text-[11px] text-slate-400 mt-1">Requires trainer evaluation</p>
          </Card>
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Session Attendance</span>
            <div className="mt-2 text-2xl font-bold text-emerald-600">96.2%</div>
            <p className="text-[11px] text-slate-400 mt-1">Last batch: Cloud Architecture</p>
          </Card>
        </div>
      )}

      {activeRole === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Courses</span>
            <div className="mt-2 text-2xl font-bold text-slate-900">3 Courses</div>
            <p className="text-[11px] text-slate-400 mt-1">2 Mandatory, 1 Elective</p>
          </Card>
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Progress</span>
            <div className="mt-2 text-2xl font-bold text-indigo-600">68%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '68%' }} />
            </div>
          </Card>
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Competency Level</span>
            <div className="mt-2 text-2xl font-bold text-slate-900">Level 3 (Proficient)</div>
            <p className="text-[11px] text-slate-400 mt-1">Database & API Engineering</p>
          </Card>
          <Card className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Earned Certificates</span>
            <div className="mt-2 text-2xl font-bold text-slate-900">2 Verified</div>
            <p className="text-[11px] text-slate-400 mt-1">Ready for download</p>
          </Card>
        </div>
      )}

      {/* Role-Specific Main Table / Content */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>
              {activeRole === 'ADMIN'
                ? 'Recent Enrollment Activity'
                : activeRole === 'TRAINER'
                ? 'Assigned Training Batches'
                : 'My Learning Program Milestones'}
            </CardTitle>
            <CardDescription>
              {activeRole === 'ADMIN'
                ? 'Real-time record of employee enrollments and capacity assignments'
                : activeRole === 'TRAINER'
                ? 'Cohorts currently scheduled under your instructional supervision'
                : 'Track upcoming session dates, completion criteria, and certifications'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter table..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
            <Button variant="secondary" size="sm" leftIcon={Filter}>
              Filter
            </Button>
          </div>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow hover={false}>
              <TableHead>Code & Name</TableHead>
              <TableHead>Department / Batch</TableHead>
              <TableHead>Assigned Trainer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    CS-101
                  </span>
                  <span>Full-Stack Web Development</span>
                </div>
              </TableCell>
              <TableCell>Software Engineering</TableCell>
              <TableCell>Prof. John Doe</TableCell>
              <TableCell>
                <Badge variant="success" dot>Active</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <span className="text-xs text-slate-500">85%</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showToast('info', 'Details', 'Viewing course records.')}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-semibold text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    DS-201
                  </span>
                  <span>Data Science & Analytics</span>
                </div>
              </TableCell>
              <TableCell>Business Intelligence</TableCell>
              <TableCell>Dr. Jane Smith</TableCell>
              <TableCell>
                <Badge variant="warning" dot>Pending Review</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '45%' }} />
                  </div>
                  <span className="text-xs text-slate-500">45%</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showToast('info', 'Details', 'Viewing course records.')}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-semibold text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    DO-301
                  </span>
                  <span>DevOps & Cloud Engineering</span>
                </div>
              </TableCell>
              <TableCell>Infrastructure Ops</TableCell>
              <TableCell>Capacita Faculty</TableCell>
              <TableCell>
                <Badge variant="primary" dot>Upcoming</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '10%' }} />
                  </div>
                  <span className="text-xs text-slate-500">10%</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showToast('info', 'Details', 'Viewing course records.')}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <CardFooter>
          <span className="text-xs text-slate-500">Showing 3 of 24 records</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </CardFooter>
      </Card>

      {/* ========================================================= */}
      {/* Interactive Design System Primitives Showcase */}
      {/* ========================================================= */}
      <div className="pt-6 border-t border-slate-200 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Design System Component Primitives</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tested for enterprise consistency, accessibility, and high visual standards.
          </p>
        </div>

        {/* Buttons & Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Button Styles & Sizes</h3>
            <div className="flex flex-wrap gap-2.5 items-center">
              <Button variant="primary" size="sm">Primary Sm</Button>
              <Button variant="primary" size="md">Primary Md</Button>
              <Button variant="secondary" size="md">Secondary</Button>
              <Button variant="outline" size="md">Outline</Button>
              <Button variant="ghost" size="md">Ghost</Button>
              <Button variant="danger" size="md">Destructive</Button>
              <Button variant="primary" size="md" loading>Loading</Button>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Semantic Badges</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="neutral" dot>Neutral Badge</Badge>
              <Badge variant="success" dot>Success / Verified</Badge>
              <Badge variant="warning" dot>Pending Review</Badge>
              <Badge variant="danger" dot>Action Required</Badge>
              <Badge variant="info" dot>System Info</Badge>
              <Badge variant="primary" dot>Primary Track</Badge>
            </div>
          </Card>
        </div>

        {/* Form Inputs & Interactive Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Input & Form Controls</h3>
            <div className="space-y-3">
              <Input
                label="Standard Form Input"
                placeholder="Enter course name or employee ID"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                helperText="Subtle border, soft focus ring, accessible label."
              />
              <Input
                label="Input with Left Icon"
                leftIcon={Search}
                placeholder="Search across modules..."
              />
              <Input
                label="Validation Error State"
                error="This field is required by regulatory compliance rules."
                defaultValue="Invalid input value"
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Modals, Dialogs & Feedback</h3>
              <p className="text-xs text-slate-500 mt-1">
                Standard dialogs, destructive confirmation modals, and toast notifications.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button variant="secondary" onClick={() => setModalOpen(true)}>
                  Trigger Standard Modal
                </Button>
                <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                  Trigger Destructive Dialog
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showToast('success', 'Operation Succeeded', 'Employee record updated successfully in Neon DB.')}
                >
                  Test Success Toast
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showToast('error', 'Operation Failed', 'Database connection timed out. Please retry.')}
                >
                  Test Error Toast
                </Button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
              💡 <strong>Design rule:</strong> Destructive actions always require confirmation dialogs to prevent accidental state loss.
            </div>
          </Card>
        </div>

        {/* Skeletons, Empty & Error States */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loading Skeletons
            </h4>
            <CardSkeleton />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Empty State Pattern
            </h4>
            <EmptyState
              title="No courses enrolled"
              description="You have not been assigned to any learning paths yet."
              actionLabel="Browse Catalog"
              onAction={() => showToast('info', 'Catalog', 'Opening catalog browser...')}
            />
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Error State Pattern
            </h4>
            <ErrorState
              title="Failed to load telemetry"
              message="The progress service is currently unavailable. Please check your network connection."
              onRetry={() => showToast('info', 'Retry', 'Retrying request...')}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Interactive Modals */}
      {/* ========================================================= */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Learning Activity"
        description="Add a new course or schedule a training batch for your organization."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false)
                showToast('success', 'Created', 'New activity saved successfully.')
              }}
            >
              Save & Publish
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Activity Name" placeholder="e.g. Advanced Security Protocols" required />
          <Input label="Target Department" placeholder="e.g. Information Technology" />
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Description / Objectives
            </label>
            <textarea
              rows={3}
              placeholder="Outline the core capacity-building goals..."
              className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          showToast('error', 'Action Executed', 'Course record was permanently archived.')
        }}
        title="Archive Training Program"
        message="Are you sure you want to archive this training program? Enrolled trainees will no longer have access to ongoing modules."
        confirmText="Yes, Archive Program"
      />
    </div>
  )
}
