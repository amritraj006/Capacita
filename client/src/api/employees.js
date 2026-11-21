import { apiClient } from './client'

export const employeesApi = {
  async getEmployees(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.department) query.append('department', params.department)
    if (params.is_active !== undefined && params.is_active !== '') {
      query.append('is_active', params.is_active)
    }
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/employees/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch employees')
    return res.json()
  },

  async createEmployee(data) {
    const res = await apiClient('/employees/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create employee')
    }
    return result
  },

  async updateEmployee(id, data) {
    const res = await apiClient(`/employees/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update employee')
    }
    return result
  },

  async toggleStatus(id) {
    const res = await apiClient(`/employees/${id}/toggle_status/`, {
      method: 'POST',
    })
    const result = await res.json()
    if (!res.ok) throw new Error('Failed to update employee status')
    return result
  },

  async getMyProfile() {
    const res = await apiClient('/employees/me/')
    if (!res.ok) throw new Error('Failed to load employee profile')
    return res.json()
  },

  async updateMyProfile(data) {
    const res = await apiClient('/employees/me/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update profile')
    }
    return result
  },
}
