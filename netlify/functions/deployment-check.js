/**
 * POST /api/deployment/check
 * Fetches repository config files and runs OpenAI deployment readiness analysis.
 */
const { GitHubService, RepositoryNotFoundError, GitHubAuthError } = require('./lib/github')
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

  const url = (data.repository_url || '').trim()
  const branch = data.branch || null

  if (!url) return jsonResponse(400, { error: 'repository_url is required' })

  try {
    const gh = new GitHubService()
    const ai = new OpenRouterService()

    const [owner, repo] = GitHubService.parseRepoUrl(url)
    const meta = await gh.getRepository(owner, repo)
    const effectiveBranch = branch || meta.default_branch || 'main'

    const [fileTree, configFiles, envFiles, readme] = await Promise.all([
      gh.getFileTree(owner, repo, effectiveBranch),
      gh.getConfigFiles(owner, repo, effectiveBranch),
      gh.getEnvFileNames(owner, repo, effectiveBranch),
      gh.getReadme(owner, repo, effectiveBranch),
    ])

    const payload = {
      repository_name: meta.name || repo,
      file_tree: fileTree,
      config_files: configFiles,
      env_files: envFiles,
      readme,
    }

    const result = await ai.analyzeDeployment(payload)
    return jsonResponse(200, {
      repository_meta: meta,
      analysis: result.data || {},
    })
  } catch (e) {
    if (e.name === 'RepositoryNotFoundError') return jsonResponse(404, { error: e.message })
    if (e.name === 'GitHubAuthError') return jsonResponse(401, { error: e.message })
    if (e.name === 'ConfigurationError') return jsonResponse(503, { error: 'The AI service is not configured correctly. Please check server configuration.' })
    if (e.name === 'AIServiceError') return jsonResponse(502, { error: e.message })
    if (e.message && e.message.startsWith('Invalid GitHub')) return jsonResponse(400, { error: e.message })
    return jsonResponse(500, { error: 'The AI analysis could not be completed. Please try again.' })
  }
}
