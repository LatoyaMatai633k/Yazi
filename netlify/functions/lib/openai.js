/**
 * OpenRouter AI service — routes requests to OpenAI models via OpenRouter.
 * Endpoint: https://openrouter.ai/api/v1
 * All prompts are preserved from the original Python implementation.
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const APP_SITE_URL = 'https://yazidev.netlify.app'
const APP_NAME = 'Yazi Dev'

class ConfigurationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

class AIServiceError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AIServiceError'
  }
}

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY
    this.model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
  }

  _checkConfig() {
    if (!this.apiKey) {
      throw new ConfigurationError(
        'AI service is not configured correctly. Missing environment variable: OPENROUTER_API_KEY'
      )
    }
  }

  async _generate(prompt, maxTokens = 2048) {
    this._checkConfig()

    const resp = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': APP_SITE_URL,
        'X-Title': APP_NAME,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.2,
      }),
    })

    if (resp.status === 401) {
      throw new ConfigurationError('Invalid OpenRouter API key. Please check OPENROUTER_API_KEY.')
    }
    if (resp.status === 429) {
      throw new AIServiceError('OpenRouter rate limit exceeded. Please wait a moment and try again.')
    }
    if (resp.status === 503 || resp.status === 500) {
      throw new AIServiceError('OpenRouter service is temporarily unavailable. Please try again shortly.')
    }
    if (!resp.ok) {
      const body = await resp.text()
      throw new AIServiceError(`OpenRouter API error (${resp.status}): ${body}`)
    }

    const data = await resp.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new AIServiceError('OpenRouter returned an empty response.')
    return text
  }

  _parseJsonResponse(raw) {
    raw = raw.trim()
    // Try direct parse
    try { return JSON.parse(raw) } catch {}
    // Try extracting a JSON block
    const match = raw.match(/\{[\s\S]+\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
    return { raw_response: raw, parse_error: true }
  }

  // ---- Public API ----

  async healthCheck() {
    try {
      this._checkConfig()
      await this._generate('Hello', 5)
      return { status: 'ok', provider: 'openrouter', model: this.model }
    } catch (e) {
      if (e.name === 'ConfigurationError') return { status: 'misconfigured', error: e.message }
      return { status: 'error', error: e.message }
    }
  }

  async analyzeRepository(context) {
    const prompt = this._buildRepositoryPrompt(context)
    try {
      const raw = await this._generate(prompt, 2048)
      return { success: true, data: this._parseJsonResponse(raw) }
    } catch (e) {
      if (e.name === 'ConfigurationError') throw e
      throw new AIServiceError('The AI analysis could not be completed. Please try again.')
    }
  }

  async analyzeDebug(payload) {
    const prompt = this._buildDebugPrompt(payload)
    try {
      const raw = await this._generate(prompt, 1500)
      return { success: true, data: this._parseJsonResponse(raw) }
    } catch (e) {
      if (e.name === 'ConfigurationError') throw e
      throw new AIServiceError('The AI analysis could not be completed. Please try again.')
    }
  }

  async analyzeTesting(payload) {
    const prompt = this._buildTestingPrompt(payload)
    try {
      const raw = await this._generate(prompt, 2000)
      return { success: true, data: this._parseJsonResponse(raw) }
    } catch (e) {
      if (e.name === 'ConfigurationError') throw e
      throw new AIServiceError('The AI analysis could not be completed. Please try again.')
    }
  }

  async analyzeDeployment(payload) {
    const prompt = this._buildDeploymentPrompt(payload)
    try {
      const raw = await this._generate(prompt, 1500)
      return { success: true, data: this._parseJsonResponse(raw) }
    } catch (e) {
      if (e.name === 'ConfigurationError') throw e
      throw new AIServiceError('The AI analysis could not be completed. Please try again.')
    }
  }

  // ---- Prompt builders (preserved from original Python) ----

  _buildRepositoryPrompt(context) {
    const repoName = context.repository_name || 'unknown'
    const readme = (context.readme || '').substring(0, 3000) || 'Not available'
    const fileTree = (context.file_tree || '').substring(0, 2000) || 'Not available'
    const configFiles = (context.config_files || '').substring(0, 2000) || 'Not available'
    const entryPoints = (context.entry_points || '').substring(0, 1000) || 'Not available'

    return `You are a senior software architect analyzing a code repository called "${repoName}".
Based on the repository information below, produce a structured JSON analysis.

README:
${readme}

File Structure:
${fileTree}

Configuration Files:
${configFiles}

Entry Points:
${entryPoints}

Respond ONLY with a valid JSON object in this exact format:
{
  "project_summary": "One paragraph description of what this project does",
  "technology_stack": ["list", "of", "technologies"],
  "architecture": "Brief architecture description",
  "entry_points": ["list of main entry point files"],
  "important_files": ["list of important files with brief descriptions"],
  "dependencies": ["key dependencies"],
  "api_routes": ["list of API routes if detectable"],
  "database_components": ["database models or tables if detectable"],
  "potential_risks": ["potential technical risks or concerns"],
  "developer_next_steps": ["recommended next steps for a developer new to this codebase"]
}`
  }

  _buildDebugPrompt(payload) {
    const errorMessage = payload.error_message || ''
    const stackTrace = (payload.stack_trace || '').substring(0, 2000) || 'Not provided'
    const affectedFile = payload.affected_file || 'Not specified'
    const relevantCode = (payload.relevant_code || '').substring(0, 2000) || 'Not provided'
    const context = (payload.context || '').substring(0, 500) || 'None'

    return `You are a senior software engineer helping debug a code issue.

Error Message:
${errorMessage}

Stack Trace:
${stackTrace}

Affected File:
${affectedFile}

Relevant Code:
${relevantCode}

Additional Context:
${context}

Respond ONLY with a valid JSON object:
{
  "probable_cause": "Most likely cause of this error",
  "explanation": "Technical explanation of what is happening",
  "relevant_code_location": "Where in the code the issue likely originates",
  "debugging_steps": ["step 1", "step 2", "step 3"],
  "suggested_fix": "Concrete suggestion for how to fix this",
  "potential_side_effects": ["things to watch out for when fixing"],
  "recommended_test": "A test that would catch this regression in the future",
  "confidence": "high|medium|low"
}`
  }

  _buildTestingPrompt(payload) {
    const repoName = payload.repository_name || 'unknown'
    const fileTree = (payload.file_tree || '').substring(0, 2000) || 'Not available'
    const existingTests = (payload.existing_tests || '').substring(0, 2000) || 'None found'
    const sourceFiles = (payload.source_files || '').substring(0, 2000) || 'Not available'

    return `You are a senior QA engineer analyzing a project called "${repoName}" to identify testing gaps.

File Structure:
${fileTree}

Existing Tests:
${existingTests}

Source Files Context:
${sourceFiles}

Respond ONLY with a valid JSON object:
{
  "testing_summary": "Overall assessment of test coverage",
  "existing_test_count": 0,
  "coverage_assessment": "high|medium|low|unknown",
  "untested_areas": ["list of important areas without tests"],
  "suggested_test_cases": [
    {
      "name": "test name",
      "description": "what to test",
      "type": "unit|integration|e2e",
      "priority": "high|medium|low"
    }
  ],
  "edge_cases": ["important edge cases to consider"],
  "regression_risks": ["areas at risk of regression"],
  "recommended_testing_tools": ["appropriate testing frameworks for this stack"]
}`
  }

  _buildDeploymentPrompt(payload) {
    const repoName = payload.repository_name || 'unknown'
    const fileTree = (payload.file_tree || '').substring(0, 1500) || 'Not available'
    const configFiles = (payload.config_files || '').substring(0, 2000) || 'Not available'
    const envFiles = (payload.env_files || '').substring(0, 500) || 'Not available'
    const readme = (payload.readme || '').substring(0, 1000) || 'Not available'

    return `You are a DevOps engineer reviewing project "${repoName}" for deployment readiness.

File Structure:
${fileTree}

Configuration Files:
${configFiles}

Environment Files (names only, NOT values):
${envFiles}

README:
${readme}

Respond ONLY with a valid JSON object:
{
  "overall_status": "Ready|Needs Attention|Critical",
  "summary": "Overall deployment readiness summary",
  "checks": [
    {
      "category": "category name",
      "item": "what was checked",
      "status": "Ready|Needs Attention|Critical",
      "finding": "what was found",
      "recommendation": "what to do"
    }
  ],
  "missing_env_vars": ["list of likely missing environment variables"],
  "security_concerns": ["security issues to address before deployment"],
  "production_recommendations": ["general production readiness recommendations"]
}`
  }
}

module.exports = { OpenRouterService, ConfigurationError, AIServiceError }
