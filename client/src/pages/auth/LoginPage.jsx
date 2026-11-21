import React, { useState } from 'react'
import { Lock, Mail, Eye, EyeOff, User, Phone, ArrowRight, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../design-system/Button'
import { Input } from '../../design-system/Input'
import { Badge } from '../../design-system/Badge'
import { ForgotPasswordModal } from './ForgotPasswordModal'

export function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' or 'register'

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regRole, setRegRole] = useState('EMPLOYEE')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)

  const handleLoginSubmit = async (e) => {
    e?.preventDefault()
    if (!email || !password) return

    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (!regEmail || !regPassword) return
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError(null)
    setLoading(true)
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email: regEmail,
        role: regRole,
        phone: regPhone,
        password: regPassword,
        confirm_password: regConfirmPassword,
      })
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (roleEmail, rolePassword) => {
    setEmail(roleEmail)
    setPassword(rolePassword)
    setError(null)
    setLoading(true)
    login(roleEmail, rolePassword).catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-xl bg-slate-900 text-white items-center justify-center font-bold text-lg shadow-sm">
          C
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'login' ? 'Sign in to Capacita' : 'Create Your Account'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Digital Capacity Building & Learning Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={`flex-1 py-2 text-center rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError(null)
              }}
              className={`flex-1 py-2 text-center rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <span className="font-semibold shrink-0">Notice:</span>
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label="Work Email Address"
                type="email"
                required
                placeholder="name@organization.com"
                leftIcon={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg pl-3.5 pr-10 py-2 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={loading}
                rightIcon={ArrowRight}
              >
                Sign In with Credentials
              </Button>
            </form>
          ) : (
            /* CREATE ACCOUNT FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  placeholder="e.g. Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  required
                  placeholder="e.g. Connor"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <Input
                label="Work Email Address"
                type="email"
                required
                placeholder="sarah@organization.com"
                leftIcon={Mail}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Account Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="EMPLOYEE">Employee / Learner</option>
                    <option value="TRAINER">Trainer / Faculty</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <Input
                  label="Phone (Optional)"
                  placeholder="+1 555-0199"
                  leftIcon={Phone}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>

              <Input
                label="Password"
                type="password"
                required
                placeholder="At least 8 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />

              <Input
                label="Confirm Password"
                type="password"
                required
                placeholder="Re-enter password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={loading}
                leftIcon={UserPlus}
              >
                Register & Enter Portal
              </Button>
            </form>
          )}

          {/* Quick Persona Access for Testing */}
          {mode === 'login' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
                One-Click Role Test Logins
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@capacita.org', 'CapacitaAdmin@2026')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">Administrator</p>
                    <p className="text-[11px] text-slate-500">admin@capacita.org</p>
                  </div>
                  <Badge variant="primary" size="sm">Super Admin</Badge>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('trainer@capacita.org', 'CapacitaTrainer@2026')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">Trainer (Elena Vance)</p>
                    <p className="text-[11px] text-slate-500">trainer@capacita.org</p>
                  </div>
                  <Badge variant="warning" size="sm">Faculty</Badge>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('employee@capacita.org', 'CapacitaEmployee@2026')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">Employee (Marcus Chen)</p>
                    <p className="text-[11px] text-slate-500">employee@capacita.org</p>
                  </div>
                  <Badge variant="info" size="sm">Learner</Badge>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Protected by Django REST Framework SimpleJWT & Neon PostgreSQL
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
      />
    </div>
  )
}
