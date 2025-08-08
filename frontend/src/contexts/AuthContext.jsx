import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Configure axios to include credentials
  axios.defaults.withCredentials = true

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('🔍 Frontend: Checking authentication...')
      const response = await axios.get('/api/auth/me')
      console.log('✅ Frontend: Auth check successful:', response.data)
      setUser(response.data)
    } catch (error) {
      console.log('❌ Frontend: Auth check failed:', error.response?.status || error.message)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔐 Frontend: Attempting login for:', email)
      const response = await axios.post('/api/auth/login', { email, password })
      console.log('✅ Frontend: Login response:', response.data)
      setUser(response.data.user)
      toast.success('Login successful!')
      return response.data
    } catch (error) {
      console.error('❌ Frontend: Login error:', error.response?.data || error.message)
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (name, email, password, role = 'user') => {
    try {
      console.log('🔐 Frontend: Attempting registration for:', email, 'with role:', role)
      const response = await axios.post('/api/auth/register', { name, email, password, role })
      console.log('✅ Frontend: Registration response:', response.data)
      setUser(response.data.user)
      toast.success('Registration successful!')
      return response.data
    } catch (error) {
      console.error('❌ Frontend: Registration error:', error.response?.data || error.message)
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout')
      setUser(null)
      toast.success('Logged out successfully!')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const updateProfile = async (updates) => {
    try {
      const response = await axios.put('/api/auth/me', updates)
      setUser(response.data)
      toast.success('Profile updated successfully!')
      return response.data
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed'
      toast.error(message)
      throw error
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', { currentPassword, newPassword })
      toast.success('Password changed successfully!')
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed'
      toast.error(message)
      throw error
    }
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const isAuthenticated = () => {
    return !!user
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAdmin,
    isAuthenticated,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 