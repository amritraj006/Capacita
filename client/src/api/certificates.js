import { apiClient } from './client'

export const certificatesApi = {
  async getCertificates(params = {}) {
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.employee) query.append('employee', params.employee)
    if (params.course) query.append('course', params.course)
    if (params.training_program) query.append('training_program', params.training_program)

    const endpoint = `/certificates/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch certificates')
    return res.json()
  },

  async getMyCertificates() {
    const res = await apiClient('/certificates/my_certificates/')
    if (!res.ok) throw new Error('Failed to fetch my certificates')
    return res.json()
  },

  async generateCertificate(enrollmentId) {
    const res = await apiClient('/certificates/generate/', {
      method: 'POST',
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to generate certificate')
    }
    return result
  },

  async verifyCertificate(code) {
    const res = await apiClient(`/certificates/verify/?code=${encodeURIComponent(code)}`)
    if (!res.ok) throw new Error('Failed to verify certificate')
    return res.json()
  },

  async revokeCertificate(id) {
    const res = await apiClient(`/certificates/${id}/revoke/`, {
      method: 'POST',
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to revoke certificate')
    }
    return result
  },

  async getCertificate(id) {
    const res = await apiClient(`/certificates/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch certificate details')
    return res.json()
  },
}

export default certificatesApi
