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
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'
import { Users, Calendar, Clock, TrendingUp, UserCheck, UserX, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttendanceDataPoint {
  timestamp: string
  date: string
  time: string
  present_count: number
  expected_count: number
  attendance_rate: number
  late_arrivals: number
  early_departures: number
  no_shows: number
}

interface AttendanceChartProps {
  data: AttendanceDataPoint[]
  timeGranularity: 'hourly' | 'daily' | 'weekly' | 'monthly'
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Present:</span>
            <span className="font-medium text-green-600 dark:text-green-400">{data.present_count}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Expected:</span>
            <span className="font-medium text-slate-900 dark:text-white">{data.expected_count}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Rate:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{data.attendance_rate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Late:</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">{data.late_arrivals}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Early Exit:</span>
            <span className="font-medium text-orange-600 dark:text-orange-400">{data.early_departures}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">No Show:</span>
            <span className="font-medium text-red-600 dark:text-red-400">{data.no_shows}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function AttendanceChart({ 
  data, 
  timeGranularity, 
  isLoading, 
  className 
}: AttendanceChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'composed'>('line')
  const [showMetric, setShowMetric] = useState<'rate' | 'counts' | 'issues'>('rate')
  
  // Calculate statistics
  const stats = {
    totalSessions: data.length,
    avgAttendanceRate: data.reduce((sum, item) => sum + item.attendance_rate, 0) / data.length,
    totalPresent: data.reduce((sum, item) => sum + item.present_count, 0),
    totalExpected: data.reduce((sum, item) => sum + item.expected_count, 0),
    totalLateArrivals: data.reduce((sum, item) => sum + item.late_arrivals, 0),
    totalEarlyDepartures: data.reduce((sum, item) => sum + item.early_departures, 0),
    totalNoShows: data.reduce((sum, item) => sum + item.no_shows, 0),
    peakAttendance: Math.max(...data.map(d => d.attendance_rate)),
    lowestAttendance: Math.min(...data.map(d => d.attendance_rate))
  }

  // Prepare data based on selected metric
  const getChartData = () => {
    return data.map(item => ({
      ...item,
      displayLabel: timeGranularity === 'hourly' ? item.time : 
                   timeGranularity === 'daily' ? item.date.split('-').slice(1).join('/') :
                   item.date
    }))
  }

  const chartData = getChartData()

  const title = `Attendance Tracking - ${timeGranularity.charAt(0).toUpperCase() + timeGranularity.slice(1)}`
  const description = `Real-time attendance monitoring with detailed insights into student participation patterns.`

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="displayLabel" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showMetric === 'rate' && (
              <Area
                type="monotone"
                dataKey="attendance_rate"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Attendance Rate (%)"
              />
            )}
            {showMetric === 'counts' && (
              <>
                <Area
                  type="monotone"
                  dataKey="present_count"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  name="Present"
                />
                <Area
                  type="monotone"
                  dataKey="expected_count"
                  stackId="2"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.3}
                  name="Expected"
                />
              </>
            )}
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="displayLabel" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showMetric === 'rate' && (
              <Bar dataKey="attendance_rate" fill="#3b82f6" name="Attendance Rate (%)" />
            )}
            {showMetric === 'counts' && (
              <>
                <Bar dataKey="present_count" fill="#10b981" name="Present" />
                <Bar dataKey="expected_count" fill="#6b7280" name="Expected" />
              </>
            )}
            {showMetric === 'issues' && (
              <>
                <Bar dataKey="late_arrivals" fill="#f59e0b" name="Late Arrivals" />
                <Bar dataKey="early_departures" fill="#f97316" name="Early Departures" />
                <Bar dataKey="no_shows" fill="#ef4444" name="No Shows" />
              </>
            )}
          </BarChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="displayLabel" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="present_count" fill="#10b981" name="Present" />
            <Line 
              type="monotone" 
              dataKey="attendance_rate" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ r: 4 }}
              name="Rate (%)"
            />
            <Line 
              type="monotone" 
              dataKey="late_arrivals" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Late"
            />
          </ComposedChart>
        )

      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="displayLabel" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {showMetric === 'rate' && (
              <Line 
                type="monotone" 
                dataKey="attendance_rate" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Attendance Rate (%)"
              />
            )}
            {showMetric === 'counts' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="present_count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Present"
                />
                <Line 
                  type="monotone" 
                  dataKey="expected_count" 
                  stroke="#6b7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Expected"
                />
              </>
            )}
            {showMetric === 'issues' && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="late_arrivals" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Late Arrivals"
                />
                <Line 
                  type="monotone" 
                  dataKey="early_departures" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Early Departures"
                />
                <Line 
                  type="monotone" 
                  dataKey="no_shows" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="No Shows"
                />
              </>
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
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'line' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'bar' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('area')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'area' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('composed')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'composed' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Combined
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show:</span>
            <select
              value={showMetric}
              onChange={(e) => setShowMetric(e.target.value as any)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
            >
              <option value="rate">Attendance Rate</option>
              <option value="counts">Student Counts</option>
              <option value="issues">Issues & Problems</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Sessions</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.totalSessions}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Avg Rate</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.avgAttendanceRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Late</span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {stats.totalLateArrivals}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-orange-800 dark:text-orange-200">Early Exit</div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {stats.totalEarlyDepartures}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <UserX className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-800 dark:text-red-200">No Shows</span>
            </div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {stats.totalNoShows}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Peak</span>
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.peakAttendance.toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Lowest</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {stats.lowestAttendance.toFixed(1)}%
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Present</div>
            <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
              {stats.totalPresent}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Attendance Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-700 rounded border p-3">
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Overall Health</div>
              <div className={cn(
                "text-2xl font-bold mb-1",
                stats.avgAttendanceRate >= 90 ? "text-green-600" :
                stats.avgAttendanceRate >= 80 ? "text-yellow-600" : "text-red-600"
              )}>
                {stats.avgAttendanceRate >= 90 ? "Excellent" :
                 stats.avgAttendanceRate >= 80 ? "Good" : "Needs Attention"}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Average attendance rate: {stats.avgAttendanceRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded border p-3">
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Reliability</div>
              <div className={cn(
                "text-2xl font-bold mb-1",
                (stats.totalLateArrivals + stats.totalEarlyDepartures) / stats.totalSessions < 2 ? "text-green-600" : "text-yellow-600"
              )}>
                {(stats.totalLateArrivals + stats.totalEarlyDepartures) / stats.totalSessions < 2 ? "High" : "Moderate"}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {stats.totalLateArrivals + stats.totalEarlyDepartures} issues across {stats.totalSessions} sessions
              </div>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded border p-3">
              <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">Engagement</div>
              <div className={cn(
                "text-2xl font-bold mb-1",
                stats.totalNoShows / stats.totalSessions < 0.1 ? "text-green-600" : "text-red-600"
              )}>
                {stats.totalNoShows / stats.totalSessions < 0.1 ? "Strong" : "Concerning"}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {stats.totalNoShows} no-shows ({((stats.totalNoShows / stats.totalExpected) * 100).toFixed(1)}% of expected)
              </div>
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
