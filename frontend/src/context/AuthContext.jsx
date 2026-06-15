import { createContext, useContext, useState, useEffect } from 'react'
import * as authApi from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login({ email, password })
    persistSession(res.data)
  }

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password })
    persistSession(res.data)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) await authApi.logout({ refreshToken })
    } catch {
      // ignore — clear session regardless
    }
    clearSession()
  }

  const persistSession = (data) => {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    const userData = { name: data.name, email: data.email }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const clearSession = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
