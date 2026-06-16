import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function clearSessionAndRedirect() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

// Concurrent 401s share one in-flight refresh call instead of each firing their own.
let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken')
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, { refreshToken })
      .then((res) => {
        localStorage.setItem('accessToken', res.data.accessToken)
        return res.data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// On a 401 from an expired access token, silently use the refresh token to get
// a new one and retry the original request once. Only if that refresh itself
// fails (refresh token expired/revoked) do we clear the session and redirect.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthEndpoint = config?.url?.includes('/auth/login')
      || config?.url?.includes('/auth/register')
      || config?.url?.includes('/auth/refresh')

    if (response?.status === 401 && !isAuthEndpoint && !config._retried) {
      config._retried = true
      try {
        const newToken = await refreshAccessToken()
        config.headers.Authorization = `Bearer ${newToken}`
        return api(config)
      } catch (refreshError) {
        clearSessionAndRedirect()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const googleLogin = (data) => api.post('/auth/google', data)
export const refresh = (data) => api.post('/auth/refresh', data)
export const logout = (data) => api.post('/auth/logout', data)

export default api
