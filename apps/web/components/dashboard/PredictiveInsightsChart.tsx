"use client"

import { useState } from 'react'
import { ChartCard } from '@/components/chart-card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts'
import { Brain, TrendingUp, AlertTriangle, Eye, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PredictiveDataPoint {
  timestamp: string
  date: string
  actual_attention: number
  predicted_attention: number
  confidence_interval_lower: number
  confidence_interval_upper: number
  risk_score: number
  factors: {
    time_of_day: number
    day_of_week: number
    session_duration: number
    weather_impact: number
    previous_performance: number
  }
}

interface AlertData {
  type: 'risk' | 'opportunity' | 'warning'
  message: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  timeframe: string
}

interface PredictiveInsightsChartProps {
  data: PredictiveDataPoint[]
  alerts: AlertData[]
  accuracy: number
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].payload) {
    const point = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg max-w-sm">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Actual:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{point.actual_attention.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Predicted:</span>
            <span className="font-medium text-green-600 dark:text-green-400">{point.predicted_attention.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Risk Score:</span>
            <span className={cn(
              "font-medium",
              point.risk_score > 0.7 ? "text-red-600 dark:text-red-400" :
              point.risk_score > 0.4 ? "text-yellow-600 dark:text-yellow-400" :
              "text-green-600 dark:text-green-400"
            )}>
              {point.risk_score.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {point.confidence_interval_lower.toFixed(1)}% - {point.confidence_interval_upper.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <div>Key Factors:</div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div>Time: {(point.factors.time_of_day * 100).toFixed(0)}%</div>
            <div>Day: {(point.factors.day_of_week * 100).toFixed(0)}%</div>
            <div>Duration: {(point.factors.session_duration * 100).toFixed(0)}%</div>
            <div>History: {(point.factors.previous_performance * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function PredictiveInsightsChart({ 
  data, 
  alerts, 
  accuracy, 
  isLoading, 
  className 
}: PredictiveInsightsChartProps) {
  const [viewType, setViewType] = useState<'prediction' | 'factors' | 'risk'>('prediction')
  const [showConfidence, setShowConfidence] = useState(true)
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('7d')

  // Filter data based on time range
  const filteredData = data.slice(-{
    '1d': 24,
    '7d': 168, // 7 days * 24 hours
    '30d': 720  // 30 days * 24 hours
  }[timeRange])

  // Prepare factor analysis data
  const factorData = data.slice(-24).map((point, index) => ({
    hour: index,
    time_impact: point.factors.time_of_day * 100,
    day_impact: point.factors.day_of_week * 100,
    duration_impact: point.factors.session_duration * 100,
    weather_impact: point.factors.weather_impact * 100,
    history_impact: point.factors.previous_performance * 100
  }))

  // Prepare risk analysis data
  const riskData = data.map(point => ({
    timestamp: point.timestamp,
    risk_score: point.risk_score * 100,
    predicted_attention: point.predicted_attention,
    actual_attention: point.actual_attention
  }))

  // Calculate statistics
  const stats = {
    modelAccuracy: accuracy,
    totalPredictions: data.length,
    highRiskPeriods: data.filter(d => d.risk_score > 0.7).length,
    avgRiskScore: data.reduce((sum, d) => sum + d.risk_score, 0) / data.length,
    predictionError: data.reduce((sum, d) => sum + Math.abs(d.actual_attention - d.predicted_attention), 0) / data.length,
    confidenceRange: data.reduce((sum, d) => sum + (d.confidence_interval_upper - d.confidence_interval_lower), 0) / data.length,
    nextRiskPeriod: data.find(d => d.risk_score > 0.7),
    trendDirection: data.length > 1 ? 
      (data[data.length - 1].predicted_attention > data[data.length - 2].predicted_attention ? 'up' : 'down') : 'stable'
  }

  const title = "Predictive Analytics Dashboard"
  const description = "AI-powered insights predicting student attention patterns and identifying intervention opportunities."

  const renderChart = () => {
    switch (viewType) {
      case 'factors':
        return (
          <AreaChart data={factorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="hour" 
              className="text-slate-600 dark:text-slate-400" 
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="time_impact"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              name="Time of Day"
            />
            <Area
              type="monotone"
              dataKey="day_impact"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              name="Day of Week"
            />
            <Area
              type="monotone"
              dataKey="duration_impact"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              name="Session Length"
            />
            <Area
              type="monotone"
              dataKey="history_impact"
              stackId="1"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              name="Historical Performance"
            />
          </AreaChart>
        )

      case 'risk':
        return (
          <ScatterChart data={riskData.slice(-50)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              type="number"
              dataKey="predicted_attention"
              name="Predicted Attention"
              domain={[0, 100]}
              className="text-slate-600 dark:text-slate-400"
            />
            <YAxis 
              type="number"
              dataKey="risk_score"
              name="Risk Score"
              domain={[0, 100]}
              className="text-slate-600 dark:text-slate-400"
            />
            <Tooltip />
            <Scatter name="Risk vs Prediction" data={riskData.slice(-50)} fill="#ef4444" />
          </ScatterChart>
        )

      default:
        return (
          <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="timestamp" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Confidence Interval */}
            {showConfidence && (
              <Area
                type="monotone"
                dataKey="confidence_interval_upper"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.1}
                connectNulls={false}
              />
            )}
            
            {/* Actual Attention */}
            <Line 
              type="monotone" 
              dataKey="actual_attention" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Actual Attention"
            />
            
            {/* Predicted Attention */}
            <Line 
              type="monotone" 
              dataKey="predicted_attention" 
              stroke="#3b82f6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              name="Predicted Attention"
            />

            {showConfidence && (
              <Area
                type="monotone"
                dataKey="confidence_interval_lower"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
              />
            )}
          </LineChart>
        )
    }
  }

  return (
    <ChartCard
      title={title}
      description={description}
      isLoading={isLoading}
      className={className}
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* View Type Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewType('prediction')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'prediction' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Predictions
            </button>
            <button
              onClick={() => setViewType('factors')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'factors' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Factor Analysis
            </button>
            <button
              onClick={() => setViewType('risk')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'risk' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Risk Matrix
            </button>
          </div>

          {/* Time Range & Options */}
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            {viewType === 'prediction' && (
              <label className="flex items-center space-x-1 text-xs">
                <input
                  type="checkbox"
                  checked={showConfidence}
                  onChange={(e) => setShowConfidence(e.target.checked)}
                  className="rounded"
                />
                <span className="text-slate-600 dark:text-slate-400">Confidence</span>
              </label>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Accuracy</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {(stats.modelAccuracy * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Predictions</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.totalPredictions}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-800 dark:text-red-200">High Risk</span>
            </div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {stats.highRiskPeriods}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Avg Risk</div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {(stats.avgRiskScore * 100).toFixed(0)}%
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-purple-800 dark:text-purple-200">Error Rate</div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.predictionError.toFixed(1)}%
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Confidence</div>
            <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
              ±{stats.confidenceRange.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className={cn(
                "w-4 h-4",
                stats.trendDirection === 'up' ? "text-green-600" : "text-red-600"
              )} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Trend</span>
            </div>
            <div className={cn(
              "text-lg font-bold",
              stats.trendDirection === 'up' ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
            )}>
              {stats.trendDirection === 'up' ? '↗' : '↘'}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* AI Alerts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Alerts */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>AI Alerts</span>
            </h4>
            <div className="space-y-2">
              {alerts.slice(0, 4).map((alert, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded border",
                    alert.type === 'risk' ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50" :
                    alert.type === 'warning' ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50" :
                    "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={cn(
                        "text-sm font-medium",
                        alert.type === 'risk' ? "text-red-800 dark:text-red-200" :
                        alert.type === 'warning' ? "text-yellow-800 dark:text-yellow-200" :
                        "text-blue-800 dark:text-blue-200"
                      )}>
                        {alert.message}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {alert.timeframe} • {alert.confidence}% confidence • {alert.impact} impact
                      </div>
                    </div>
                    <div className={cn(
                      "ml-2 px-2 py-1 rounded text-xs font-medium",
                      alert.type === 'risk' ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" :
                      alert.type === 'warning' ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200" :
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    )}>
                      {alert.type.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Performance */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>Model Performance</span>
            </h4>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-700 rounded border p-3">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Prediction Accuracy</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.modelAccuracy * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-blue-600">{(stats.modelAccuracy * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-700 rounded border p-3">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Error Rate</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats.predictionError, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-red-600">{stats.predictionError.toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-700 rounded border p-3">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Confidence Level</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Average confidence interval: ±{stats.confidenceRange.toFixed(1)}%
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(0, 100 - stats.confidenceRange * 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {Math.max(0, 100 - stats.confidenceRange * 2).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
