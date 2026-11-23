import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { AppShell } from './layouts/AppShell'
import { DesignSystemShowcase } from './pages/DesignSystemShowcase'
import { DepartmentManagement } from './pages/admin/DepartmentManagement'
import { EmployeeManagement } from './pages/admin/EmployeeManagement'
import { CourseCatalogManagement } from './pages/admin/CourseCatalogManagement'
import { TrainingProgramManagement } from './pages/admin/TrainingProgramManagement'
import { EnrollmentManagement } from './pages/admin/EnrollmentManagement'
import { CompetencyFrameworkManagement } from './pages/admin/CompetencyFrameworkManagement'
import { AssessmentManagement } from './pages/admin/AssessmentManagement'
import { EmployeeProfileView } from './pages/employee/EmployeeProfileView'
import { MyLearningPage } from './pages/employee/MyLearningPage'
import { EmployeeCompetencyProfile } from './pages/employee/EmployeeCompetencyProfile'
import { EmployeeAssessmentPortal } from './pages/employee/EmployeeAssessmentPortal'
import { TrainerLearnerDirectory } from './pages/trainer/TrainerLearnerDirectory'
import { TrainerMonitoringPage } from './pages/trainer/TrainerMonitoringPage'
import { TrainerGradingHub } from './pages/trainer/TrainerGradingHub'
import { TrainerProgressMonitoring } from './pages/trainer/TrainerProgressMonitoring'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { TrainerDashboard } from './pages/trainer/TrainerDashboard'
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard'
import { ReportsHub } from './pages/shared/ReportsHub'
import { ProgressDashboard } from './pages/admin/ProgressDashboard'
import { CertificateManagement } from './pages/admin/CertificateManagement'
import { EarnedCertificates } from './pages/employee/EarnedCertificates'
import { UnauthorizedPage } from './pages/shared/UnauthorizedPage'

function AuthenticatedApp() {
  const { user, role, loading } = useAuth()
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

  const handleNavItemClick = (id, label) => {
    setActiveNavItem(id)
    setActiveNavLabel(label)
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
      if (activeNavItem === 'dashboard') {
        return <AdminDashboard onNavigate={handleNavItemClick} />
      }
      if (activeNavItem === 'departments') {
        return <DepartmentManagement />
      }
      if (activeNavItem === 'employees') {
        return <EmployeeManagement />
      }
      if (activeNavItem === 'courses') {
        return <CourseCatalogManagement />
      }
      if (activeNavItem === 'training') {
        return <TrainingProgramManagement />
      }
      if (activeNavItem === 'enrollments') {
        return <EnrollmentManagement />
      }
      if (activeNavItem === 'competencies') {
        return <CompetencyFrameworkManagement />
      }
      if (activeNavItem === 'assessments') {
        return <AssessmentManagement />
      }
      if (activeNavItem === 'certificates') {
        return <CertificateManagement />
      }
      if (activeNavItem === 'progress') {
        return <ProgressDashboard />
      }
      if (activeNavItem === 'reports') {
        return <ReportsHub />
      }
    }

    // Trainer Views
    if (role === 'TRAINER') {
      if (activeNavItem === 'trainer-dashboard' || activeNavItem === 'dashboard') {
        return <TrainerDashboard />
      }
      if (activeNavItem === 'progress-monitoring') {
        return <TrainerProgressMonitoring />
      }
      if (activeNavItem === 'assessments-grading') {
        return <TrainerGradingHub />
      }
      if (activeNavItem === 'reports') {
        return <ReportsHub />
      }
      if (activeNavItem === 'cohort-learners' || activeNavItem === 'my-batches') {
        return <TrainerMonitoringPage />
      }
      if (activeNavItem === 'competencies') {
        return <CompetencyFrameworkManagement />
      }
    }

    // Employee Views
    if (role === 'EMPLOYEE') {
      if (activeNavItem === 'learner-dashboard' || activeNavItem === 'dashboard') {
        return <EmployeeDashboard onNavigate={handleNavItemClick} />
      }
      if (activeNavItem === 'my-certificates') {
        return <EarnedCertificates />
      }
      if (activeNavItem === 'my-assessments') {
        return <EmployeeAssessmentPortal />
      }
      if (activeNavItem === 'my-competencies') {
        return <EmployeeCompetencyProfile />
      }
      if (activeNavItem === 'my-courses') {
        return <MyLearningPage />
      }
    }

    // Default overview / showcase for other items
    return (
      <DesignSystemShowcase
        activeRole={role}
        activeNavLabel={activeNavLabel}
      />
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
