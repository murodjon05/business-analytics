import { AlertTriangle, Info, TrendingUp, AlertCircle } from 'lucide-react'

const DataHealthTab = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data quality analysis available
      </div>
    )
  }

  const redFlags = data.red_flags || []
  const keyInsights = data.key_insights || []
  const dataQualityScore = data.data_quality_score || 0
  const summary = data.summary || ''

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 border-red-200'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getImpactClass = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return 'text-red-600 font-semibold'
      case 'medium':
        return 'text-yellow-600 font-semibold'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Data Quality Score</h3>
          <div className="flex items-center">
            <div className={`text-3xl font-bold ${
              dataQualityScore >= 70 ? 'text-green-600' : 
              dataQualityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {dataQualityScore}/100
            </div>
          </div>
        </div>
        <p className="text-gray-700">{summary}</p>
      </div>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Red Flags ({redFlags.length})
          </h3>
          <div className="grid gap-4">
            {redFlags.map((flag, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityClass(flag.severity)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(flag.severity)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {flag.category?.toUpperCase()}: {flag.metric}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        flag.severity?.toLowerCase() === 'high' ? 'bg-red-200 text-red-800' :
                        flag.severity?.toLowerCase() === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {flag.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{flag.description}</p>
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Current: <strong>{flag.value}</strong></span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-gray-600">Threshold: <strong>{flag.threshold}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {keyInsights.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            Key Insights ({keyInsights.length})
          </h3>
          <div className="grid gap-4">
            {keyInsights.map((insight, index) => (
              <div
                key={index}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <span className={`text-xs ${getImpactClass(insight.impact)}`}>
                        {insight.impact} impact
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{insight.description}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      Category: {insight.category}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataHealthTab