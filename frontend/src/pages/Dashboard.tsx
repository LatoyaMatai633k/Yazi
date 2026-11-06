import { Link } from 'react-router-dom'

export function Dashboard() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Your developer workspace — connect a repository and start analysing.
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="metric-card">
          <div className="metric-label">AI Provider</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)' }}>OpenAI</div>
          <div className="metric-sub">GPT models</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Repository Source</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)' }}>GitHub</div>
          <div className="metric-sub">REST API</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Features</div>
          <div className="metric-value" style={{ fontSize: '1.4rem' }}>4</div>
          <div className="metric-sub">AI tools</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="section">
        <div className="section-title">Quick Actions</div>
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          <ActionCard
            title="Analyse a Repository"
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
            cta="Analyse Tests"
          />
          <ActionCard
            title="Check Deployment Readiness"
            description="Scan configuration, secrets, and production setup."
            link="/deployment"
            cta="Run Check"
          />
        </div>
      </div>

      {/* Getting started */}
      <div className="section">
        <div className="section-title">Getting Started</div>
        <div className="card">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Yazi Dev helps you understand any GitHub repository quickly. Here's the core workflow:
          </p>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Paste a GitHub repository URL into Repository Analysis.',
              'Review the AI-generated architecture and stack summary.',
              'Use Debugging to diagnose errors with stack traces.',
              'Check Testing to find gaps and get recommended test cases.',
              'Run Deployment Readiness before going to production.',
            ].map((step, i) => (
              <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
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
