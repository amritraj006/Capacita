import { apiClient } from './client'

export const progressApi = {
  async getAnalytics() {
    const res = await apiClient('/progress/analytics/')
    if (!res.ok) throw new Error('Failed to fetch progress analytics')
    return res.json()
  },

  async getLearnerProgress(employeeId = null) {
    const endpoint = employeeId
      ? `/progress/learner_progress/?employee_id=${employeeId}`
      : '/progress/learner_progress/'
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch learner progress')
    return res.json()
  },

  async getMyProgress() {
    return this.getLearnerProgress()
  },

  async markModuleComplete(data) {
    const res = await apiClient('/progress/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) throw new Error('Failed to update module progress')
    return result
  },

  async getModuleProgress(params = {}) {
    const query = new URLSearchParams()
    if (params.enrollment) query.append('enrollment', params.enrollment)

    const endpoint = `/progress/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch module progress')
    return res.json()
  },
}

export default progressApi
