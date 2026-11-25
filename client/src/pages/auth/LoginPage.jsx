import React, { useState, useEffect } from 'react'
import { Lock, Mail, Eye, EyeOff, Phone, ArrowRight, UserPlus, GraduationCap, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { apiClient } from '../../api/client'
import { Button } from '../../design-system/Button'
import { Input } from '../../design-system/Input'
import { ForgotPasswordModal } from './ForgotPasswordModal'

export function LoginPage() {
  const { login, register, applyTrainer } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'trainer-apply'

  // Login form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Employee Register form state (Public registration is for Employees only)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')

  // Trainer Application form state
  const [departments, setDepartments] = useState([])
  const [trainerForm, setTrainerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    department_id: '',
    qualifications: '',
    experience: '',
    skills: '',
    introduction: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [forgotModalOpen, setForgotModalOpen] = useState(false)

  useEffect(() => {
    if (mode === 'trainer-apply' && departments.length === 0) {
      apiClient('/accounts/departments/')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setDepartments(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [mode])

  const handleLoginSubmit = async (e) => {
    e?.preventDefault()
    if (!email || !password) return

    setError(null)
    setSuccessMessage(null)
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
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError(null)
    setSuccessMessage(null)
    setLoading(true)
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email: regEmail,
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

  const handleTrainerApplySubmit = async (e) => {
    e.preventDefault()
    if (!trainerForm.email || !trainerForm.password) return
    if (trainerForm.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (trainerForm.password !== trainerForm.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (!trainerForm.qualifications.trim() || !trainerForm.experience.trim() || !trainerForm.skills.trim() || !trainerForm.introduction.trim()) {
      setError('Please complete all required trainer application fields.')
      return
    }

    setError(null)
    setSuccessMessage(null)
    setLoading(true)
    try {
      await applyTrainer({
        ...trainerForm,
        department_id: trainerForm.department_id || null,
      })
      setSuccessMessage('Application submitted successfully! Your application is pending Admin review.')
    } catch (err) {
      setError(err.message || 'Failed to submit trainer application.')
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
      <div className={`sm:mx-auto sm:w-full text-center ${mode === 'trainer-apply' ? 'sm:max-w-xl' : 'sm:max-w-md'}`}>
        <div className="inline-flex h-12 w-12 rounded-xl bg-slate-900 text-white items-center justify-center font-bold text-lg shadow-sm">
          C
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {mode === 'login'
            ? 'Sign in to Capacita'
            : mode === 'register'
            ? 'Register as Employee'
            : 'Trainer Application'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {mode === 'trainer-apply'
            ? 'Apply to join Capacita as an instructor. Applications require Admin approval.'
            : 'Digital Capacity Building & Learning Management Portal'}
        </p>
      </div>

      <div className={`mt-6 sm:mx-auto sm:w-full ${mode === 'trainer-apply' ? 'sm:max-w-xl' : 'sm:max-w-md'}`}>
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Tabs: Sign In / Create Account (hidden in trainer-apply mode) */}
          {mode !== 'trainer-apply' && (
            <div className="flex rounded-lg bg-slate-100 p-1 mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError(null)
                  setSuccessMessage(null)
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
                  setSuccessMessage(null)
                }}
                className={`flex-1 py-2 text-center rounded-md transition-all ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Register as Employee
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <span className="font-semibold shrink-0">Notice:</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
              {successMessage}
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'login' && (
            <>
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

              {/* Join as a Trainer link below login form */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Want to teach or lead training programs?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('trainer-apply')
                      setError(null)
                      setSuccessMessage(null)
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
                  >
                    Join as a Trainer
                  </button>
                </p>
              </div>
            </>
          )}

          {/* EMPLOYEE REGISTRATION FORM */}
          {mode === 'register' && (
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

              <Input
                label="Phone (Optional)"
                placeholder="+1 555-0199"
                leftIcon={Phone}
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />

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
                Register as Employee
              </Button>
            </form>
          )}

          {/* TRAINER APPLICATION FORM */}
          {mode === 'trainer-apply' && (
            <form onSubmit={handleTrainerApplySubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span>Instructor Application Details</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                    setSuccessMessage(null)
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  placeholder="e.g. Dr. Alan"
                  value={trainerForm.first_name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, first_name: e.target.value })}
                />
                <Input
                  label="Last Name"
                  required
                  placeholder="e.g. Grant"
                  value={trainerForm.last_name}
                  onChange={(e) => setTrainerForm({ ...trainerForm, last_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="alan@organization.com"
                  leftIcon={Mail}
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                />
                <Input
                  label="Phone (Optional)"
                  placeholder="+1 555-0199"
                  leftIcon={Phone}
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={trainerForm.confirm_password}
                  onChange={(e) => setTrainerForm({ ...trainerForm, confirm_password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Department
                </label>
                <select
                  value={trainerForm.department_id}
                  onChange={(e) => setTrainerForm({ ...trainerForm, department_id: e.target.value })}
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Qualifications <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Degrees, certifications, teaching credentials..."
                  value={trainerForm.qualifications}
                  onChange={(e) => setTrainerForm({ ...trainerForm, qualifications: e.target.value })}
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Professional Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Years of experience, industry roles, training background..."
                  value={trainerForm.experience}
                  onChange={(e) => setTrainerForm({ ...trainerForm, experience: e.target.value })}
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Relevant Skills <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Technical domains, leadership, instructional skills..."
                  value={trainerForm.skills}
                  onChange={(e) => setTrainerForm({ ...trainerForm, skills: e.target.value })}
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Short Introduction <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Briefly introduce yourself and the topics you plan to teach..."
                  value={trainerForm.introduction}
                  onChange={(e) => setTrainerForm({ ...trainerForm, introduction: e.target.value })}
                  className="w-full text-sm bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={loading}
                leftIcon={GraduationCap}
              >
                Submit Trainer Application
              </Button>
            </form>
          )}

          {/* Quick Persona Access for Testing */}
          {mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
                Quick Dev Authentication
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@capacita.org', 'AdminPassword123!')}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-center"
                >
                  Admin Persona
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('trainer@capacita.org', 'TrainerPassword123!')}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors text-center"
                >
                  Trainer Persona
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
      />
    </div>
  )
}
