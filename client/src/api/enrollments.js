import { apiClient } from './client'

export const enrollmentsApi = {
  async getEnrollments(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.status) query.append('status', params.status)
    if (params.enrollment_type) query.append('enrollment_type', params.enrollment_type)
    if (params.course) query.append('course', params.course)
    if (params.training_program) query.append('training_program', params.training_program)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/enrollments/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch enrollments')
    return res.json()
  },

  async getEnrollment(id) {
    const res = await apiClient(`/enrollments/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch enrollment record')
    return res.json()
  },

  async createEnrollment(data) {
    const res = await apiClient('/enrollments/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create enrollment')
    }
    return result
  },

  async updateEnrollment(id, data) {
    const res = await apiClient(`/enrollments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update enrollment')
    }
    return result
  },

  async deleteEnrollment(id) {
    const res = await apiClient(`/enrollments/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete enrollment')
    return true
  },

  async getMyLearning() {
    const res = await apiClient('/enrollments/my_learning/')
    if (!res.ok) throw new Error('Failed to fetch your learning records')
    return res.json()
  },

  async getEnrollmentModules(enrollmentId) {
    const res = await apiClient(`/enrollments/${enrollmentId}/modules/`)
    if (!res.ok) throw new Error('Failed to fetch enrollment modules')
    return res.json()
  },

  async toggleModuleCompletion(enrollmentId, moduleId) {
    const res = await apiClient(`/enrollments/${enrollmentId}/toggle_module/`, {
      method: 'POST',
      body: JSON.stringify({ module_id: moduleId }),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to toggle module status')
    }
    return result
  },

  async getTrainerMonitoring() {
    const res = await apiClient('/enrollments/trainer_monitoring/')
    if (!res.ok) throw new Error('Failed to fetch trainer monitoring records')
    return res.json()
  },
}
