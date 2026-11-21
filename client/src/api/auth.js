import { apiClient, setStoredTokens, clearStoredTokens } from './client'

export const authApi = {
  async register(registrationData) {
    const res = await apiClient('/accounts/register/', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = Object.values(data)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Registration failed')
    }
    setStoredTokens(data.access, data.refresh)
    localStorage.setItem('capacita_user', JSON.stringify(data.user))
    return data
  },

  async login(email, password) {
    const res = await apiClient('/accounts/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || data.non_field_errors?.[0] || 'Invalid credentials')
    }
    setStoredTokens(data.access, data.refresh)
    localStorage.setItem('capacita_user', JSON.stringify(data.user))
    return data
  },

  async logout() {
    try {
      await apiClient('/accounts/logout/', { method: 'POST' })
    } finally {
      clearStoredTokens()
    }
  },

  async getProfile() {
    const res = await apiClient('/accounts/me/')
    if (!res.ok) throw new Error('Failed to load profile')
    return res.json()
  },

  async changePassword(oldPassword, newPassword, confirmPassword) {
    const res = await apiClient('/accounts/password/change/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = Object.values(data)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Password change failed')
    }
    return data
  },

  async requestPasswordReset(email) {
    const res = await apiClient('/accounts/password/reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Password reset request failed')
    return data
  },

  async confirmPasswordReset(uid, token, newPassword, confirmPassword) {
    const res = await apiClient('/accounts/password/reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Password reset confirmation failed')
    return data
  },

  // Test endpoints for RBAC verification
  async testAdminOnly() {
    const res = await apiClient('/accounts/test/admin-only/')
    const data = await res.json()
    return { status: res.status, ok: res.ok, data }
  },

  async testTrainerOnly() {
    const res = await apiClient('/accounts/test/trainer-only/')
    const data = await res.json()
    return { status: res.status, ok: res.ok, data }
  },

  async testEmployeeOnly() {
    const res = await apiClient('/accounts/test/employee-only/')
    const data = await res.json()
    return { status: res.status, ok: res.ok, data }
  },
}
