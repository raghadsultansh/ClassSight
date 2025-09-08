"use client"

import { useState } from 'react'
import { ChartCard } from '@/components/chart-card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Activity, Eye, Users, Clock, Gamepad2, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EngagementDataPoint {
  timestamp: string
  time: string
  active_participation: number
  attention_score: number
  interaction_rate: number
  question_frequency: number
  camera_activity: number
  mouse_movement: number
  keyboard_activity: number
  scroll_behavior: number
  focus_duration: number
  break_frequency: number
}

interface EngagementChartProps {
  data: EngagementDataPoint[]
  realTimeMetrics: {
    current_engagement: number
    peak_engagement_time: string
    low_engagement_periods: number
    average_focus_duration: number
    interaction_trend: 'increasing' | 'decreasing' | 'stable'
  }
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].payload) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg max-w-sm">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Participation:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{data.active_participation.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Attention:</span>
            <span className="font-medium text-green-600 dark:text-green-400">{data.attention_score.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Interactions:</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">{data.interaction_rate.toFixed(1)}/min</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Focus Duration:</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">{data.focus_duration.toFixed(1)}min</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Questions:</span>
            <span className="font-medium text-red-600 dark:text-red-400">{data.question_frequency.toFixed(1)}/hr</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <div className="grid grid-cols-2 gap-1">
            <div>Camera: {data.camera_activity.toFixed(0)}%</div>
            <div>Mouse: {data.mouse_movement.toFixed(0)}%</div>
            <div>Keyboard: {data.keyboard_activity.toFixed(0)}%</div>
            <div>Scroll: {data.scroll_behavior.toFixed(0)}%</div>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function EngagementChart({ 
  data, 
  realTimeMetrics, 
  isLoading, 
  className 
}: EngagementChartProps) {
  const [chartType, setChartType] = useState<'overview' | 'detailed' | 'behavior' | 'realtime'>('overview')
  const [timeWindow, setTimeWindow] = useState<'15m' | '1h' | '4h' | '1d'>('1h')
  
  // Filter data based on time window
  const getDataForTimeWindow = () => {
    const windowSizes = {
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    }
    return data.slice(-windowSizes[timeWindow])
  }

  const chartData = getDataForTimeWindow()

  // Prepare behavior analysis data
  const behaviorData = chartData.map(point => ({
    time: point.time,
    digital_activity: (point.mouse_movement + point.keyboard_activity + point.scroll_behavior) / 3,
    visual_attention: point.camera_activity,
    cognitive_load: (point.attention_score + point.focus_duration * 10) / 2,
    social_interaction: (point.interaction_rate * 10 + point.question_frequency * 5) / 2
  }))

  // Prepare real-time metrics for pie chart
  const engagementDistribution = [
    { name: 'Highly Engaged', value: 30, color: '#10b981' },
    { name: 'Moderately Engaged', value: 45, color: '#3b82f6' },
    { name: 'Passively Engaged', value: 20, color: '#f59e0b' },
    { name: 'Disengaged', value: 5, color: '#ef4444' }
  ]

  // Calculate statistics
  const stats = {
    currentEngagement: realTimeMetrics.current_engagement,
    avgParticipation: chartData.reduce((sum, d) => sum + d.active_participation, 0) / chartData.length || 0,
    avgAttention: chartData.reduce((sum, d) => sum + d.attention_score, 0) / chartData.length || 0,
    avgInteractionRate: chartData.reduce((sum, d) => sum + d.interaction_rate, 0) / chartData.length || 0,
    avgFocusDuration: realTimeMetrics.average_focus_duration,
    peakEngagementTime: realTimeMetrics.peak_engagement_time,
    lowEngagementPeriods: realTimeMetrics.low_engagement_periods,
    interactionTrend: realTimeMetrics.interaction_trend,
    totalDataPoints: chartData.length
  }

  const title = "Real-Time Engagement Analytics"
  const description = "Live monitoring of student engagement through multiple behavioral indicators and interaction patterns."

  const renderChart = () => {
    switch (chartType) {
      case 'detailed':
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="time" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="active_participation" stroke="#3b82f6" strokeWidth={2} name="Participation" />
            <Line type="monotone" dataKey="attention_score" stroke="#10b981" strokeWidth={2} name="Attention" />
            <Line type="monotone" dataKey="interaction_rate" stroke="#8b5cf6" strokeWidth={2} name="Interactions" />
            <Line type="monotone" dataKey="focus_duration" stroke="#f59e0b" strokeWidth={2} name="Focus Duration" />
          </LineChart>
        )

      case 'behavior':
        return (
          <BarChart data={behaviorData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="time" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip />
            <Legend />
            <Bar dataKey="digital_activity" fill="#06b6d4" name="Digital Activity" />
            <Bar dataKey="visual_attention" fill="#10b981" name="Visual Attention" />
            <Bar dataKey="cognitive_load" fill="#f59e0b" name="Cognitive Load" />
            <Bar dataKey="social_interaction" fill="#8b5cf6" name="Social Interaction" />
          </BarChart>
        )

      case 'realtime':
        return (
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={engagementDistribution}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {engagementDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )

      default:
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="time" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="active_participation" fill="#3b82f6" name="Active Participation %" />
            <Bar dataKey="attention_score" fill="#10b981" name="Attention Score %" />
          </BarChart>
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
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('overview')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'overview' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setChartType('detailed')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'detailed' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Detailed
            </button>
            <button
              onClick={() => setChartType('behavior')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'behavior' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Behavior
            </button>
            <button
              onClick={() => setChartType('realtime')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'realtime' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Live Distribution
            </button>
          </div>

          {/* Time Window Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">Window:</span>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value as any)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
            >
              <option value="15m">Last 15 Minutes</option>
              <option value="1h">Last Hour</option>
              <option value="4h">Last 4 Hours</option>
              <option value="1d">Today</option>
            </select>
          </div>
        </div>

        {/* Real-time Status Banner */}
        <div className={cn(
          "rounded-lg p-4 border",
          stats.currentEngagement >= 80 ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50" :
          stats.currentEngagement >= 60 ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50" :
          "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                stats.currentEngagement >= 80 ? "bg-green-500" :
                stats.currentEngagement >= 60 ? "bg-yellow-500" : "bg-red-500"
              )} />
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  Current Engagement Level: {stats.currentEngagement.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Trend: {stats.interactionTrend} • Peak: {stats.peakEngagementTime} • Low periods: {stats.lowEngagementPeriods}
                </div>
              </div>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              stats.currentEngagement >= 80 ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200" :
              stats.currentEngagement >= 60 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200" :
              "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            )}>
              {stats.currentEngagement >= 80 ? "HIGH" :
               stats.currentEngagement >= 60 ? "MODERATE" : "LOW"}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Participation</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.avgParticipation.toFixed(1)}%
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Attention</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.avgAttention.toFixed(1)}%
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Interactions</span>
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.avgInteractionRate.toFixed(1)}/min
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Focus</span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {stats.avgFocusDuration.toFixed(1)}m
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-red-800 dark:text-red-200">Low Periods</div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {stats.lowEngagementPeriods}
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Peak Time</div>
            <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
              {stats.peakEngagementTime}
            </div>
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-medium text-teal-800 dark:text-teal-200">Trend</span>
            </div>
            <div className={cn(
              "text-lg font-bold",
              stats.interactionTrend === 'increasing' ? "text-green-600" : 
              stats.interactionTrend === 'decreasing' ? "text-red-600" : "text-slate-600"
            )}>
              {stats.interactionTrend === 'increasing' ? '↗' : 
               stats.interactionTrend === 'decreasing' ? '↘' : '→'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Data Points</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {stats.totalDataPoints}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Engagement Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Current Status */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Engagement Health</span>
            </h4>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-700 rounded border p-3">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Overall Score</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                    <div 
                      className={cn(
                        "h-3 rounded-full transition-all duration-500",
                        stats.currentEngagement >= 80 ? "bg-green-500" :
                        stats.currentEngagement >= 60 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${stats.currentEngagement}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{stats.currentEngagement.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-700 rounded border p-3">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Participation Rate</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.avgParticipation}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.avgParticipation.toFixed(1)}%</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-700 rounded border p-3">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Focus Quality</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(stats.avgFocusDuration * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{stats.avgFocusDuration.toFixed(1)}min avg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Recommendations</h4>
            <div className="space-y-3">
              {stats.currentEngagement < 60 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded p-3">
                  <div className="text-sm font-medium text-red-800 dark:text-red-200">Critical Engagement Alert</div>
                  <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                    Consider implementing interactive elements or taking a break to re-engage students.
                  </div>
                </div>
              )}
              
              {stats.avgFocusDuration < 5 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded p-3">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Short Focus Periods</div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    Break content into smaller segments or increase interactive elements.
                  </div>
                </div>
              )}

              {stats.interactionTrend === 'decreasing' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded p-3">
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-200">Declining Interactions</div>
                  <div className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    Student interaction is decreasing. Consider Q&A session or group activity.
                  </div>
                </div>
              )}

              {stats.currentEngagement >= 80 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded p-3">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">Excellent Engagement</div>
                  <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Great job! Students are highly engaged. Continue with current approach.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
