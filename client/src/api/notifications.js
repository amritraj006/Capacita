import { apiClient } from './client'

export const notificationsApi = {
  async getNotifications(params = {}) {
    const query = new URLSearchParams()
    if (params.is_read !== undefined) query.append('is_read', params.is_read)
    const endpoint = `/notifications/${query.toString() ? `?${query.toString()}` : ''}`
    const res = await apiClient(endpoint)
    if (!res.ok) throw new Error('Failed to fetch notifications')
    return res.json()
  },

  async getUnreadCount() {
    const res = await apiClient('/notifications/unread_count/')
    if (!res.ok) throw new Error('Failed to get unread notification count')
    return res.json()
  },

  async markAsRead(id) {
    const res = await apiClient(`/notifications/${id}/mark_read/`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to mark notification as read')
    return res.json()
  },

  async markAllAsRead() {
    const res = await apiClient('/notifications/mark_all_read/', { method: 'POST' })
    if (!res.ok) throw new Error('Failed to mark all notifications as read')
    return res.json()
  },
}

export default notificationsApi
