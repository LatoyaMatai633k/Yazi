import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000,
})

// ---- Repository connection ----
export const connectRepository = (data: { repository_url: string }) =>
  api.post('/repositories', data)

// ---- Analysis ----
export const analyzeRepository = (data: { repository_url: string; branch?: string }) =>
  api.post('/repositories/analyze', data)

// ---- Debugging ----
export const analyzeDebug = (data: {
  error_message: string
  stack_trace?: string
  affected_file?: string
  relevant_code?: string
  context?: string
}) => api.post('/debug', data)

// ---- Testing ----
export const analyzeTesting = (data: { repository_url: string; branch?: string }) =>
  api.post('/testing/analyze', data)

// ---- Deployment ----
export const checkDeployment = (data: { repository_url: string; branch?: string }) =>
  api.post('/deployment/check', data)

// ---- Health ----
export const checkHealth = () => api.get('/health')

export default api
