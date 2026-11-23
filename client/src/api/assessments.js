import { apiClient } from './client'

export const assessmentsApi = {
  // Assessments
  async getAssessments(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.course) query.append('course', params.course)
    if (params.training_program) query.append('training_program', params.training_program)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/assessments/evaluations/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch assessments')
    return res.json()
  },

  async getAssessment(id) {
    const res = await apiClient(`/assessments/evaluations/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch assessment details')
    return res.json()
  },

  async createAssessment(data) {
    const res = await apiClient('/assessments/evaluations/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to create assessment')
    }
    return result
  },

  async updateAssessment(id, data) {
    const res = await apiClient(`/assessments/evaluations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to update assessment')
    }
    return result
  },

  async deleteAssessment(id) {
    const res = await apiClient(`/assessments/evaluations/${id}/`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete assessment')
    return true
  },

  async addQuestion(assessmentId, data) {
    const res = await apiClient(`/assessments/evaluations/${assessmentId}/add_question/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to add question')
    }
    return result
  },

  async deleteQuestion(assessmentId, questionId) {
    const res = await apiClient(`/assessments/evaluations/${assessmentId}/delete_question/`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId }),
    })
    if (!res.ok) throw new Error('Failed to delete question')
    return res.json()
  },

  async getMyAssignedAssessments() {
    const res = await apiClient('/assessments/evaluations/my_assigned/')
    if (!res.ok) throw new Error('Failed to fetch your assigned assessments')
    return res.json()
  },

  async submitAssessment(assessmentId, answers) {
    const res = await apiClient(`/assessments/evaluations/${assessmentId}/submit/`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to submit assessment')
    }
    return result
  },

  // Submissions & Evaluation
  async getSubmissions(params = {}) {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.assessment) query.append('assessment', params.assessment)
    if (params.employee) query.append('employee', params.employee)
    if (params.status) query.append('status', params.status)
    if (params.is_passed !== undefined) query.append('is_passed', params.is_passed)
    if (params.ordering) query.append('ordering', params.ordering)

    const endpoint = `/assessments/submissions/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch assessment submissions')
    return res.json()
  },

  async getSubmission(id) {
    const res = await apiClient(`/assessments/submissions/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch submission results')
    return res.json()
  },

  async evaluateSubmission(id, data) {
    const res = await apiClient(`/assessments/submissions/${id}/evaluate/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const result = await res.json()
    if (!res.ok) {
      const err = Object.values(result)[0]
      throw new Error(Array.isArray(err) ? err[0] : err || 'Failed to evaluate submission')
    }
    return result
  },

  async getMySubmissions() {
    const res = await apiClient('/assessments/submissions/my_submissions/')
    if (!res.ok) throw new Error('Failed to fetch your submission history')
    return res.json()
  },
}
