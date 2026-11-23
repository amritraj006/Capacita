import { apiClient } from './client'

export const coursesApi = {
  async getCourses(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.category) query.append('category', params.category)
    if (params.level) query.append('level', params.level)
    if (params.is_active !== undefined) query.append('is_active', params.is_active)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/courses/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch courses')
    return res.json()
  },

  async getCourse(id) {
    const res = await apiClient(`/courses/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch course details')
    return res.json()
  },

  async createCourse(data) {
    const res = await apiClient('/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create course')
    }
    return result
  },

  async updateCourse(id, data) {
    const res = await apiClient(`/courses/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update course')
    }
    return result
  },

  async deleteCourse(id) {
    const res = await apiClient(`/courses/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete course')
    return true
  },

  async addModule(courseId, data) {
    const res = await apiClient(`/courses/${courseId}/add_module/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to add module')
    }
    return result
  },
}
