import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import { deleteAnalysis, listAnalyses } from '../services/api'

const STATUS_STYLES = {
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  processing: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  failed: 'bg-rose-100 text-rose-800 border-rose-200',
}

const STATUS_ICON = {
  completed: CheckCircle2,
  processing: Clock,
  pending: Clock,
  failed: XCircle,
}

const HistoryPage = () => {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const data = await listAnalyses()
        setAnalyses(data)
      } catch (err) {
        setError('Unable to load analysis history.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyses()
  }, [])

  const stats = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return analyses.reduce(
      (acc, item) => {
        acc.total += 1
        acc[item.status] = (acc[item.status] || 0) + 1
        if (item.created_at && new Date(item.created_at).getTime() >= sevenDaysAgo) {
          acc.recent += 1
        }
        return acc
      },
      { total: 0, completed: 0, processing: 0, pending: 0, failed: 0, recent: 0 }
    )
  }, [analyses])

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'processing'
          ? item.status === 'processing' || item.status === 'pending'
          : item.status === statusFilter)
      const matchesQuery = query.trim() === '' || String(item.id).includes(query.trim())
      return matchesStatus && matchesQuery
    })
  }, [analyses, statusFilter, query])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-600">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        <p className="mt-4 text-base">Loading analysis history...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-ink-100 p-8 shadow-soft text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 mb-2">History unavailable</h2>
        <p className="text-ink-600">{error}</p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center justify-center px-4 py-2 rounded-full bg-ink-900 text-white text-sm font-medium"
        >
          Start a new analysis
        </Link>
      </div>
    )
  }

  const handleDelete = async (analysisId) => {
    const confirmed = window.confirm(`Delete analysis #${analysisId}? This cannot be undone.`)
    if (!confirmed) return
    setDeletingId(analysisId)
    try {
      await deleteAnalysis(analysisId)
      setAnalyses((prev) => prev.filter((item) => item.id !== analysisId))
    } catch (err) {
      setError('Unable to delete analysis.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-500">Analysis history</p>
          <h2 className="text-3xl font-semibold text-ink-900">Every run, fully traceable</h2>
          <p className="text-ink-600 mt-2 max-w-2xl">
            Review prior analyses, monitor in-progress jobs, and return to dashboards with one click.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-ink-900 text-white text-sm font-medium shadow-soft"
        >
          New analysis
        </Link>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Completed', value: stats.completed },
          { label: 'Processing', value: stats.processing + stats.pending },
          { label: 'Failed', value: stats.failed },
          { label: 'Last 7 days', value: stats.recent },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-soft">
            <p className="text-xs text-ink-500">{item.label}</p>
            <p className="text-2xl font-semibold text-ink-900 mt-1">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="bg-white border border-ink-100 rounded-3xl shadow-soft p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Completed', value: 'completed' },
              { label: 'Processing', value: 'processing' },
              { label: 'Failed', value: 'failed' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  statusFilter === filter.value
                    ? 'bg-ink-900 text-white'
                    : 'bg-ink-100 text-ink-600 hover:text-ink-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by analysis ID"
            className="w-full lg:w-64 px-4 py-2 rounded-full border border-ink-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        {filteredAnalyses.length === 0 ? (
          <div className="text-center py-10 text-ink-500">
            No analyses match this filter yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnalyses.map((analysis) => {
              const StatusIcon = STATUS_ICON[analysis.status] || Clock
              return (
                <div
                  key={analysis.id}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border border-ink-100 rounded-2xl p-4 hover:shadow-soft transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink-900">
                        {analysis.name ? analysis.name : `Analysis #${analysis.id}`}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${STATUS_STYLES[analysis.status] || 'bg-ink-100 text-ink-700 border-ink-200'}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {analysis.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500">
                      #{analysis.id} · Created {new Date(analysis.created_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-ink-600">
                      Modules: Sales, Warehouse, Finance, CRM
                    </p>
                  </div>
                    <div className="flex items-center gap-3">
                      {analysis.status === 'failed' && (
                        <span className="text-xs text-rose-600">Requires review</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(analysis.id)}
                        disabled={deletingId === analysis.id}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-full border border-rose-200 text-rose-700 text-xs font-medium hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === analysis.id ? 'Deleting...' : 'Delete'}
                      </button>
                      <Link
                        to={`/dashboard/${analysis.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-ink-900 text-white text-sm font-medium"
                      >
                      Open dashboard
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default HistoryPage
