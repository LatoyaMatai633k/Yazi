/**
 * GET /api/health — Health check + AI status
 */
const { OpenRouterService } = require('./lib/openai')
const { jsonResponse, handleOptions } = require('./lib/helpers')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions()

  try {
    const ai = new OpenRouterService()
    const status = await ai.healthCheck()
    return jsonResponse(200, {
      status: 'ok',
      ai: status,
      version: '2.0.0',
    })
  } catch (e) {
    return jsonResponse(200, {
      status: 'ok',
      ai: { status: 'error', error: e.message },
      version: '2.0.0',
    })
  }
}
