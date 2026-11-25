import { apiClient } from './client'

export const departmentsApi = {
  async getDepartments(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/departments/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch departments')
    return res.json()
  },

  async createDepartment(data) {
    const res = await apiClient('/departments/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create department')
    }
    return result
  },

  async updateDepartment(id, data) {
    const res = await apiClient(`/departments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update department')
    }
    return result
  },

  async deleteDepartment(id) {
    const res = await apiClient(`/departments/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      const result = await res.json().catch(() => ({}))
      throw new Error(result.detail || 'Failed to delete department')
    }
    return true
  },

  async getDepartmentEmployees(id) {
    const res = await apiClient(`/departments/${id}/employees/`)
    if (!res.ok) throw new Error('Failed to fetch department employees')
    return res.json()
  },
}
