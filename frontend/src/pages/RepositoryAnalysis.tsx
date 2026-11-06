import { useState } from 'react'
import { analyzeRepository } from '../services/api'

interface AnalysisData {
  project_summary?: string
  technology_stack?: string[]
  architecture?: string
  entry_points?: string[]
  important_files?: string[]
  dependencies?: string[]
  api_routes?: string[]
  database_components?: string[]
  potential_risks?: string[]
  developer_next_steps?: string[]
  raw_response?: string
}

interface AnalysisResult {
  repository_meta?: {
    name?: string
    description?: string
    language?: string
    stars?: number
    url?: string
    default_branch?: string
  }
  analysis?: AnalysisData
  analysis_id?: number
}

export function RepositoryAnalysis() {
  const [url, setUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL.')
      return
    }

    try {
      setAnalyzing(true)
      const res = await analyzeRepository({ repository_url: url.trim(), branch: branch.trim() || undefined })
      setResult(res.data)
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'We could not connect to or analyse this repository. Please try again.'
      setError(msg)
    } finally {
      setAnalyzing(false)
    }
  }

  const analysis = result?.analysis || {}

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Repository Analysis</h1>
        <p className="page-description">
          Connect a GitHub repository and get an AI-powered analysis of its architecture, technology stack, and key files.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleAnalyze}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">GitHub Repository URL</label>
              <input
                className="form-input"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={analyzing}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '140px' }}>
              <label className="form-label">Branch (optional)</label>
              <input
                className="form-input"
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="main"
                disabled={analyzing}
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={analyzing}
              style={{ alignSelf: 'flex-end' }}
            >
              {analyzing ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Analysing…</>
               : 'Analyse Repository'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {analyzing && (
        <div className="loading-overlay">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <div>OpenAI is analysing the repository…</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            This may take 20–40 seconds.
          </div>
        </div>
      )}

      {result && !analyzing && (
        <div>
          {/* Repo meta */}
          {result.repository_meta && (
            <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-code)', fontWeight: 600 }}>{result.repository_meta.name}</div>
                {result.repository_meta.description && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{result.repository_meta.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {result.repository_meta.language && <span className="badge badge-neutral">{result.repository_meta.language}</span>}
                <a href={result.repository_meta.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">View on GitHub ↗</a>
              </div>
            </div>
          )}

          {analysis.raw_response ? (
            <div className="card">
              <div className="analysis-section-title">AI Response</div>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{analysis.raw_response}</pre>
            </div>
          ) : (
            <>
              {analysis.project_summary && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="analysis-section-title">Project Summary</div>
                  <p className="analysis-text">{analysis.project_summary}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <AnalysisList title="Technology Stack" items={analysis.technology_stack} />
                <AnalysisList title="Entry Points" items={analysis.entry_points} />
                <AnalysisList title="Key Dependencies" items={analysis.dependencies} />
                <AnalysisList title="API Routes" items={analysis.api_routes} />
                <AnalysisList title="Database Components" items={analysis.database_components} />
              </div>

              {analysis.architecture && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="analysis-section-title">Architecture</div>
                  <p className="analysis-text">{analysis.architecture}</p>
                </div>
              )}

              {analysis.important_files && analysis.important_files.length > 0 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="analysis-section-title">Important Files</div>
                  <ul className="item-list">
                    {analysis.important_files.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              {analysis.potential_risks && analysis.potential_risks.length > 0 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="analysis-section-title" style={{ color: 'var(--status-warning)' }}>Potential Risks</div>
                  <ul style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                    {analysis.potential_risks.map((r, i) => (
                      <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.3rem' }}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.developer_next_steps && analysis.developer_next_steps.length > 0 && (
                <div className="card">
                  <div className="analysis-section-title" style={{ color: 'var(--status-ready)' }}>Developer Next Steps</div>
                  <ol style={{ paddingLeft: '1.2rem' }}>
                    {analysis.developer_next_steps.map((step, i) => (
                      <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.3rem' }}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            AI-generated analysis via OpenAI. Suggestions are inferences, not guarantees.
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisList({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="card">
      <div className="analysis-section-title">{title}</div>
      <div className="tag-list">
        {items.map((item, i) => <span key={i} className="tag">{item}</span>)}
      </div>
    </div>
  )
}
