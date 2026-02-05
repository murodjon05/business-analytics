import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Briefcase,
  Settings2,
  CalendarClock,
} from 'lucide-react'
import { getAnalysisResult } from '../services/api'
import DataHealthTab from '../components/DataHealthTab'
import StrategyTab from '../components/StrategyTab'
import BitoActionsTab from '../components/BitoActionsTab'

const DashboardPage = () => {
  const { analysisId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('health')
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
  const dataQualityScore = analysis.cleaning_analysis?.data_quality_score

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
              #{analysis.id} · Review insights, strategy, and ERP actions.
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
          <p className="text-xs text-ink-500 uppercase tracking-widest">Data quality</p>
          <p className="text-lg font-semibold text-ink-900 mt-2">
            {dataQualityScore !== undefined ? `${dataQualityScore}/100` : 'Pending'}
          </p>
          <p className="text-xs text-ink-500 mt-1">AI validation summary</p>
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
            {[
              { id: 'health', label: 'Data health', icon: <ClipboardCheck className="h-4 w-4" /> },
              { id: 'strategy', label: 'Business strategy', icon: <Briefcase className="h-4 w-4" /> },
              { id: 'actions', label: 'ERP actions', icon: <Settings2 className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-ink-900 text-ink-900'
                    : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary-600 mb-4" />
              <p className="text-lg text-ink-600">AI is analyzing your ERP data...</p>
              <p className="text-sm text-ink-500 mt-2">This may take 30-60 seconds</p>
            </div>
          ) : (
            <>
              {activeTab === 'health' && <DataHealthTab data={analysis.cleaning_analysis} />}
              {activeTab === 'strategy' && <StrategyTab data={analysis.business_strategy} />}
              {activeTab === 'actions' && <BitoActionsTab data={analysis.erp_actions} />}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
