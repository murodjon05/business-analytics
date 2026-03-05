import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  CalendarClock,
  BarChart3,
} from 'lucide-react'
import { getAnalysisResult } from '../services/api'
import StrategyTab from '../components/StrategyTab'

const DashboardPage = () => {
  const { analysisId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('strategy')
  const [pollingPaused, setPollingPaused] = useState(false)
  const [pollingMessage, setPollingMessage] = useState(null)
  const pollAttempts = useRef(0)
  const pollTimeout = useRef(null)

  const scheduleNextPoll = (nextDelayMs) => {
    if (pollTimeout.current) {
      clearTimeout(pollTimeout.current)
    }
    pollTimeout.current = setTimeout(() => {
      fetchAnalysis()
    }, nextDelayMs)
  }

  const fetchAnalysis = async () => {
      try {
        const data = await getAnalysisResult(analysisId)
        setAnalysis(data)
        setPollingMessage(null)

        if (data.status === 'pending' || data.status === 'processing') {
          pollAttempts.current += 1
          const nextDelay = Math.min(3000 * Math.pow(2, pollAttempts.current - 1), 30000)
          if (pollAttempts.current >= 8) {
            setPollingPaused(true)
            setPollingMessage('Analysis is taking longer than expected. Check your worker status or refresh later.')
            return
          }
          scheduleNextPoll(nextDelay)
        } else {
          pollAttempts.current = 0
        }
      } catch (err) {
        setError('Failed to load analysis results')
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchAnalysis()
    return () => {
      if (pollTimeout.current) {
        clearTimeout(pollTimeout.current)
      }
    }
  }, [analysisId])

  const handleManualRefresh = () => {
    setPollingPaused(false)
    pollAttempts.current = 0
    fetchAnalysis()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
        <p className="mt-4 text-lg text-ink-600">Loading analysis...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-rose-700 mb-2">Error</h2>
          <p className="text-rose-600">{error}</p>
          <Link to="/" className="mt-4 inline-block text-primary-700 hover:underline">
            Back to input
          </Link>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-amber-700 mb-2">Analysis not found</h2>
          <Link to="/" className="mt-4 inline-block text-primary-700 hover:underline">
            Start a new analysis
          </Link>
        </div>
      </div>
    )
  }

  const isProcessing = analysis.status === 'pending' || analysis.status === 'processing'
  const isCompleted = analysis.status === 'completed'
  const isFailed = analysis.status === 'failed'
  const businessStrategy = analysis.business_strategy || {}
  const detectedDataTypes = businessStrategy?.detected_data_types || []
  const keyMetrics = businessStrategy?.key_metrics || {}

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/history" className="p-2 hover:bg-ink-100 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6 text-ink-600" />
          </Link>
          <div>
            <p className="text-xs uppercase tracking-widest text-ink-500">Analysis dashboard</p>
            <h2 className="text-3xl font-semibold text-ink-900">
              {analysis.name ? analysis.name : `Analysis #${analysis.id}`}
            </h2>
            <p className="text-ink-500 text-sm">
              #{analysis.id} · AI-powered business insights
            </p>
          </div>
        </div>
        <div>
          {isProcessing && (
            <span className="flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Processing...
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Completed
            </span>
          )}
          {isFailed && (
            <span className="flex items-center px-4 py-2 bg-rose-100 text-rose-800 rounded-full text-sm font-medium">
              <AlertCircle className="h-4 w-4 mr-2" />
              Failed
            </span>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-soft">
          <p className="text-xs text-ink-500 uppercase tracking-widest">Status</p>
          <p className="text-lg font-semibold text-ink-900 mt-2 capitalize">{analysis.status}</p>
          <p className="text-xs text-ink-500 mt-1">Snapshot #{analysis.erp_snapshot?.id}</p>
        </div>
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-soft">
          <p className="text-xs text-ink-500 uppercase tracking-widest">Data types detected</p>
          <p className="text-lg font-semibold text-ink-900 mt-2">
            {detectedDataTypes.length > 0 ? detectedDataTypes.join(', ') : 'Analyzing...'}
          </p>
          <p className="text-xs text-ink-500 mt-1">From your dataset</p>
        </div>
        <div className="bg-white border border-ink-100 rounded-2xl p-5 shadow-soft">
          <p className="text-xs text-ink-500 uppercase tracking-widest">Created</p>
          <p className="text-lg font-semibold text-ink-900 mt-2 inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-ink-500" />
            {analysis.created_at ? new Date(analysis.created_at).toLocaleString() : '—'}
          </p>
          <p className="text-xs text-ink-500 mt-1">Local time</p>
        </div>
      </section>

      {Object.keys(keyMetrics).length > 0 && !isProcessing && (
        <section className="bg-white rounded-2xl shadow-soft border border-ink-100 p-5">
          <h3 className="text-sm font-semibold text-ink-900 mb-4 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Key Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(keyMetrics)
              .filter(([key, value]) => value !== null && value !== undefined && typeof value !== 'object')
              .slice(0, 8)
              .map(([key, value], index) => (
                <div key={index} className="bg-ink-50 rounded-lg p-3">
                  <p className="text-xs text-ink-500 capitalize">{String(key).replace(/_/g, ' ')}</p>
                  <p className="text-lg font-semibold text-ink-900">
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      {pollingMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
          <p className="text-sm text-amber-700">{pollingMessage}</p>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="px-3 py-2 rounded-full bg-ink-900 text-white text-xs font-medium"
          >
            Refresh now
          </button>
        </div>
      )}

      {isFailed && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <h3 className="font-semibold text-rose-700 mb-2">Analysis failed</h3>
          <p className="text-rose-600">{analysis.error_message || 'An error occurred during analysis.'}</p>
        </div>
      )}

      <section className="bg-white rounded-3xl shadow-soft border border-ink-100">
        <div className="border-b border-ink-100">
          <nav className="flex flex-col md:flex-row">
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
                activeTab === 'strategy'
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Business Strategy
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
              <p className="text-lg text-ink-600">AI is analyzing your data...</p>
              <p className="text-sm text-ink-500 mt-2">This may take 30-60 seconds</p>
            </div>
          ) : isFailed ? (
            <div className="text-center py-12 text-rose-600">
              Analysis failed. Please try again.
            </div>
          ) : businessStrategy && Object.keys(businessStrategy).length > 0 ? (
            <>
              {activeTab === 'strategy' && <StrategyTab data={businessStrategy} />}
            </>
          ) : (
            <div className="text-center py-12 text-ink-500">
              No analysis results available.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
