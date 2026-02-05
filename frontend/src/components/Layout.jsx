import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Activity, Settings, FileText, History, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }
  return (
    <div className="min-h-screen bg-ink-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-28 h-72 w-72 rounded-full bg-sand-200/40 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-ink-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-xl bg-ink-900 text-white flex items-center justify-center shadow-soft mr-3">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-ink-900">BitoAnalyst</h1>
                <p className="text-xs text-ink-500">Commercial-grade ERP intelligence</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-3">
              {[
                { to: '/', label: 'New Analysis' },
                { to: '/history', label: 'History' },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-ink-900 text-white shadow-soft'
                        : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="hidden lg:flex items-center space-x-3 text-xs text-ink-500">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-ink-100">
                <Activity className="h-3.5 w-3.5" />
                Live signals
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-ink-100">
                <Settings className="h-3.5 w-3.5" />
                Smart configs
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-ink-100">
                <Sparkles className="h-3.5 w-3.5" />
                Cerebras AI
              </span>
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-full bg-ink-900 text-white text-xs font-medium"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="md:hidden border-t border-ink-100 px-4 py-3 flex gap-2 bg-white/90">
          {[
            { to: '/', label: 'New Analysis', icon: <BarChart3 className="h-4 w-4" /> },
            { to: '/history', label: 'History', icon: <History className="h-4 w-4" /> },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-ink-900 text-white shadow-soft'
                    : 'text-ink-600 hover:text-ink-900 hover:bg-ink-100'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-medium bg-ink-900 text-white shadow-soft"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-100 bg-white/80 backdrop-blur mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-ink-500">
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span>BitoAnalyst - ERP intelligence for commercial teams</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-ink-100">SOC-ready workflows</span>
              <span className="px-3 py-1 rounded-full bg-ink-100">Export-friendly</span>
              <span className="px-3 py-1 rounded-full bg-ink-100">Governed AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
