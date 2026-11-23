import { apiClient } from './client'

export const reportsApi = {
  /**
   * Comprehensive reports covering:
   * - department_participation
   * - employee_progress
   * - course_completion
   * - training_activities
   * - assessment_performance
   */
  async getReports() {
    const res = await apiClient('/dashboard/reports/')
    if (!res.ok) throw new Error('Failed to fetch reporting analytics')
    return res.json()
  },
}

export default reportsApi
