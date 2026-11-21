import React, { useState } from 'react'
import {
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  KeyRound,
  ShieldCheck,
  User,
} from 'lucide-react'
import { ROLE_NAVIGATION } from './navigationConfig'
import { Breadcrumbs } from '../design-system/Breadcrumbs'
import { Badge } from '../design-system/Badge'
import { useAuth } from '../context/AuthContext'
import { ChangePasswordModal } from '../pages/auth/ChangePasswordModal'

export function AppShell({
  activeRole,
  activeNavItem = 'dashboard',
  onNavItemClick,
  breadcrumbs = [{ label: 'Overview' }],
  children,
}) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  const currentRole = activeRole || user?.role || 'EMPLOYEE'
  const currentRoleConfig = ROLE_NAVIGATION[currentRole] || ROLE_NAVIGATION.EMPLOYEE

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'Authenticated User'

  const userInitials = user?.first_name
    ? `${user.first_name[0]}${user.last_name ? user.last_name[0] : ''}`.toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'CU'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 font-sans">
      {/* Top Banner: Status & Active Session Role */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-slate-200">Capacita Enterprise Portal</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Active JWT Role: <strong className="text-white">{currentRoleConfig.roleName}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px] hidden md:inline">
            Logged in as: <span className="text-slate-200 font-medium">{user?.email}</span>
          </span>
          <button
            onClick={logout}
            className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 hover:underline"
          >
            <LogOut className="h-3 w-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 shadow-2xs shrink-0">
          {/* Logo & Platform Name */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                C
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                  Capacita
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Capacity Portal
                </span>
              </div>
            </div>
            <Badge variant="primary" size="sm">
              {currentRoleConfig.roleBadge}
            </Badge>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {currentRoleConfig.navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <div className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeNavItem === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavItemClick && onNavItemClick(item.id, item.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isActive
                              ? 'bg-slate-700 text-slate-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* User Profile Mini Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentRoleConfig.roleName}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-slate-200/50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-white h-full shadow-xl flex flex-col z-10">
              <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    C
                  </div>
                  <span className="font-bold text-slate-900">Capacita</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {currentRoleConfig.navSections.map((section, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="px-2 mb-1 text-[11px] font-semibold uppercase text-slate-400">
                      {section.title}
                    </div>
                    {section.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavItemClick && onNavItemClick(item.id, item.label)
                          setMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                          activeNavItem === item.id
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
            {/* Left: Mobile Toggle & Breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <Breadcrumbs items={breadcrumbs} />
              </div>
            </div>

            {/* Right: Search, Notifications, User Dropdown */}
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search portal records..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
                />
              </div>

              <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {userInitials}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{displayName}</p>
                    <p className="text-[10px] text-slate-400 leading-none mt-0.5">{currentRoleConfig.roleName}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                      <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                      <Badge variant="primary" size="sm" className="mt-1.5">
                        {user?.role}
                      </Badge>
                    </div>

                    <button
                      onClick={() => setPasswordModalOpen(true)}
                      className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                      <span>Change Password</span>
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={logout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  )
}
