import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LoginPage } from './pages/auth/LoginPage'
import { AppShell } from './layouts/AppShell'
import { DesignSystemShowcase } from './pages/DesignSystemShowcase'
import { DepartmentManagement } from './pages/admin/DepartmentManagement'
import { EmployeeManagement } from './pages/admin/EmployeeManagement'
import { EmployeeProfileView } from './pages/employee/EmployeeProfileView'
import { TrainerLearnerDirectory } from './pages/trainer/TrainerLearnerDirectory'
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
      if (activeNavItem === 'departments') {
        return <DepartmentManagement />
      }
      if (activeNavItem === 'employees') {
        return <EmployeeManagement />
      }
    }

    // Trainer Views
    if (role === 'TRAINER') {
      if (activeNavItem === 'cohort-learners') {
        return <TrainerLearnerDirectory />
      }
    }

    // Employee Views
    if (role === 'EMPLOYEE') {
      if (activeNavItem === 'learner-dashboard' || activeNavItem === 'dashboard') {
        return <EmployeeProfileView />
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
