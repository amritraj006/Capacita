import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'
import { getStoredTokens, clearStoredTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('capacita_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const { access } = getStoredTokens()
      if (access) {
        try {
          const profile = await authApi.getProfile()
          setUser(profile)
          localStorage.setItem('capacita_user', JSON.stringify(profile))
        } catch (err) {
          console.warn('Initial session validation failed:', err)
          clearStoredTokens()
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()

    const handleExpired = () => {
      setUser(null)
      clearStoredTokens()
    }

    window.addEventListener('auth:expired', handleExpired)
    return () => window.removeEventListener('auth:expired', handleExpired)
  }, [])

  const login = async (email, password) => {
    const data = await authApi.login(email, password)
    setUser(data.user)
    return data
  }

  const register = async (registrationData) => {
    const data = await authApi.register(registrationData)
    setUser(data.user)
    return data
  }

  const applyTrainer = async (trainerData) => {
    const data = await authApi.applyTrainer(trainerData)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
      clearStoredTokens()
      localStorage.removeItem('capacita_user')
    }
  }

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getProfile()
      setUser(profile)
      localStorage.setItem('capacita_user', JSON.stringify(profile))
      return profile
    } catch (err) {
      console.error('Failed to refresh profile:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        trainerStatus: user?.trainer_status || null,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        applyTrainer,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
