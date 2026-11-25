import { apiClient } from './client'

export const usersApi = {
  async getUsers(params = {}) {
    const query = new URLSearchParams()
    if (params.role) query.append('role', params.role)
    if (params.search) query.append('search', params.search)
    if (params.is_active !== undefined && params.is_active !== '') {
      query.append('is_active', params.is_active)
    }
    if (params.approved_only) {
      query.append('approved_only', 'true')
    }
    const endpoint = `/accounts/users/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch users')
    return res.json()
  },

  async createUser(data) {
    const res = await apiClient('/accounts/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create account')
    }
    return result
  },

  async updateUser(id, data) {
    const res = await apiClient(`/accounts/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update account')
    }
    return result
  },

  async toggleStatus(id) {
    const res = await apiClient(`/accounts/users/${id}/toggle_status/`, {
      method: 'POST',
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.detail || 'Failed to update status')
    return result
  },
}
