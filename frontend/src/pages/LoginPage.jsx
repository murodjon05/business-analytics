import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { login as loginRequest } from '../services/api'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setSession } = useAuth()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    loginRequest(email, password)
      .then((data) => {
        setSession(data.email, data.token)
        navigate('/', { replace: true })
      })
      .catch(() => {
        setError('Invalid email or password.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-[0.9fr,1.1fr] gap-8 items-stretch">
        <div className="bg-ink-900 text-white rounded-3xl p-8 shadow-lift">
          <p className="text-xs uppercase tracking-widest text-ink-200">BitoAnalyst</p>
          <h2 className="text-3xl font-semibold mt-4">Welcome back</h2>
          <p className="text-ink-200 mt-3 text-sm">
            Secure access for your analytics team. Sign in to review dashboards, upload datasets, and manage history.
          </p>
          <div className="mt-8 space-y-3 text-sm text-ink-100">
            <div>Single workspace access</div>
            <div>Audit-ready activity history</div>
            <div>Commercial-grade ERP insights</div>
          </div>
          <div className="mt-10 text-xs text-ink-300">
            Need access? Contact your workspace admin.
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-3xl p-8 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-500">Login</p>
              <h3 className="text-2xl font-semibold text-ink-900">Sign in to your workspace</h3>
            </div>
            <Link to="/" className="text-sm text-primary-700 hover:text-primary-800">
              Back home
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">Work email</label>
              <div className="flex items-center gap-2 border border-ink-200 rounded-2xl px-4 py-3">
                <Mail className="h-4 w-4 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">Password</label>
              <div className="flex items-center gap-2 border border-ink-200 rounded-2xl px-4 py-3">
                <Lock className="h-4 w-4 text-ink-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-ink-900 text-white font-medium rounded-full hover:bg-ink-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {error && <p className="text-xs text-rose-600">{error}</p>}
            <p className="text-xs text-ink-500">
              This login is validated on the server. Use your admin credentials.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
