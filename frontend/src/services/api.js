import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const AUTH_STORAGE_KEY = 'bitoanalyst_auth'

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      const session = JSON.parse(raw)
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`
      }
    }
  } catch (error) {
    // ignore
  }
  return config
})

export const login = async (email, password) => {
  const response = await api.post('/auth/login/', { email, password })
  return response.data
}

export const submitAnalysis = async (data) => {
  const response = await api.post('/analyze/', data)
  return response.data
}

export const getAnalysisResult = async (analysisId) => {
  const response = await api.get(`/results/${analysisId}/`)
  return response.data
}

export const listAnalyses = async () => {
  const response = await api.get('/analyses/')
  return response.data
}

export const deleteAnalysis = async (analysisId) => {
  const response = await api.delete(`/analyses/${analysisId}/`)
  return response.data
}

export default api
