import { useState } from 'react'
import { checkDeployment } from '../services/api'

interface CheckItem {
  category?: string
  item?: string
  status?: string
  finding?: string
  recommendation?: string
}

interface DeploymentResult {
  overall_status?: string
  summary?: string
  checks?: CheckItem[]
  missing_env_vars?: string[]
  security_concerns?: string[]
  production_recommendations?: string[]
  raw_response?: string
}

function statusBadgeClass(status?: string) {
  if (!status) return 'badge-neutral'
  const s = status.toLowerCase()
  if (s === 'ready') return 'badge-ready'
  if (s.includes('needs') || s.includes('attention') || s.includes('warning')) return 'badge-warning'
  if (s === 'critical') return 'badge-critical'
  return 'badge-neutral'
}

export function DeploymentReadiness() {
  const [url, setUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ repository_meta?: any; analysis?: DeploymentResult } | null>(null)

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
      const res = await checkDeployment({ repository_url: url.trim(), branch: branch.trim() || undefined })
      setResult(res.data)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'The deployment check could not be completed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const analysis = result?.analysis || {}

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Deployment Readiness</h1>
        <p className="page-description">
          Check your repository's configuration, environment variables, and production setup before deploying.
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
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Checking…</> : 'Run Deployment Check'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <div>IBM watsonx.ai is reviewing deployment configuration…</div>
        </div>
      )}

      {result && !loading && (
        <div>
          {/* Overall status */}
          <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Overall Status
              </div>
              <span className={`badge ${statusBadgeClass(analysis.overall_status)}`} style={{ fontSize: '1rem', padding: '0.3rem 1rem' }}>
                {analysis.overall_status || 'Unknown'}
              </span>
            </div>
            {analysis.summary && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '600px' }}>{analysis.summary}</p>
            )}
          </div>

          {/* Check items */}
          {analysis.checks && analysis.checks.length > 0 && (
            <div className="section">
              <div className="section-title">Checks</div>
              {analysis.checks.map((check, i) => (
                <div className="check-item" key={i}>
                  <span className={`badge ${statusBadgeClass(check.status)}`} style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}>
                    {check.status || '—'}
                  </span>
                  <div className="check-item-content">
                    {check.category && (
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        {check.category}
                      </div>
                    )}
                    <div className="check-item-name">{check.item}</div>
                    {check.finding && <div className="check-item-finding">{check.finding}</div>}
                    {check.recommendation && <div className="check-item-rec">→ {check.recommendation}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {analysis.missing_env_vars && analysis.missing_env_vars.length > 0 && (
              <div className="card">
                <div className="analysis-section-title" style={{ color: 'var(--status-warning)' }}>Missing Environment Variables</div>
                <ul className="item-list">
                  {analysis.missing_env_vars.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              </div>
            )}

            {analysis.security_concerns && analysis.security_concerns.length > 0 && (
              <div className="card">
                <div className="analysis-section-title" style={{ color: 'var(--status-critical)' }}>Security Concerns</div>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                  {analysis.security_concerns.map((s, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.3rem' }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {analysis.production_recommendations && analysis.production_recommendations.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="analysis-section-title" style={{ color: 'var(--status-ready)' }}>Production Recommendations</div>
              <ol style={{ paddingLeft: '1.2rem' }}>
                {analysis.production_recommendations.map((r, i) => (
                  <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.3rem' }}>{r}</li>
                ))}
              </ol>
            </div>
          )}

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            AI-generated deployment analysis via IBM watsonx.ai. These are recommendations, not guarantees of production safety.
          </div>
        </div>
      )}
    </div>
  )
}
