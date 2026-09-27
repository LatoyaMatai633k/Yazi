import { useState } from 'react'
import { analyzeTesting } from '../services/api'

interface TestCase {
  name?: string
  description?: string
  type?: string
  priority?: string
}

interface TestingResult {
  testing_summary?: string
  existing_test_count?: number
  coverage_assessment?: string
  untested_areas?: string[]
  suggested_test_cases?: TestCase[]
  edge_cases?: string[]
  regression_risks?: string[]
  recommended_testing_tools?: string[]
  raw_response?: string
}

export function Testing() {
  const [url, setUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ repository_meta?: any; analysis?: TestingResult } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('Please enter a GitHub repository URL.')
      return
    }

    try {
      setLoading(true)
      const res = await analyzeTesting({ repository_url: url.trim(), branch: branch.trim() || undefined })
      setResult(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'The AI analysis could not be completed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const analysis = result?.analysis || {}

  const coverageColor = (coverage?: string) => {
    if (coverage === 'high') return 'badge-ready'
    if (coverage === 'medium') return 'badge-warning'
    if (coverage === 'low') return 'badge-critical'
    return 'badge-neutral'
  }

  const priorityColor = (priority?: string) => {
    if (priority === 'high') return 'var(--status-critical)'
    if (priority === 'medium') return 'var(--status-warning)'
    return 'var(--status-ready)'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Testing Analysis</h1>
        <p className="page-description">
          Identify test gaps, missing coverage, and get AI-suggested test cases for your repository.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">GitHub Repository URL</label>
              <input
                className="form-input"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ alignSelf: 'flex-end' }}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Analyzing…</> : 'Analyze Testing'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <div>IBM watsonx.ai is reviewing test coverage…</div>
        </div>
      )}

      {result && !loading && (
        <div>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="metric-card">
              <div className="metric-label">Coverage</div>
              <span className={`badge ${coverageColor(analysis.coverage_assessment)}`} style={{ fontSize: '0.9rem', padding: '0.25rem 0.75rem' }}>
                {analysis.coverage_assessment || 'unknown'}
              </span>
            </div>
            <div className="metric-card">
              <div className="metric-label">Detected Tests</div>
              <div className="metric-value">{analysis.existing_test_count ?? '?'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Untested Areas</div>
              <div className="metric-value" style={{ color: 'var(--status-warning)' }}>
                {analysis.untested_areas?.length ?? 0}
              </div>
            </div>
          </div>

          {analysis.testing_summary && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="analysis-section-title">Testing Summary</div>
              <p className="analysis-text">{analysis.testing_summary}</p>
            </div>
          )}

          {analysis.untested_areas && analysis.untested_areas.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="analysis-section-title" style={{ color: 'var(--status-warning)' }}>Untested Areas</div>
              <ul className="item-list">
                {analysis.untested_areas.map((area, i) => <li key={i}>{area}</li>)}
              </ul>
            </div>
          )}

          {analysis.suggested_test_cases && analysis.suggested_test_cases.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="analysis-section-title">Suggested Test Cases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {analysis.suggested_test_cases.map((tc, i) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'var(--surface-2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tc.name}</div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {tc.type && <span className="badge badge-neutral">{tc.type}</span>}
                        {tc.priority && (
                          <span className="badge" style={{ background: 'transparent', border: `1px solid ${priorityColor(tc.priority)}`, color: priorityColor(tc.priority) }}>
                            {tc.priority}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tc.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {analysis.edge_cases && analysis.edge_cases.length > 0 && (
              <div className="card">
                <div className="analysis-section-title">Edge Cases</div>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                  {analysis.edge_cases.map((ec, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.3rem' }}>{ec}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.regression_risks && analysis.regression_risks.length > 0 && (
              <div className="card">
                <div className="analysis-section-title" style={{ color: 'var(--status-critical)' }}>Regression Risks</div>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                  {analysis.regression_risks.map((rr, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.3rem' }}>{rr}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {analysis.recommended_testing_tools && analysis.recommended_testing_tools.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="analysis-section-title">Recommended Testing Tools</div>
              <div className="tag-list">
                {analysis.recommended_testing_tools.map((t, i) => <span key={i} className="tag">{t}</span>)}
              </div>
            </div>
          )}

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            AI-generated testing analysis via IBM watsonx.ai.
          </div>
        </div>
      )}
    </div>
  )
}
