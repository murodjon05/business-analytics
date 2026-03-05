import { useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Upload,
  Loader2,
  FileJson,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  History,
  Table2,
  X,
} from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { submitAnalysis, listAnalyses } from '../services/api'

const SAMPLE_DATA = {
  sales: {
    total_orders: 420,
    cancelled: 68,
    aov: 23,
    repeat: '17%'
  },
  warehouse: {
    skus: 310,
    out_of_stock: 47,
    dead_stock: 92
  },
  finance: {
    revenue: 9660,
    expenses: 8900,
    profit: 760
  },
  crm: {
    leads: 510,
    converted: 84,
    lost: 312
  }
}

const FIELD_ALIASES = {
  totalorders: 'total_orders',
  total_order: 'total_orders',
  orders: 'total_orders',
  cancelledorders: 'cancelled',
  cancellations: 'cancelled',
  avgordervalue: 'aov',
  averageordervalue: 'aov',
  repeatrate: 'repeat',
  skus: 'skus',
  outofstock: 'out_of_stock',
  stockouts: 'out_of_stock',
  deadstock: 'dead_stock',
  revenue: 'revenue',
  expenses: 'expenses',
  profit: 'profit',
  leads: 'leads',
  converted: 'converted',
  lost: 'lost',
}

const FIELD_TO_SECTION = {
  total_orders: 'sales',
  cancelled: 'sales',
  aov: 'sales',
  repeat: 'sales',
  skus: 'warehouse',
  out_of_stock: 'warehouse',
  dead_stock: 'warehouse',
  revenue: 'finance',
  expenses: 'finance',
  profit: 'finance',
  leads: 'crm',
  converted: 'crm',
  lost: 'crm',
}

const normalizeKey = (value) => {
  if (!value) return ''
  const cleaned = String(value).toLowerCase().replace(/[^a-z0-9]/g, '')
  return FIELD_ALIASES[cleaned] || cleaned
}

const coerceValue = (value) => {
  if (value === undefined || value === null) return value
  if (typeof value === 'number') return value
  const trimmed = String(value).trim()
  if (trimmed === '') return trimmed
  if (trimmed.endsWith('%')) return trimmed
  const asNumber = Number(trimmed)
  return Number.isNaN(asNumber) ? trimmed : asNumber
}

const calculateStats = (rows) => {
  if (!rows || rows.length === 0) return null
  
  const columns = Object.keys(rows[0] || {})
  const stats = {}

  columns.forEach(col => {
    const values = rows.map(r => r[col]).filter(v => v !== undefined && v !== null && v !== '')
    const numericValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).map(v => parseFloat(v))
    
    if (numericValues.length > 0) {
      stats[col] = {
        sum: Math.round(numericValues.reduce((a, b) => a + b, 0) * 100) / 100,
        avg: Math.round((numericValues.reduce((a, b) => a + b, 0) / numericValues.length) * 100) / 100,
        max: Math.max(...numericValues),
        min: Math.min(...numericValues),
        count: numericValues.length,
        type: 'numeric'
      }
    } else {
      const unique = [...new Set(values.map(String))]
      stats[col] = {
        unique: unique.length,
        sample: unique.slice(0, 5),
        type: 'string'
      }
    }
  })

  return { totalRows: rows.length, columns, stats }
}

const DataPreview = ({ data }) => {
  const stats = useMemo(() => calculateStats(data), [data])

  if (!stats) {
    return <div className="text-sm text-ink-500">No data to preview</div>
  }

  const numericCols = Object.entries(stats.stats).filter(([, v]) => v.type === 'numeric').slice(0, 6)
  const sampleRows = data.slice(0, 5)
  const columns = stats.columns.slice(0, 8)

  return (
    <div className="space-y-4">
      <div className="bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 text-sm">
        <span className="font-medium text-primary-700">{stats.totalRows} rows</span>
        <span className="text-primary-600"> × {stats.columns.length} columns</span>
      </div>

      {numericCols.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-ink-600 mb-2">Key Metrics</h4>
          <div className="grid grid-cols-2 gap-2">
            {numericCols.map(([col, s]) => (
              <div key={col} className="bg-ink-50 rounded-lg p-3">
                <p className="text-xs text-ink-500 truncate">{col}</p>
                <p className="text-lg font-semibold text-ink-900">{s.sum.toLocaleString()}</p>
                <p className="text-xs text-ink-500">avg: {s.avg.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-medium text-ink-600 mb-2">Sample Data (first 5 rows)</h4>
        <div className="overflow-x-auto rounded-lg border border-ink-100">
          <table className="w-full text-xs">
            <thead className="bg-ink-50">
              <tr>
                {columns.map(col => (
                  <th key={col} className="text-left px-2 py-1.5 font-medium text-ink-600 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row, i) => (
                <tr key={i} className="border-t border-ink-100">
                  {columns.map(col => (
                    <td key={col} className="px-2 py-1.5 text-ink-700 whitespace-nowrap truncate max-w-[120px]">
                      {row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stats.totalRows > 5 && (
          <p className="text-xs text-ink-400 mt-1 text-center">+ {stats.totalRows - 5} more rows</p>
        )}
      </div>
    </div>
  )
}

const InputPage = () => {
  const navigate = useNavigate()
  const [inputMode, setInputMode] = useState('upload')
  const [inputData, setInputData] = useState(JSON.stringify(SAMPLE_DATA, null, 2))
  const [analysisName, setAnalysisName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [rawData, setRawData] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recentAnalyses, setRecentAnalyses] = useState([])

  useEffect(() => {
    listAnalyses().then(d => setRecentAnalyses(d.slice(0, 3))).catch(() => setRecentAnalyses([]))
  }, [])

  const parseFile = async (file) => {
    setFileError(null)
    setRawData(null)
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()

    try {
      if (ext === 'json') {
        const text = await file.text()
        const payload = JSON.parse(text)
        setRawData(Array.isArray(payload) ? payload : payload.rows || [payload])
      } else if (ext === 'csv') {
        const text = await file.text()
        const result = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
        if (result.errors?.length) throw new Error('CSV parsing failed')
        setRawData(result.data)
      } else if (ext === 'xls' || ext === 'xlsx') {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' })
        setRawData(rows)
      } else {
        throw new Error('Unsupported format')
      }
    } catch (e) {
      setFileError(e.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!analysisName.trim()) {
        throw new Error('Analysis name is required')
      }
      const payload = inputMode === 'upload' ? rawData : JSON.parse(inputData)
      if (!payload) throw new Error('No data')
      
      const result = await submitAnalysis({ payload: payload, name: analysisName.trim() })
      navigate(`/dashboard/${result.analysis_id}`)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit')
      setLoading(false)
    }
  }

  const loadSample = () => {
    setInputMode('paste')
    setInputData(JSON.stringify(SAMPLE_DATA, null, 2))
    setAnalysisName('Sample Analysis')
    setRawData(null)
    setSelectedFile(null)
  }

  const deselectFile = () => {
    setSelectedFile(null)
    setRawData(null)
    setFileError(null)
  }

  const MAX_ROWS = 500
  const isOverLimit = rawData && rawData.length > MAX_ROWS
  const canSubmit = loading || !analysisName.trim() || (inputMode === 'upload' && !rawData) || isOverLimit

  return (
    <div className="space-y-10">
      <section className={`grid gap-8 items-start ${rawData ? 'lg:grid-cols-[380px,1fr]' : 'lg:grid-cols-[1fr,0.9fr]'}`}>
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-soft border border-ink-100 p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-500">New analysis</p>
              <h2 className="text-2xl font-semibold text-ink-900">Upload data</h2>
              <p className="text-ink-600 text-sm mt-1">Upload any JSON or CSV file for AI analysis</p>
            </div>
            <button type="button" onClick={loadSample} className="px-4 py-2 text-sm font-medium text-ink-700 bg-ink-100 rounded-full hover:bg-ink-200">
              Load sample
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5" />
              <span className="text-rose-700 text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            {[
              { label: 'Upload file', value: 'upload', icon: <Upload className="h-4 w-4" /> },
              { label: 'Paste JSON', value: 'paste', icon: <FileJson className="h-4 w-4" /> },
            ].map(mode => (
              <button
                key={mode.value}
                type="button"
                onClick={() => { setInputMode(mode.value); setRawData(null); setSelectedFile(null) }}
                className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 ${
                  inputMode === mode.value ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-700'
                }`}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>

          {inputMode === 'upload' ? (
            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept=".csv,.json,.xls,.xlsx"
                  onChange={e => { setSelectedFile(e.target.files?.[0]); parseFile(e.target.files?.[0]) }}
                  className="hidden"
                />
                <div className={`border-2 border-dashed border-ink-200 rounded-2xl p-6 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition ${selectedFile ? 'border-primary-300 bg-primary-50' : ''}`}>
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-primary-600" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-ink-900">{selectedFile.name}</p>
                        <p className="text-xs text-ink-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); deselectFile() }}
                        className="p-1 hover:bg-ink-200 rounded-full"
                      >
                        <X className="h-5 w-5 text-ink-500" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-ink-400 mx-auto mb-2" />
                      <p className="text-ink-600">Drop CSV/JSON file or click to upload</p>
                    </>
                  )}
                </div>
              </label>
              {fileError && <p className="text-sm text-rose-600">{fileError}</p>}
              {isOverLimit && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  Dataset has {rawData.length} rows. Maximum allowed is {MAX_ROWS}. Please reduce your data.
                </p>
              )}
            </div>
          ) : (
            <textarea
              value={inputData}
              onChange={e => setInputData(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-ink-200 rounded-2xl font-mono text-sm bg-ink-50 focus:ring-2 focus:ring-primary-400"
              placeholder='{"sales": {"revenue": 1000}, ...}'
            />
          )}

          <div className="space-y-3">
            <input
              type="text"
              value={analysisName}
              onChange={e => setAnalysisName(e.target.value)}
              placeholder="Analysis name *"
              className="w-full px-4 py-2.5 border border-ink-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-400"
            />
            <button
              type="submit"
              disabled={canSubmit}
              className="w-full flex items-center justify-center px-6 py-3 bg-ink-900 text-white font-medium rounded-xl hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Analyzing...</> : <><Upload className="h-5 w-5 mr-2" /> Start analysis</>}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {rawData ? (
            <div className="bg-white border border-ink-100 rounded-3xl p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-ink-900 flex items-center gap-2 mb-4">
                <Table2 className="h-5 w-5" />
                Data Preview
              </h3>
              <DataPreview data={rawData} />
            </div>
          ) : (
            <div className="bg-white border border-ink-100 rounded-3xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ink-900">Recent</h3>
                <Link to="/history" className="text-xs font-medium text-primary-700 flex items-center gap-1">
                  <History className="h-3.5 w-3.5" /> View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentAnalyses.length === 0 ? (
                  <p className="text-sm text-ink-500">No analyses yet</p>
                ) : (
                  recentAnalyses.map(a => (
                    <Link key={a.id} to={`/dashboard/${a.id}`} className="flex items-center justify-between border border-ink-100 rounded-2xl px-4 py-3 hover:shadow-soft">
                      <div>
                        <p className="text-sm font-medium text-ink-900">{a.name || `Analysis #${a.id}`}</p>
                        <p className="text-xs text-ink-500">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        a.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>{a.status}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default InputPage
