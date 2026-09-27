import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import { Sidebar, Topbar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { RepositoryAnalysis } from './pages/RepositoryAnalysis'
import { Debugging } from './pages/Debugging'
import { Testing } from './pages/Testing'
import { DeploymentReadiness } from './pages/DeploymentReadiness'
import './styles/globals.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="main-content">
            <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analysis" element={<RepositoryAnalysis />} />
              <Route path="/debugging" element={<Debugging />} />
              <Route path="/testing" element={<Testing />} />
              <Route path="/deployment" element={<DeploymentReadiness />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
