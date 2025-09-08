"use client"

import { useState } from 'react'
import { ChartCard } from '@/components/chart-card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart
} from 'recharts'
import { Users, UserCheck, TrendingUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudentMetricsData {
  date: string
  enrolled: number
  avg_present: number
  max_present: number
  min_present: number
  session_count: number
}

interface StudentMetricsChartProps {
  data: StudentMetricsData[]
  granularity: string
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {entry.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function StudentMetricsChart({ data, granularity, isLoading, className }: StudentMetricsChartProps) {
  const [chartType, setChartType] = useState<'composed' | 'bar' | 'line'>('composed')
  
  // Calculate statistics
  const stats = {
    avgEnrolled: data.length > 0 ? data.reduce((sum, item) => sum + item.enrolled, 0) / data.length : 0,
    avgPresent: data.length > 0 ? data.reduce((sum, item) => sum + item.avg_present, 0) / data.length : 0,
    attendanceRate: data.length > 0 ? (data.reduce((sum, item) => sum + (item.avg_present / item.enrolled * 100), 0) / data.length) : 0,
    peakAttendance: Math.max(...data.map(item => item.max_present || 0)),
    totalSessions: data.reduce((sum, item) => sum + (item.session_count || 0), 0)
  }

  const title = `Student Headcount Analytics`
  const description = `Real-time student presence tracking from camera data captured every 30 minutes. Shows enrollment vs actual attendance patterns.`

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
            <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" opacity={0.7} />
            <Bar dataKey="avg_present" fill="#10b981" name="Avg Present" />
          </BarChart>
        )
      
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
            <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="enrolled" stroke="#3b82f6" strokeWidth={2} name="Enrolled" />
            <Line type="monotone" dataKey="avg_present" stroke="#10b981" strokeWidth={3} name="Avg Present" />
            <Line type="monotone" dataKey="max_present" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Peak Present" />
          </LineChart>
        )
      
      default:
        return (
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
            <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="enrolled" fill="#3b82f6" name="Enrolled" opacity={0.6} />
            <Line type="monotone" dataKey="avg_present" stroke="#10b981" strokeWidth={3} name="Avg Present" />
            <Line type="monotone" dataKey="max_present" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Peak Present" />
          </ComposedChart>
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
        {/* Header with Chart Type Selector */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Headcount Overview</h4>
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
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
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'bar' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Bars
            </button>
            <button
              onClick={() => setChartType('line')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'line' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Lines
            </button>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Avg Enrolled</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {Math.round(stats.avgEnrolled)}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Avg Present</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {Math.round(stats.avgPresent)}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Attendance Rate</span>
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.attendanceRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-orange-800 dark:text-orange-200">Peak Present</div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {Math.round(stats.peakAttendance)}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Sessions</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {stats.totalSessions}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Camera-Based Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="text-slate-600 dark:text-slate-400">
              <strong>Occupancy Efficiency:</strong> {((stats.avgPresent / stats.avgEnrolled) * 100).toFixed(1)}% utilization
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              <strong>Data Collection:</strong> 30-minute intervals from classroom cameras
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
