import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
})

// ---- Repositories ----
export const listRepositories = () => api.get('/repositories')
export const connectRepository = (data: { repository_url: string }) =>
  api.post('/repositories', data)
export const deleteRepository = (id: number) => api.delete(`/repositories/${id}`)

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
  repository_id?: number
}) => api.post('/debug', data)

export const listDebugSessions = () => api.get('/debug/sessions')

// ---- Testing ----
export const analyzeTesting = (data: { repository_url: string; branch?: string }) =>
  api.post('/testing/analyze', data)

// ---- Deployment ----
export const checkDeployment = (data: { repository_url: string; branch?: string }) =>
  api.post('/deployment/check', data)

// ---- Health ----
export const checkHealth = () => api.get('/health')

export default api
