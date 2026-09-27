import { useState } from 'react'
import { analyzeDebug } from '../services/api'

interface DebugResult {
  probable_cause?: string
  explanation?: string
  relevant_code_location?: string
  debugging_steps?: string[]
  suggested_fix?: string
  potential_side_effects?: string[]
  recommended_test?: string
  confidence?: string
  raw_response?: string
}

export function Debugging() {
  const [form, setForm] = useState({
    error_message: '',
    stack_trace: '',
    affected_file: '',
    relevant_code: '',
    context: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<DebugResult | null>(null)

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!form.error_message.trim()) {
      setError('Please enter an error message to analyze.')
      return
    }

    try {
      setLoading(true)
      const res = await analyzeDebug({
        error_message: form.error_message,
        stack_trace: form.stack_trace,
        affected_file: form.affected_file,
        relevant_code: form.relevant_code,
        context: form.context,
      })
      setResult(res.data?.data || {})
    } catch (err: any) {
      setError(err?.response?.data?.error || 'The AI analysis could not be completed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Debugging</h1>
        <p className="page-description">
          Provide an error and context — IBM watsonx.ai will analyze the probable cause and suggest a fix.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Input form */}
        <div>
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="form-group">
                <label className="form-label">Error Message *</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.error_message}
                  onChange={handleChange('error_message')}
                  placeholder="TypeError: Cannot read properties of undefined"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Stack Trace</label>
                <textarea
                  className="form-textarea"
                  value={form.stack_trace}
                  onChange={handleChange('stack_trace')}
                  placeholder="Paste the full stack trace here…"
                  rows={6}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Affected File</label>
                <input
                  className="form-input"
                  value={form.affected_file}
                  onChange={handleChange('affected_file')}
                  placeholder="src/services/userService.js"
                  disabled={loading}
                  style={{ fontFamily: 'var(--font-code)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relevant Code</label>
                <textarea
                  className="form-textarea"
                  value={form.relevant_code}
                  onChange={handleChange('relevant_code')}
                  placeholder="Paste the relevant code snippet…"
                  rows={6}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Additional Context</label>
                <input
                  className="form-input"
                  value={form.context}
                  onChange={handleChange('context')}
                  placeholder="e.g. This happens after a user logs out"
                  disabled={loading}
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Analyzing with IBM watsonx.ai…</> : 'Analyze Error'}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div>
          {loading && (
            <div className="loading-overlay">
              <div className="spinner" style={{ width: 28, height: 28 }} />
              <div>Analyzing with IBM watsonx.ai…</div>
            </div>
          )}

          {result && !loading && (
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div className="analysis-section-title">Debug Analysis</div>
                  {result.confidence && (
                    <span className={`badge ${result.confidence === 'high' ? 'badge-ready' : result.confidence === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
                      {result.confidence} confidence
                    </span>
                  )}
                </div>

                {result.probable_cause && (
                  <div className="analysis-section">
                    <div className="analysis-section-title">Probable Cause</div>
                    <p className="analysis-text">{result.probable_cause}</p>
                  </div>
                )}

                {result.explanation && (
                  <div className="analysis-section">
                    <div className="analysis-section-title">Explanation</div>
                    <p className="analysis-text">{result.explanation}</p>
                  </div>
                )}

                {result.relevant_code_location && (
                  <div className="analysis-section">
                    <div className="analysis-section-title">Code Location</div>
                    <code style={{ fontFamily: 'var(--font-code)', fontSize: '0.85rem', background: 'var(--code-bg)', padding: '0.3rem 0.6rem', borderRadius: '4px', display: 'inline-block' }}>
                      {result.relevant_code_location}
                    </code>
                  </div>
                )}
              </div>

              {result.suggested_fix && (
                <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--border-strong)' }}>
                  <div className="analysis-section-title" style={{ color: 'var(--status-ready)' }}>Suggested Fix</div>
                  <p className="analysis-text">{result.suggested_fix}</p>
                </div>
              )}

              {result.debugging_steps && result.debugging_steps.length > 0 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="analysis-section-title">Debugging Steps</div>
                  <ol style={{ paddingLeft: '1.2rem' }}>
                    {result.debugging_steps.map((step, i) => (
                      <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.4rem' }}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {result.potential_side_effects && result.potential_side_effects.length > 0 && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="analysis-section-title" style={{ color: 'var(--status-warning)' }}>Side Effects to Watch</div>
                  <ul style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                    {result.potential_side_effects.map((s, i) => (
                      <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommended_test && (
                <div className="card">
                  <div className="analysis-section-title">Recommended Regression Test</div>
                  <p className="analysis-text">{result.recommended_test}</p>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                AI-generated suggestions via IBM watsonx.ai. Verify all recommendations before applying to production code.
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="empty-state" style={{ border: '1px dashed var(--border)', borderRadius: '8px' }}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Awaiting error details</div>
              <div className="empty-state-text">
                Fill in the error message and any available context, then click Analyze Error.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
