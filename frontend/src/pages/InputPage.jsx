import { useMemo, useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Upload,
  Loader2,
  FileJson,
  AlertCircle,
  Settings,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  History,
  Sparkles,
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

const REQUIRED_FIELDS = {
  sales: ['total_orders', 'cancelled', 'aov', 'repeat'],
  warehouse: ['skus', 'out_of_stock', 'dead_stock'],
  finance: ['revenue', 'expenses', 'profit'],
  crm: ['leads', 'converted', 'lost'],
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
  repeatcustomers: 'repeat',
  skus: 'skus',
  stockkeepingunits: 'skus',
  outofstock: 'out_of_stock',
  stockouts: 'out_of_stock',
  deadstock: 'dead_stock',
  overstocks: 'dead_stock',
  revenue: 'revenue',
  expenses: 'expenses',
  profit: 'profit',
  netprofit: 'profit',
  leads: 'leads',
  converted: 'converted',
  conversions: 'converted',
  lost: 'lost',
  lostleads: 'lost',
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

const CSV_TEMPLATE = `total_orders,cancelled,aov,repeat,skus,out_of_stock,dead_stock,revenue,expenses,profit,leads,converted,lost\n420,68,23,17%,310,47,92,9660,8900,760,510,84,312\n`

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

const buildErpDataFromRows = (rows) => {
  if (!rows || rows.length === 0) return null
  const sample = rows[0]
  const keys = Object.keys(sample || {}).map((key) => key.toLowerCase())
  const usesKeyValue = keys.includes('metric') && (keys.includes('category') || keys.includes('section') || keys.includes('module'))

  const getRowValue = (row, name) => {
    const match = Object.keys(row || {}).find((key) => key.toLowerCase() === name)
    return match ? row[match] : undefined
  }

  const data = {
    sales: {},
    warehouse: {},
    finance: {},
    crm: {},
  }

  if (usesKeyValue) {
    rows.forEach((row) => {
      const sectionRaw = getRowValue(row, 'category') || getRowValue(row, 'section') || getRowValue(row, 'module')
      const metricRaw = getRowValue(row, 'metric') || getRowValue(row, 'field') || getRowValue(row, 'kpi')
      const value = getRowValue(row, 'value') ?? getRowValue(row, 'amount') ?? getRowValue(row, 'current')
      const section = normalizeKey(sectionRaw)
      const metric = normalizeKey(metricRaw)
      const mappedMetric = FIELD_ALIASES[metric] || metric
      const targetSection = FIELD_TO_SECTION[mappedMetric] || section
      if (targetSection && FIELD_TO_SECTION[mappedMetric]) {
        data[targetSection][mappedMetric] = coerceValue(value)
      }
    })
    return data
  }

  const row = rows[0]
  Object.entries(row).forEach(([key, value]) => {
    const normalized = normalizeKey(key)
    const field = FIELD_ALIASES[normalized] || normalized
    const section = FIELD_TO_SECTION[field]
    if (section) {
      data[section][field] = coerceValue(value)
    }
  })

  const hasMappedFields = Object.values(data).some((section) => Object.keys(section).length > 0)
  return hasMappedFields ? data : { raw_data: rows }
}

const buildErpDataFromJson = (payload) => {
  if (!payload) return null
  if (payload.sales && payload.warehouse && payload.finance && payload.crm) {
    return payload
  }
  if (Array.isArray(payload)) {
    return buildErpDataFromRows(payload)
  }
  if (payload.rows && Array.isArray(payload.rows)) {
    return buildErpDataFromRows(payload.rows)
  }
  return { raw_data: payload }
}

const validateErpData = (data) => {
  if (!data) return { valid: false, missing: ['No data'], recommendedMissing: [] }
  const missing = []
  Object.entries(REQUIRED_FIELDS).forEach(([section, fields]) => {
    fields.forEach((field) => {
      if (!data[section] || data[section][field] === undefined) {
        missing.push(`${section}.${field}`)
      }
    })
  })
  return {
    valid: true,
    missing: [],
    recommendedMissing: missing,
  }
}

const downloadTemplate = () => {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'bitoanalyst-template.csv'
  link.click()
  URL.revokeObjectURL(link.href)
}

const InputPage = () => {
  const navigate = useNavigate()
  const [inputMode, setInputMode] = useState('upload')
  const [inputData, setInputData] = useState(JSON.stringify(SAMPLE_DATA, null, 2))
  const [analysisName, setAnalysisName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [recentAnalyses, setRecentAnalyses] = useState([])

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await listAnalyses()
        setRecentAnalyses(data.slice(0, 3))
      } catch (err) {
        setRecentAnalyses([])
      }
    }
    fetchRecent()
  }, [])

  const safeJsonPayload = useMemo(() => {
    if (inputMode !== 'paste') return null
    try {
      return buildErpDataFromJson(JSON.parse(inputData || '{}'))
    } catch (parseError) {
      return null
    }
  }, [inputMode, inputData])

  const validation = useMemo(() => {
    return validateErpData(inputMode === 'upload' ? parsedData : safeJsonPayload)
  }, [inputMode, parsedData, safeJsonPayload])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let payload = null
      if (inputMode === 'upload') {
        payload = parsedData
      } else {
        payload = buildErpDataFromJson(JSON.parse(inputData))
      }

      const validationResult = validateErpData(payload)
      if (!validationResult.valid) {
        throw new Error('No data provided for analysis.')
      }

      const result = await submitAnalysis({ ...payload, name: analysisName.trim() })
      navigate(`/dashboard/${result.analysis_id}`)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input.')
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to submit analysis. Please try again.')
      }
      setLoading(false)
    }
  }

  const loadSampleData = () => {
    setInputMode('paste')
    setInputData(JSON.stringify(SAMPLE_DATA, null, 2))
    setAnalysisName('Sample ERP Snapshot')
    setError(null)
  }

  const parseFile = async (file) => {
    setFileError(null)
    setParsedData(null)

    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()

    try {
      if (extension === 'json') {
        const text = await file.text()
        const payload = JSON.parse(text)
        const mapped = buildErpDataFromJson(payload)
        if (!mapped) throw new Error('JSON structure not recognized.')
        setParsedData(mapped)
        return
      }

      if (extension === 'csv') {
        const text = await file.text()
        const result = Papa.parse(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
        if (result.errors?.length) throw new Error('CSV parsing failed.')
        const mapped = buildErpDataFromRows(result.data)
        if (!mapped) throw new Error('CSV structure not recognized.')
        setParsedData(mapped)
        return
      }

      if (extension === 'xls' || extension === 'xlsx') {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        const mapped = buildErpDataFromRows(rows)
        if (!mapped) throw new Error('Spreadsheet structure not recognized.')
        setParsedData(mapped)
        return
      }

      throw new Error('Unsupported file format. Upload CSV, JSON, XLS, or XLSX.')
    } catch (parseError) {
      setFileError(parseError.message || 'Unable to parse file.')
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    setSelectedFile(file)
    await parseFile(file)
  }

  const summary = validation.valid
    ? validation.recommendedMissing.length === 0
      ? 'File ready for analysis.'
      : `Recommended fields missing: ${validation.recommendedMissing.slice(0, 3).join(', ')}${validation.recommendedMissing.length > 3 ? '...' : ''}`
    : validation.missing[0] === 'No data'
      ? 'Upload a file or paste JSON to begin.'
      : `Missing: ${validation.missing.slice(0, 3).join(', ')}${validation.missing.length > 3 ? '...' : ''}`

  return (
    <div className="space-y-10">
      <section className="grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-start">
        <div className="bg-white rounded-3xl shadow-soft border border-ink-100 p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-500">New analysis</p>
              <h2 className="text-3xl font-semibold text-ink-900">Upload operational data</h2>
              <p className="text-ink-600 mt-2">
                Ingest ERP exports in analyst-friendly formats, then get a boardroom-ready dashboard in minutes.
              </p>
            </div>
            <button
              onClick={loadSampleData}
              className="px-4 py-2 text-sm font-medium text-ink-700 bg-ink-100 rounded-full hover:bg-ink-200 transition"
            >
              Load sample data
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5" />
              <span className="text-rose-700 text-sm">{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Upload file', value: 'upload', icon: <Upload className="h-4 w-4" /> },
              { label: 'Paste JSON', value: 'paste', icon: <FileJson className="h-4 w-4" /> },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setInputMode(mode.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center gap-2 transition ${
                  inputMode === mode.value
                    ? 'bg-ink-900 text-white'
                    : 'bg-ink-100 text-ink-600 hover:text-ink-900'
                }`}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-700">Analysis name</label>
              <input
                value={analysisName}
                onChange={(event) => setAnalysisName(event.target.value)}
                placeholder="e.g., Q1 Fulfillment Review"
                className="w-full px-4 py-3 border border-ink-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
              />
              <p className="text-xs text-ink-500">Optional — helps your team find this analysis later.</p>
            </div>
            {inputMode === 'upload' ? (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-ink-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-400 transition">
                  <FileSpreadsheet className="h-10 w-10 text-primary-600" />
                  <p className="mt-3 text-sm font-medium text-ink-900">Drop your file here or click to upload</p>
                  <p className="text-xs text-ink-500 mt-1">Accepted: CSV, JSON, XLS, XLSX</p>
                  <input type="file" className="hidden" accept=".csv,.json,.xls,.xlsx" onChange={handleFileChange} />
                </label>

                {selectedFile && (
                  <div className="flex items-center justify-between bg-ink-50 border border-ink-100 rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{selectedFile.name}</p>
                      <p className="text-xs text-ink-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    {validation.valid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Parsed
                      </span>
                    ) : null}
                  </div>
                )}

                {fileError && (
                  <div className="text-sm text-rose-600">{fileError}</div>
                )}

                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>{summary}</span>
                  <button type="button" onClick={downloadTemplate} className="text-primary-700 hover:text-primary-800 font-medium">
                    Download template
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-sm font-medium text-ink-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ERP JSON payload
                </label>
                <textarea
                  value={inputData}
                  onChange={(event) => setInputData(event.target.value)}
                  rows={16}
                  className="w-full px-4 py-3 border border-ink-200 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-ink-50"
                  placeholder="Paste JSON data..."
                />
                <p className="text-xs text-ink-500">Ensure the payload includes Sales, Warehouse, Finance, and CRM sections.</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-xs text-ink-500">
                Required fields: Sales, Warehouse, Finance, CRM metrics.
              </div>
              <button
                type="submit"
                disabled={loading || !validation.valid}
                className="flex items-center justify-center px-6 py-3 bg-ink-900 text-white font-medium rounded-full hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Start analysis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-ink-100 rounded-3xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink-900">Recent analyses</h3>
              <Link to="/history" className="text-xs font-medium text-primary-700 hover:text-primary-800 inline-flex items-center gap-1">
                <History className="h-3.5 w-3.5" />
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentAnalyses.length === 0 ? (
                <p className="text-sm text-ink-500">No analyses yet. Upload data to get started.</p>
              ) : (
                recentAnalyses.map((analysis) => (
                  <Link
                    key={analysis.id}
                    to={`/dashboard/${analysis.id}`}
                    className="flex items-center justify-between border border-ink-100 rounded-2xl px-4 py-3 hover:shadow-soft transition"
                  >
                    <div>
                    <p className="text-sm font-medium text-ink-900">
                      {analysis.name ? analysis.name : `Analysis #${analysis.id}`}
                    </p>
                      <p className="text-xs text-ink-500">{new Date(analysis.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${analysis.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : analysis.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {analysis.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-ink-900 text-white rounded-3xl p-6 shadow-lift">
            <Sparkles className="h-6 w-6 text-primary-300" />
            <h3 className="text-lg font-semibold mt-3">What you get</h3>
            <ul className="mt-4 space-y-2 text-sm text-ink-100">
              <li>Data quality score with red-flag detection</li>
              <li>Executive summary & top 5 strategic priorities</li>
              <li>ERP configuration roadmap with automations</li>
              <li>Shareable dashboard for leadership review</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{
          title: 'Data health clarity',
          copy: 'Spot missing values, imbalance, and variance immediately with AI-driven checks.',
          icon: <AlertCircle className="h-6 w-6 text-rose-500" />,
          tone: 'bg-rose-50'
        }, {
          title: 'Strategy readiness',
          copy: 'Translate raw metrics into prioritized business moves and ROI impact.',
          icon: <FileJson className="h-6 w-6 text-primary-600" />,
          tone: 'bg-primary-50'
        }, {
          title: 'ERP operational fixes',
          copy: 'See configuration changes, automations, and dependencies in one place.',
          icon: <Settings className="h-6 w-6 text-amber-500" />,
          tone: 'bg-amber-50'
        }].map((item) => (
          <div key={item.title} className="bg-white p-6 rounded-3xl shadow-soft border border-ink-100">
            <div className={`h-12 w-12 ${item.tone} rounded-2xl flex items-center justify-center mb-4`}>
              {item.icon}
            </div>
            <h3 className="text-lg font-semibold text-ink-900 mb-2">{item.title}</h3>
            <p className="text-ink-600 text-sm">{item.copy}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

export default InputPage
