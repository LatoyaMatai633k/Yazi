/**
 * POST /api/debug
 * Runs AI-powered debug analysis on an error message + context.
 */
const { OpenRouterService, ConfigurationError, AIServiceError } = require('./lib/openai')
const { jsonResponse, handleOptions, methodNotAllowed } = require('./lib/helpers')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions()
  if (event.httpMethod !== 'POST') return methodNotAllowed()

  let data = {}
  try {
    data = JSON.parse(event.body || '{}')
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' })
  }

  const errorMessage = (data.error_message || '').trim()
  if (!errorMessage) return jsonResponse(400, { error: 'error_message is required' })

  const payload = {
    error_message: errorMessage,
    stack_trace: (data.stack_trace || '').substring(0, 3000),
    affected_file: (data.affected_file || '').substring(0, 255),
    relevant_code: (data.relevant_code || '').substring(0, 3000),
    context: (data.context || '').substring(0, 500),
  }

  try {
    const ai = new OpenRouterService()
    const result = await ai.analyzeDebug(payload)
    return jsonResponse(200, result)
  } catch (e) {
    if (e.name === 'ConfigurationError') return jsonResponse(503, { error: 'The AI service is not configured correctly. Please check server configuration.' })
    if (e.name === 'AIServiceError') return jsonResponse(502, { error: e.message })
    return jsonResponse(500, { error: 'The AI analysis could not be completed. Please try again.' })
  }
}
