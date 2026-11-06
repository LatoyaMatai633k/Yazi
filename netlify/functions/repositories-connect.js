/**
 * POST /api/repositories/connect
 * Validates and retrieves metadata for a GitHub repository.
 * Note: Without a persistent database in Netlify Functions, connected repositories
 * are validated on-demand. The frontend manages session state.
 */
const { GitHubService, RepositoryNotFoundError, GitHubAuthError } = require('./lib/github')
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
  if (!url) return jsonResponse(400, { error: 'repository_url is required' })

  try {
    const gh = new GitHubService()
    const [owner, repoName] = GitHubService.parseRepoUrl(url)
    const meta = await gh.getRepository(owner, repoName)
    return jsonResponse(200, {
      id: null, // no DB in serverless mode
      provider: 'github',
      repository_url: url,
      repository_name: meta.name || repoName,
      description: meta.description,
      default_branch: meta.default_branch,
      meta,
    })
  } catch (e) {
    if (e.name === 'RepositoryNotFoundError') return jsonResponse(404, { error: e.message })
    if (e.name === 'GitHubAuthError') return jsonResponse(401, { error: e.message })
    if (e.message && e.message.startsWith('Invalid GitHub')) return jsonResponse(400, { error: e.message })
    return jsonResponse(500, { error: 'We could not connect to this repository. Please check the URL and try again.' })
  }
}
