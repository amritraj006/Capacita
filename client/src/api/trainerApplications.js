import { apiClient } from './client'

export const trainerApplicationsApi = {
  async getApplications(params = {}) {
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.search) query.append('search', params.search)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/accounts/trainer-applications/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to load trainer applications')
    return res.json()
  },

  async getApplication(id) {
    const res = await apiClient(`/accounts/trainer-applications/${id}/`)
    if (!res.ok) throw new Error('Failed to load application details')
    return res.json()
  },

  async approveApplication(id) {
    const res = await apiClient(`/accounts/trainer-applications/${id}/approve/`, {
      method: 'POST',
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to approve application')
    }
    return data
  },

  async rejectApplication(id, rejectionReason) {
    const res = await apiClient(`/accounts/trainer-applications/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    })
    const data = await res.json()
    if (!res.ok) {
      const err = Object.values(data)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to reject application')
    }
    return data
  },
}
