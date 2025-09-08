"use client"

import { useState } from 'react'
import { ChartCard } from '@/components/chart-card'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts'
import { Award, TrendingUp, Users, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GradeDistribution {
  grade: string
  count: number
  percentage: number
}

interface GradeTrend {
  date: string
  avg_score: number
}

interface GradePerformanceData {
  distribution: GradeDistribution[]
  trends: GradeTrend[]
}

interface GradePerformanceChartProps {
  data: GradePerformanceData
  isLoading?: boolean
  className?: string
}

const GRADE_COLORS = {
  'A': '#10b981', // Green
  'B': '#3b82f6', // Blue  
  'C': '#f59e0b', // Orange
  'D': '#ef4444', // Red
  'F': '#6b7280'  // Gray
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
            <span className="text-slate-600 dark:text-slate-400">{entry.name || entry.dataKey}:</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {entry.payload?.percentage !== undefined && ` (${entry.payload.percentage}%)`}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: GRADE_COLORS[data.grade as keyof typeof GRADE_COLORS] }}
          />
          <span className="font-medium text-slate-900 dark:text-white">Grade {data.grade}</span>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {data.count} students ({data.percentage}%)
        </div>
      </div>
    )
  }
  return null
}

export function GradePerformanceChart({ data, isLoading, className }: GradePerformanceChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')
  
  // Data availability info
  const hasLimitedData = data?.distribution && data.distribution.length > 0 && data.distribution.length < 5
  
  // Simple data validation - only check if completely empty
  if (!data || !data.distribution) {
    return (
      <ChartCard
        title="Grade Performance Analysis"
        description="Comprehensive view of student grade distribution and performance trends across assessments and time periods."
        isLoading={isLoading}
        className={className}
      >
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No grade data available</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Grade data will appear when assessments are recorded</p>
          </div>
        </div>
      </ChartCard>
    )
  }
  
  // Calculate statistics
  const stats = {
    totalStudents: (data?.distribution || []).reduce((sum, item) => sum + item.count, 0),
    passingRate: (data?.distribution || [])
      .filter(item => ['A', 'B', 'C'].includes(item.grade))
      .reduce((sum, item) => sum + item.percentage, 0),
    excellenceRate: (data?.distribution || [])
      .filter(item => ['A'].includes(item.grade))
      .reduce((sum, item) => sum + item.percentage, 0),
    avgTrendScore: (data?.trends && data.trends.length > 0) 
      ? data.trends.reduce((sum, item) => sum + item.avg_score, 0) / data.trends.length 
      : 0
  }

  const title = `Grade Performance Analysis`
  const description = `Comprehensive view of student grade distribution and performance trends across assessments and time periods.`

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
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Grade Distribution</h4>
            {hasLimitedData && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                {data.distribution.length} of 5 grades
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'bar' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'pie' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Pie Chart
            </button>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Total Students</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.totalStudents}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Passing Rate</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.passingRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Excellence Rate</span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {stats.excellenceRate.toFixed(1)}%
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Avg Score</span>
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.avgTrendScore.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="h-80 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={data?.distribution || []} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="grade" className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
                <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="Students"
                >
                  {(data?.distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade as keyof typeof GRADE_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={data?.distribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(data?.distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade as keyof typeof GRADE_COLORS]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Grade Trends */}
        {data?.trends && data.trends.length > 0 && (
          <>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Performance Trends</h4>
              <div className="h-40 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trends} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="date" className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="avg_score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      name="Average Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Insights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Performance Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="text-slate-600 dark:text-slate-400">
              <strong>Success Rate:</strong> {(100 - data.distribution.find(d => d.grade === 'F')?.percentage || 0).toFixed(1)}% non-failing
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              <strong>Grade Distribution:</strong> {data.distribution.length} grade categories tracked
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
