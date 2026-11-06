import { NavLink } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navItems = [
  { label: 'Dashboard', path: '/', icon: <HomeIcon /> },
  { label: 'Repository Analysis', path: '/analysis', icon: <SearchIcon /> },
  { label: 'Debugging', path: '/debugging', icon: <BugIcon /> },
  { label: 'Testing', path: '/testing', icon: <TestIcon /> },
  { label: 'Deployment Readiness', path: '/deployment', icon: <DeployIcon /> },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const { theme, toggle } = useTheme()

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">Yazi Dev</div>
          <div className="logo-tagline">Know your code. Build with confidence.</div>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={toggle} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </span>
          </button>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
            Powered by OpenAI
          </div>
        </div>
      </aside>
    </>
  )
}

export function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { theme, toggle } = useTheme()
  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-sm" onClick={onMenuToggle} style={{ padding: '0.4rem' }}>
        ☰
      </button>
      <div className="logo-mark" style={{ fontSize: '1.1rem' }}>Yazi Dev</div>
      <button className="theme-toggle" onClick={toggle}>
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </header>
  )
}

// --- Icons ---
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}

function BugIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.5 1.5"/>
      <path d="M14.5 3.5L16 2"/>
      <path d="M9 7.5a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z"/>
      <path d="M6.5 9H4m16 0h-2.5"/>
      <path d="M6 16.5H4m16 0h-2"/>
      <path d="M7 20c0 1.1.9 2 2 2h6a2 2 0 0 0 2-2"/>
      <path d="M7.5 13H6m12 0h-1.5"/>
    </svg>
  )
}

function TestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4m0-6h6m0 0v6m0-6h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"/>
    </svg>
  )
}

function DeployIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  )
}
