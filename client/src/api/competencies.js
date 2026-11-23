import { apiClient } from './client'

export const competenciesApi = {
  // Categories
  async getCategories() {
    const res = await apiClient('/competencies/categories/')
    if (!res.ok) throw new Error('Failed to fetch competency categories')
    return res.json()
  },

  async createCategory(data) {
    const res = await apiClient('/competencies/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create category')
    }
    return result
  },

  // Competencies
  async getCompetencies(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.category) query.append('category', params.category)
    if (params.target_level) query.append('target_level', params.target_level)
    if (params.is_active !== undefined) query.append('is_active', params.is_active)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/competencies/framework/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch competencies')
    return res.json()
  },

  async getCompetency(id) {
    const res = await apiClient(`/competencies/framework/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch competency details')
    return res.json()
  },

  async createCompetency(data) {
    const res = await apiClient('/competencies/framework/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create competency')
    }
    return result
  },

  async updateCompetency(id, data) {
    const res = await apiClient(`/competencies/framework/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update competency')
    }
    return result
  },

  async deleteCompetency(id) {
    const res = await apiClient(`/competencies/framework/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete competency')
    return true
  },

  // Employee Competency Records
  async getEmployeeCompetencies(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.employee) query.append('employee', params.employee)
    if (params.competency) query.append('competency', params.competency)
    if (params.current_level) query.append('current_level', params.current_level)
    if (params.status) query.append('status', params.status)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/competencies/records/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch employee competency records')
    return res.json()
  },

  async createEmployeeCompetency(data) {
    const res = await apiClient('/competencies/records/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to assign competency record')
    }
    return result
  },

  async evaluateCompetency(id, data) {
    const res = await apiClient(`/competencies/records/${id}/evaluate/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to record competency evaluation')
    }
    return result
  },

  async getMyCompetencies() {
    const res = await apiClient('/competencies/records/my_competencies/')
    if (!res.ok) throw new Error('Failed to fetch your competency profile')
    return res.json()
  },
}
