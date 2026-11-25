import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { AppShell } from './layouts/AppShell'

// Admin Views
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { TrainerApplicationsManagement } from './pages/admin/TrainerApplicationsManagement'
import { DepartmentManagement } from './pages/admin/DepartmentManagement'
import { EmployeeManagement } from './pages/admin/EmployeeManagement'
import { TrainerManagement } from './pages/admin/TrainerManagement'
import { CourseCatalogManagement } from './pages/admin/CourseCatalogManagement'
import { TrainingProgramManagement } from './pages/admin/TrainingProgramManagement'
import { EnrollmentManagement } from './pages/admin/EnrollmentManagement'

// Trainer Views
import { TrainerDashboard } from './pages/trainer/TrainerDashboard'
import { TrainerProgramsPage } from './pages/trainer/TrainerProgramsPage'
import { TrainerMonitoringPage } from './pages/trainer/TrainerMonitoringPage'
import { TrainerPendingPage } from './pages/trainer/TrainerPendingPage'
import { TrainerRejectedPage } from './pages/trainer/TrainerRejectedPage'
import { AssessmentManagement } from './pages/admin/AssessmentManagement'

// Employee Views
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard'
import { MyLearningPage } from './pages/employee/MyLearningPage'
import { EmployeeAssessmentPortal } from './pages/employee/EmployeeAssessmentPortal'
import { EarnedCertificates } from './pages/employee/EarnedCertificates'
import { EmployeeProfileView } from './pages/employee/EmployeeProfileView'

import { UnauthorizedPage } from './pages/shared/UnauthorizedPage'

function AuthenticatedApp() {
  const { user, role, trainerStatus, loading, logout, refreshProfile } = useAuth()
  const [activeNavItem, setActiveNavItem] = useState('dashboard')
  const [activeNavLabel, setActiveNavLabel] = useState('Overview')
  const [unauthorizedError, setUnauthorizedError] = useState(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm mb-4 animate-pulse">
          C
        </div>
        <p className="text-xs text-slate-500 font-medium">Validating security session...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  // Intercept Pending or Rejected Trainers before rendering AppShell
  if (role === 'TRAINER') {
    const status = trainerStatus || user?.trainer_status
    if (status === 'PENDING') {
      return <TrainerPendingPage onLogout={logout} onRefresh={refreshProfile} />
    }
    if (status === 'REJECTED') {
      return <TrainerRejectedPage onLogout={logout} onRefresh={refreshProfile} />
    }
  }

  const handleNavItemClick = (id, label) => {
    setActiveNavItem(id)
    if (label) setActiveNavLabel(label)
    setUnauthorizedError(null)
  }

  const breadcrumbs = [
    {
      label:
        role === 'ADMIN'
          ? 'System Administration'
          : role === 'TRAINER'
          ? 'Trainer Instruction Hub'
          : 'Learner Space',
    },
    { label: activeNavLabel },
  ]

  // Render view corresponding to current role and active nav selection
  const renderCurrentView = () => {
    if (unauthorizedError) {
      return (
        <UnauthorizedPage
          requiredRole={unauthorizedError}
          onGoBack={() => setUnauthorizedError(null)}
        />
      )
    }

    // Admin Views
    if (role === 'ADMIN') {
      switch (activeNavItem) {
        case 'dashboard':
          return <AdminDashboard onNavigate={handleNavItemClick} />
        case 'trainer-applications':
          return <TrainerApplicationsManagement />
        case 'departments':
          return <DepartmentManagement />
        case 'employees':
          return <EmployeeManagement />
        case 'trainers':
          return <TrainerManagement />
        case 'courses':
          return <CourseCatalogManagement />
        case 'training':
          return <TrainingProgramManagement />
        case 'enrollments':
          return <EnrollmentManagement />
        default:
          return <AdminDashboard onNavigate={handleNavItemClick} />
      }
    }

    // Approved Trainer Views
    if (role === 'TRAINER') {
      switch (activeNavItem) {
        case 'dashboard':
        case 'trainer-dashboard':
          return <TrainerDashboard onNavigate={handleNavItemClick} />
        case 'my-programs':
        case 'training':
          return <TrainerProgramsPage />
        case 'my-learners':
        case 'cohort-learners':
          return <TrainerMonitoringPage />
        case 'assessments':
        case 'assessments-grading':
          return <AssessmentManagement />
        default:
          return <TrainerDashboard onNavigate={handleNavItemClick} />
      }
    }

    // Employee Views
    if (role === 'EMPLOYEE') {
      switch (activeNavItem) {
        case 'dashboard':
        case 'learner-dashboard':
          return <EmployeeDashboard onNavigate={handleNavItemClick} />
        case 'my-learning':
        case 'my-courses':
          return <MyLearningPage />
        case 'my-assessments':
          return <EmployeeAssessmentPortal />
        case 'my-certificates':
          return <EarnedCertificates />
        case 'my-profile':
          return <EmployeeProfileView />
        default:
          return <EmployeeDashboard onNavigate={handleNavItemClick} />
      }
    }

    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-sm">Unknown role or view.</p>
      </div>
    )
  }

  return (
    <AppShell
      activeRole={role}
      activeNavItem={activeNavItem}
      onNavItemClick={handleNavItemClick}
      breadcrumbs={breadcrumbs}
    >
      {renderCurrentView()}
    </AppShell>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
