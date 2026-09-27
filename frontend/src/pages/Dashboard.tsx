import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRepositories, listDebugSessions } from '../services/api'

interface Repository {
  id: number
  repository_name: string
  repository_url: string
  provider: string
  created_at: string
}

interface Session {
  id: number
  error_input: string
  status: string
  created_at: string
}

export function Dashboard() {
  const [repos, setRepos] = useState<Repository[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listRepositories(), listDebugSessions()])
      .then(([repoRes, sessRes]) => {
        setRepos(repoRes.data)
        setSessions(sessRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Your developer workspace — repositories, sessions, and recent activity.
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="metric-card">
          <div className="metric-label">Repositories</div>
          <div className="metric-value">{repos.length}</div>
          <div className="metric-sub">connected</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Debug Sessions</div>
          <div className="metric-value">{sessions.length}</div>
          <div className="metric-sub">total</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">AI Provider</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)' }}>IBM watsonx</div>
          <div className="metric-sub">Granite</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="section">
        <div className="section-title">Quick Actions</div>
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          <ActionCard
            title="Analyze a Repository"
            description="Understand codebase architecture, technology stack, and key files."
            link="/analysis"
            cta="Start Analysis"
          />
          <ActionCard
            title="Debug an Error"
            description="Paste an error and stack trace for AI-powered diagnosis."
            link="/debugging"
            cta="Debug Now"
          />
          <ActionCard
            title="Review Test Coverage"
            description="Identify missing tests and get suggestions for edge cases."
            link="/testing"
            cta="Analyze Tests"
          />
          <ActionCard
            title="Check Deployment Readiness"
            description="Scan configuration, secrets, and production setup."
            link="/deployment"
            cta="Run Check"
          />
        </div>
      </div>

      {/* Repositories */}
      <div className="section">
        <div className="section-title">Connected Repositories</div>
        {loading ? (
          <div className="loading-overlay"><div className="spinner" /><span>Loading…</span></div>
        ) : repos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <div className="empty-state-title">No repositories connected yet</div>
            <div className="empty-state-text">Head to Repository Analysis to connect your first GitHub repository.</div>
            <Link to="/analysis" className="btn btn-primary btn-sm">Connect Repository</Link>
          </div>
        ) : (
          <div className="card-grid">
            {repos.map(repo => (
              <div className="card" key={repo.id}>
                <div className="card-title" style={{ fontFamily: 'var(--font-code)', fontSize: '0.9rem' }}>
                  {repo.repository_name}
                </div>
                <div className="card-subtitle" style={{ fontFamily: 'var(--font-code)', fontSize: '0.78rem' }}>
                  {repo.repository_url}
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <Link to="/analysis" className="btn btn-secondary btn-sm">Analyze</Link>
                  <Link to="/debugging" className="btn btn-ghost btn-sm">Debug</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent debugging sessions */}
      {sessions.length > 0 && (
        <div className="section">
          <div className="section-title">Recent Debug Sessions</div>
          <div className="card">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-code)', fontSize: '0.82rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '1rem' }}>
                  {s.error_input.substring(0, 80)}…
                </div>
                <span className="badge badge-neutral">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionCard({ title, description, link, cta }: { title: string; description: string; link: string; cta: string }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div className="card-title">{title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>{description}</div>
      <Link to={link} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>{cta}</Link>
    </div>
  )
}
