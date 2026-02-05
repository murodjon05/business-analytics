import { Settings, Wrench, Zap, ArrowRight, Package, DollarSign, Users, Warehouse } from 'lucide-react'

const BitoActionsTab = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No ERP configuration recommendations available
      </div>
    )
  }

  const configurationSummary = data.configuration_summary || ''
  const modules = data.modules || {}
  const integrationChanges = data.integration_changes || []
  const implementationOrder = data.implementation_order || []

  const moduleIcons = {
    sales: DollarSign,
    warehouse: Warehouse,
    finance: DollarSign,
    crm: Users,
  }

  const getModuleIcon = (moduleName) => {
    const Icon = moduleIcons[moduleName.toLowerCase()] || Package
    return Icon
  }

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'hard':
        return 'text-red-600'
      case 'medium':
        return 'text-yellow-600'
      case 'easy':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {configurationSummary && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Settings className="h-5 w-5 text-primary-600 mr-2" />
            Configuration Overview
          </h3>
          <p className="text-gray-700">{configurationSummary}</p>
        </div>
      )}

      {/* Modules */}
      {Object.keys(modules).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Configurations</h3>
          <div className="grid gap-6">
            {Object.entries(modules).map(([moduleName, moduleData], index) => {
              const Icon = getModuleIcon(moduleName)
              const configs = moduleData.configurations || []
              const automations = moduleData.automations || []
              const priority = moduleData.priority || 'low'

              if (configs.length === 0 && automations.length === 0) return null

              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                        <Icon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 capitalize">{moduleName} Module</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityClass(priority)}`}>
                          {priority} priority
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Configurations */}
                  {configs.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Wrench className="h-4 w-4 mr-1" />
                        Configuration Changes
                      </h5>
                      <div className="space-y-2">
                        {configs.map((config, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-md p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 text-sm">{config.setting}</span>
                              <span className={`text-xs font-medium ${getDifficultyClass(config.implementation_difficulty)}`}>
                                {config.implementation_difficulty}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <span className="line-through">{config.current_value}</span>
                              <ArrowRight className="h-3 w-3 mx-2" />
                              <span className="text-primary-600 font-medium">{config.recommended_value}</span>
                            </div>
                            <p className="text-xs text-gray-500">{config.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Automations */}
                  {automations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-1" />
                        Automations
                      </h5>
                      <div className="space-y-2">
                        {automations.map((automation, idx) => (
                          <div key={idx} className="bg-blue-50 border border-blue-100 rounded-md p-3">
                            <div className="font-medium text-gray-900 text-sm mb-1">{automation.automation}</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><strong>Trigger:</strong> {automation.trigger}</p>
                              <p><strong>Action:</strong> {automation.action}</p>
                              <p className="text-blue-700"><strong>Benefit:</strong> {automation.benefit}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Integration Changes */}
      {integrationChanges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Changes</h3>
          <div className="grid gap-4">
            {integrationChanges.map((integration, index) => (
              <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{integration.integration}</h4>
                <p className="text-sm text-gray-700 mb-2">{integration.change}</p>
                <div className="flex flex-wrap gap-2">
                  {integration.modules_affected?.map((mod, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs font-medium bg-purple-200 text-purple-800 rounded-full">
                      {mod}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-purple-700 mt-2"><strong>Impact:</strong> {integration.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Order */}
      {implementationOrder.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Roadmap</h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-4">
              {implementationOrder.map((step, index) => (
                <div key={index} className="relative flex items-start ml-8">
                  <div className="absolute -left-8 mt-1.5">
                    <div className="h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 capitalize">{step.module} - {step.action}</h4>
                      <span className="text-xs text-gray-500">{step.estimated_time}</span>
                    </div>
                    {step.prerequisites?.length > 0 && (
                      <p className="text-xs text-gray-500">
                        <strong>Prerequisites:</strong> {step.prerequisites.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BitoActionsTab