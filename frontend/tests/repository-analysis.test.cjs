const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const { handler } = require('../../netlify/functions/repositories-analyze')

// Execute the actual frontend service without building the app.
const filename = path.resolve(__dirname, '../src/services/api.ts')
const frontend = new Module(filename, module)
frontend.filename = filename
frontend.paths = module.paths
frontend._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename)
const { default: api, analyzeRepository } = frontend.exports

const invoke = (httpMethod, body) => handler({ httpMethod, body })

test('unsupported methods explain POST and advertise allowed methods', async () => {
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE', 'HEAD']) {
    const response = await invoke(method)
    assert.equal(response.statusCode, 405)
    assert.equal(response.headers.Allow, 'POST, OPTIONS')
    assert.match(JSON.parse(response.body).error, /Use POST.*repository_url.*branch/)
  }
  assert.equal((await invoke('OPTIONS')).statusCode, 204)
})

test('invalid payloads return actionable 400 responses', async () => {
  for (const [body, message] of [
    ['{', 'Invalid JSON body'],
    ['null', 'Request body must be a JSON object'],
    ['[]', 'Request body must be a JSON object'],
    ['{}', 'repository_url is required and must be a string'],
    ['{"repository_url":123}', 'repository_url is required and must be a string'],
    ['{"repository_url":" "}', 'repository_url is required'],
    ['{"repository_url":"owner/repo","branch":123}', 'branch must be a string'],
  ]) {
    const response = await invoke('POST', body)
    assert.equal(response.statusCode, 400)
    assert.equal(JSON.parse(response.body).error, message)
  }
})

test('frontend POST flows through GitHub context and OpenRouter to analysis results', async (t) => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }
  const originalBaseURL = api.defaults.baseURL
  // Synthetic values only: no real credentials or paid API calls are used.
  process.env.GITHUB_TOKEN = 'test-github-value'
  process.env.OPENROUTER_API_KEY = 'test-openrouter-value'
  process.env.OPENROUTER_MODEL = 'openai/gpt-4o-mini'
  const calls = []
  let githubStatus = 200
  let openrouterStatus = 200
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options })
    if (url.startsWith('https://api.github.com/')) {
      assert.equal(options.headers.Authorization, `Bearer ${process.env.GITHUB_TOKEN}`)
      if (githubStatus !== 200) return Response.json({}, { status: githubStatus })
      if (url.endsWith('/repos/owner/repo')) {
        return Response.json({ full_name: 'owner/repo', default_branch: 'develop', html_url: 'https://github.com/owner/repo' })
      }
      if (url.includes('/git/trees/')) return Response.json({ tree: [{ type: 'blob', path: 'src/index.js' }] })
      if (url.includes('/contents/README.md')) return Response.json({ content: Buffer.from('Example repository').toString('base64') })
      if (url.includes('/contents/package.json')) return Response.json({ content: Buffer.from('{"name":"example"}').toString('base64') })
      return Response.json({}, { status: 404 })
    }
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, `Bearer ${process.env.OPENROUTER_API_KEY}`)
    const payload = JSON.parse(options.body)
    assert.equal(payload.model, 'openai/gpt-4o-mini')
    for (const content of ['owner/repo', 'Example repository', 'src/index.js', 'example']) {
      assert.ok(payload.messages[0].content.includes(content))
    }
    if (openrouterStatus !== 200) return Response.json({}, { status: openrouterStatus })
    return Response.json({ choices: [{ message: { content: '{"project_summary":"Example analysis","technology_stack":["JavaScript"]}' } }] })
  }
  const requests = []
  const server = http.createServer(async (req, res) => {
    try {
      let body = ''
      for await (const chunk of req) body += chunk
      requests.push({ method: req.method, url: req.url, contentType: req.headers['content-type'], body: JSON.parse(body) })
      assert.equal(req.url, '/api/repositories/analyze')
      const response = await invoke(req.method, body)
      res.writeHead(response.statusCode, response.headers)
      res.end(response.body)
    } catch {
      res.writeHead(500)
      res.end('{}')
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  api.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api`
  t.after(async () => {
    global.fetch = originalFetch
    process.env = originalEnv
    api.defaults.baseURL = originalBaseURL
    await new Promise(resolve => server.close(resolve))
  })

  for (const branch of [undefined, 'feature/example']) {
    calls.length = 0
    const response = await analyzeRepository({ repository_url: 'https://github.com/owner/repo', branch })
    assert.equal(response.status, 200)
    assert.equal(response.data.repository_meta.name, 'owner/repo')
    assert.equal(response.data.analysis.project_summary, 'Example analysis')
    assert.deepEqual(response.data.analysis.technology_stack, ['JavaScript'])
    const request = requests.at(-1)
    assert.equal(request.method, 'POST')
    assert.equal(request.contentType, 'application/json')
    assert.deepEqual(request.body, { repository_url: 'https://github.com/owner/repo', ...(branch ? { branch } : {}) })
    assert.ok(calls.some(call => call.url.includes(`/git/trees/${branch || 'develop'}?recursive=1`)))
    assert.ok(calls.some(call => call.url.includes(`/contents/README.md?ref=${branch || 'develop'}`)))
  }

  githubStatus = 401
  await assert.rejects(analyzeRepository({ repository_url: 'owner/repo' }), error => error.response.status === 401 && /GitHub authentication failed/.test(error.response.data.error))
  githubStatus = 404
  await assert.rejects(analyzeRepository({ repository_url: 'owner/repo' }), error => error.response.status === 404)
  githubStatus = 200
  openrouterStatus = 401
  await assert.rejects(analyzeRepository({ repository_url: 'owner/repo' }), error => error.response.status === 503)
  openrouterStatus = 503
  await assert.rejects(analyzeRepository({ repository_url: 'owner/repo' }), error => error.response.status === 502)
  delete process.env.OPENROUTER_API_KEY
  await assert.rejects(analyzeRepository({ repository_url: 'owner/repo' }), error => error.response.status === 503)
})
