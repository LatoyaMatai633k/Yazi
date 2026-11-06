/**
 * GitHub service — fetches repository metadata and structure via the GitHub REST API.
 * Ported from backend/app/services/github_service.py
 */

const GITHUB_API = 'https://api.github.com'

class RepositoryNotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RepositoryNotFoundError'
  }
}

class GitHubAuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'GitHubAuthError'
  }
}

class GitHubService {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN
  }

  _headers() {
    const h = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (this.token) h['Authorization'] = `Bearer ${this.token}`
    return h
  }

  async _get(path) {
    const url = `${GITHUB_API}${path}`
    const resp = await fetch(url, { headers: this._headers() })

    if (resp.status === 404) {
      throw new RepositoryNotFoundError(
        'We could not connect to this repository. Please check the repository URL and try again.'
      )
    }
    if (resp.status === 401) {
      throw new GitHubAuthError(
        'GitHub authentication failed. Please check your GITHUB_TOKEN configuration.'
      )
    }
    if (resp.status === 403) {
      throw new GitHubAuthError(
        'GitHub API rate limit exceeded or access denied. Please provide a valid GITHUB_TOKEN.'
      )
    }
    if (!resp.ok) {
      throw new Error(`GitHub API error: ${resp.status} ${resp.statusText}`)
    }
    return resp.json()
  }

  static parseRepoUrl(url) {
    url = url.trim().replace(/\/$/, '')
    // Full URL
    const fullMatch = url.match(
      /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i
    )
    if (fullMatch) return [fullMatch[1], fullMatch[2]]
    // owner/repo shorthand
    const shortMatch = url.match(/^([^/]+)\/([^/]+)$/)
    if (shortMatch) return [shortMatch[1], shortMatch[2]]
    throw new Error(
      `Invalid GitHub repository URL or identifier: ${url}. Expected format: https://github.com/owner/repo or owner/repo`
    )
  }

  async getRepository(owner, repo) {
    const resp = await this._get(`/repos/${owner}/${repo}`)
    return {
      name: resp.full_name,
      description: resp.description,
      default_branch: resp.default_branch || 'main',
      language: resp.language,
      stars: resp.stargazers_count || 0,
      forks: resp.forks_count || 0,
      open_issues: resp.open_issues_count || 0,
      url: resp.html_url,
      private: resp.private || false,
    }
  }

  async getFileTree(owner, repo, branch = 'main', maxFiles = 300) {
    let resp
    try {
      resp = await this._get(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
    } catch {
      const meta = await this.getRepository(owner, repo)
      branch = meta.default_branch || 'main'
      resp = await this._get(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
    }
    const tree = resp.tree || []
    const lines = []
    for (const item of tree.slice(0, maxFiles)) {
      if (item.type === 'blob' || item.type === 'tree') {
        lines.push(item.path || '')
      }
    }
    return lines.join('\n')
  }

  async getFileContent(owner, repo, path, branch = 'main') {
    try {
      const resp = await this._get(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`)
      const content = resp.content || ''
      const encoding = resp.encoding || 'base64'
      if (encoding === 'base64') {
        return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf-8')
      }
      return content
    } catch {
      return null
    }
  }

  async getReadme(owner, repo, branch = 'main') {
    for (const name of ['README.md', 'README.rst', 'README.txt', 'README']) {
      const content = await this.getFileContent(owner, repo, name, branch)
      if (content) return content
    }
    return ''
  }

  async getConfigFiles(owner, repo, branch = 'main') {
    const configNames = [
      'package.json', 'requirements.txt', 'pyproject.toml',
      'Pipfile', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
      'docker-compose.yml', 'Dockerfile', '.env.example',
      'vite.config.js', 'vite.config.ts', 'webpack.config.js',
      'tsconfig.json', '.eslintrc.json', 'setup.py', 'setup.cfg',
    ]
    const collected = []
    for (const name of configNames) {
      const content = await this.getFileContent(owner, repo, name, branch)
      if (content) {
        collected.push(`=== ${name} ===\n${content.substring(0, 800)}`)
      }
      if (collected.join('\n\n').length > 4000) break
    }
    return collected.join('\n\n')
  }

  async getEnvFileNames(owner, repo, branch = 'main') {
    const fileTree = await this.getFileTree(owner, repo, branch)
    const envPatterns = ['.env', '.env.example', '.env.sample', '.env.local', '.env.production']
    const found = []
    for (const line of fileTree.split('\n')) {
      if (envPatterns.some(p => line.endsWith(p) || line === p.replace(/^\./, ''))) {
        found.push(line)
      }
    }
    return found.join('\n')
  }

  async getTestFiles(owner, repo, branch = 'main') {
    const fileTree = await this.getFileTree(owner, repo, branch)
    const testLines = fileTree.split('\n').filter(line =>
      ['test', 'spec', '__tests__', 'tests/', '/tests'].some(kw => line.toLowerCase().includes(kw))
    )
    return testLines.slice(0, 100).join('\n')
  }
}

module.exports = { GitHubService, RepositoryNotFoundError, GitHubAuthError }
