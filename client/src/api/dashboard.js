import { apiClient } from './client'

export const dashboardApi = {
  /**
   * Admin dashboard metrics & recent activity
   */
  async getAdminDashboard() {
    const res = await apiClient('/dashboard/admin/')
    if (!res.ok) throw new Error('Failed to load administrator dashboard')
    return res.json()
  },

  /**
   * Trainer dashboard metrics, assigned programs/learners, assessment data
   */
  async getTrainerDashboard() {
    const res = await apiClient('/dashboard/trainer/')
    if (!res.ok) throw new Error('Failed to load trainer dashboard')
    return res.json()
  },

  /**
   * Employee dashboard metrics, assigned courses, active trainings, pending assessments
   */
  async getEmployeeDashboard() {
    const res = await apiClient('/dashboard/employee/')
    if (!res.ok) throw new Error('Failed to load employee dashboard')
    return res.json()
  },
}

export default dashboardApi
