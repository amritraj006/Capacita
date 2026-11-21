/**
 * Capacita Enterprise API Client with Automatic Token Refresh
 */

const BASE_URL = 'http://127.0.0.1:8000/api'

export const getStoredTokens = () => {
  return {
    access: localStorage.getItem('capacita_access_token'),
    refresh: localStorage.getItem('capacita_refresh_token'),
  }
}

export const setStoredTokens = (access, refresh) => {
  if (access) localStorage.setItem('capacita_access_token', access)
  if (refresh) localStorage.setItem('capacita_refresh_token', refresh)
}

export const clearStoredTokens = () => {
  localStorage.removeItem('capacita_access_token')
  localStorage.removeItem('capacita_refresh_token')
  localStorage.removeItem('capacita_user')
}

let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((callback) => callback(newAccessToken))
  refreshSubscribers = []
}

export async function apiClient(endpoint, options = {}) {
  const { access, refresh } = getStoredTokens()

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (access && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${access}`
  }

  const config = {
    ...options,
    headers,
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, config)

  // Token expired: attempt automatic refresh
  if (response.status === 401 && refresh && !endpoint.includes('/accounts/token/refresh/')) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshResponse = await fetch(`${BASE_URL}/accounts/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          const newAccess = refreshData.access
          const newRefresh = refreshData.refresh || refresh
          setStoredTokens(newAccess, newRefresh)
          isRefreshing = false
          onRefreshed(newAccess)
        } else {
          isRefreshing = false
          clearStoredTokens()
          window.dispatchEvent(new CustomEvent('auth:expired'))
          return response
        }
      } catch (err) {
        isRefreshing = false
        clearStoredTokens()
        window.dispatchEvent(new CustomEvent('auth:expired'))
        return response
      }
    }

    // Wait for the new token and retry the original request
    return new Promise((resolve) => {
      subscribeTokenRefresh(async (newAccessToken) => {
        config.headers['Authorization'] = `Bearer ${newAccessToken}`
        const retryResponse = await fetch(`${BASE_URL}${endpoint}`, config)
        resolve(retryResponse)
      })
    })
  }

  return response
}
