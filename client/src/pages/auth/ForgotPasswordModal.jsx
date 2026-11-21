import React, { useState } from 'react'
import { authApi } from '../../api/auth'
import { Modal } from '../../design-system/Modal'
import { Button } from '../../design-system/Button'
import { Input } from '../../design-system/Input'
import { CheckCircle2 } from 'lucide-react'

export function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1) // 1: Request, 2: Reset
  const [email, setEmail] = useState('')
  const [uid, setUid] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleRequestToken = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await authApi.requestPasswordReset(email)
      if (data.reset_token) {
        setToken(data.reset_token)
        setUid(data.uid)
        setSuccess('Reset token generated successfully! (Simulated link for local development)')
        setStep(2)
      } else {
        setSuccess(data.detail)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const data = await authApi.confirmPasswordReset(uid, token, newPassword, confirmPassword)
      setSuccess(data.detail)
      setTimeout(() => {
        onClose()
        setStep(1)
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Reset Password' : 'Enter New Password'}
      description={
        step === 1
          ? 'Enter your verified work email address to receive reset credentials.'
          : 'Provide your new password and confirmation.'
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestToken} className="space-y-4">
          <Input
            label="Account Email"
            type="email"
            required
            placeholder="admin@capacita.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Generate Reset Token
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <Input
            label="Reset Token (Pre-filled)"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            required
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Set New Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
