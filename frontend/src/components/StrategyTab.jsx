import { Target, Lightbulb, Clock, DollarSign, TrendingUp } from 'lucide-react'

const StrategyTab = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No business strategy analysis available
      </div>
    )
  }

  const executiveSummary = data.executive_summary || ''
  const topProblems = data.top_problems || []
  const quickWins = data.quick_wins || []
  const strategicInitiatives = data.strategic_initiatives || []

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      {executiveSummary && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Target className="h-5 w-5 text-primary-600 mr-2" />
            Executive Summary
          </h3>
          <p className="text-gray-700">{executiveSummary}</p>
        </div>
      )}

      {/* Top Problems Table */}
      {topProblems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-primary-600 mr-2" />
            Top 5 Problems & Actions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Problem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Root Cause</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact/Effort</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProblems.map((problem, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary-800 font-semibold text-sm">
                        #{problem.rank || index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{problem.problem}</div>
                      <div className="text-xs text-gray-500 mt-1">Category: {problem.category}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 max-w-xs">{problem.root_cause}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 max-w-xs">{problem.recommended_action}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityClass(problem.action_priority)}`}>
                        {problem.action_priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                        {problem.financial_impact}
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {problem.estimated_effort}
                      </div>
                      {problem.expected_roi && (
                        <div className="mt-1 text-xs text-green-600">
                          ROI: {problem.expected_roi}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
            Quick Wins
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickWins.map((win, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{win.action}</h4>
                <p className="text-sm text-gray-700 mb-2">{win.impact}</p>
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-200 text-green-800 rounded-full">
                  Low Effort
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Initiatives */}
      {strategicInitiatives.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            Strategic Initiatives
          </h3>
          <div className="grid gap-4">
            {strategicInitiatives.map((initiative, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{initiative.initiative}</h4>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {initiative.timeline}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{initiative.description}</p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Expected Impact:</strong> {initiative.expected_impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StrategyTab