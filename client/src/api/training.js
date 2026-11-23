import { apiClient } from './client'

export const trainingApi = {
  async getTrainingPrograms(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.status) query.append('status', params.status)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/training/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch training programs')
    return res.json()
  },

  async getTrainingProgram(id) {
    const res = await apiClient(`/training/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch training program details')
    return res.json()
  },

  async createTrainingProgram(data) {
    const res = await apiClient('/training/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create training program')
    }
    return result
  },

  async updateTrainingProgram(id, data) {
    const res = await apiClient(`/training/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update training program')
    }
    return result
  },

  async deleteTrainingProgram(id) {
    const res = await apiClient(`/training/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete training program')
    return true
  },
}
