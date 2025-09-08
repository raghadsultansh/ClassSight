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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts'
import { BookOpen, Users, TrendingUp, Award, Calendar, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BootcampMetrics {
  bootcamp_id: string
  bootcamp_name: string
  instructor_count: number
  student_count: number
  total_sessions: number
  avg_attendance_rate: number
  avg_attention_rate: number
  avg_grade: number
  completion_rate: number
  satisfaction_score: number
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'upcoming'
}

interface BootcampComparisonChartProps {
  bootcamps: BootcampMetrics[]
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].payload) {
    const bootcamp = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg max-w-sm">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{bootcamp.bootcamp_name}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Students:</span>
            <span className="font-medium text-slate-900 dark:text-white">{bootcamp.student_count}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Instructors:</span>
            <span className="font-medium text-slate-900 dark:text-white">{bootcamp.instructor_count}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Sessions:</span>
            <span className="font-medium text-slate-900 dark:text-white">{bootcamp.total_sessions}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Attendance:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">{bootcamp.avg_attendance_rate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Attention:</span>
            <span className="font-medium text-green-600 dark:text-green-400">{bootcamp.avg_attention_rate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Avg Grade:</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">{bootcamp.avg_grade.toFixed(1)}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span className="text-slate-600 dark:text-slate-400">Completion:</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">{bootcamp.completion_rate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
          <div className={cn(
            "inline-block px-2 py-1 rounded text-white",
            bootcamp.status === 'active' ? "bg-green-500" :
            bootcamp.status === 'completed' ? "bg-blue-500" : "bg-gray-500"
          )}>
            {bootcamp.status.toUpperCase()}
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function BootcampComparisonChart({ 
  bootcamps, 
  isLoading, 
  className 
}: BootcampComparisonChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'radar' | 'line'>('bar')
  const [compareMetric, setCompareMetric] = useState<'performance' | 'engagement' | 'size'>('performance')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all')
  
  // Filter bootcamps based on status
  const filteredBootcamps = bootcamps.filter(bootcamp => 
    statusFilter === 'all' || bootcamp.status === statusFilter
  )

  // Prepare data for different chart types
  const prepareBarChartData = () => {
    return filteredBootcamps.map(bootcamp => ({
      ...bootcamp,
      displayName: bootcamp.bootcamp_name.length > 15 
        ? bootcamp.bootcamp_name.substring(0, 15) + '...' 
        : bootcamp.bootcamp_name
    }))
  }

  // Prepare radar chart data (top 5 bootcamps)
  const prepareRadarData = () => {
    return filteredBootcamps
      .slice(0, 5)
      .map(bootcamp => ({
        bootcamp: bootcamp.bootcamp_name.split(' ')[0], // First word only
        attendance: bootcamp.avg_attendance_rate,
        attention: bootcamp.avg_attention_rate,
        grades: bootcamp.avg_grade * 10, // Scale to 0-100
        completion: bootcamp.completion_rate,
        satisfaction: bootcamp.satisfaction_score,
        fullName: bootcamp.bootcamp_name
      }))
  }

  const barData = prepareBarChartData()
  const radarData = prepareRadarData()

  // Calculate statistics
  const stats = {
    totalBootcamps: filteredBootcamps.length,
    totalStudents: filteredBootcamps.reduce((sum, b) => sum + b.student_count, 0),
    totalInstructors: filteredBootcamps.reduce((sum, b) => sum + b.instructor_count, 0),
    avgAttendance: filteredBootcamps.reduce((sum, b) => sum + b.avg_attendance_rate, 0) / filteredBootcamps.length,
    avgGrade: filteredBootcamps.reduce((sum, b) => sum + b.avg_grade, 0) / filteredBootcamps.length,
    avgCompletion: filteredBootcamps.reduce((sum, b) => sum + b.completion_rate, 0) / filteredBootcamps.length,
    topPerformer: filteredBootcamps.reduce((prev, current) => 
      (prev.avg_grade + prev.completion_rate + prev.avg_attendance_rate) > 
      (current.avg_grade + current.completion_rate + current.avg_attendance_rate) ? prev : current
    ),
    activeBootcamps: bootcamps.filter(b => b.status === 'active').length,
    completedBootcamps: bootcamps.filter(b => b.status === 'completed').length
  }

  const title = "Bootcamp Performance Comparison"
  const description = "Comprehensive analysis comparing performance metrics across different bootcamp programs."

  const renderChart = () => {
    switch (chartType) {
      case 'radar':
        return (
          <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <PolarGrid />
            <PolarAngleAxis dataKey="bootcamp" className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar
              name="Attendance"
              dataKey="attendance"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Attention"
              dataKey="attention"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Grades"
              dataKey="grades"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Completion"
              dataKey="completion"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Legend />
          </RadarChart>
        )
      
      case 'line':
        return (
          <LineChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="displayName" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {compareMetric === 'performance' && (
              <>
                <Line type="monotone" dataKey="avg_attendance_rate" stroke="#3b82f6" strokeWidth={2} name="Attendance Rate" />
                <Line type="monotone" dataKey="avg_attention_rate" stroke="#10b981" strokeWidth={2} name="Attention Rate" />
                <Line type="monotone" dataKey="completion_rate" stroke="#8b5cf6" strokeWidth={2} name="Completion Rate" />
              </>
            )}
            {compareMetric === 'engagement' && (
              <>
                <Line type="monotone" dataKey="avg_grade" stroke="#f59e0b" strokeWidth={2} name="Average Grade" />
                <Line type="monotone" dataKey="satisfaction_score" stroke="#f97316" strokeWidth={2} name="Satisfaction" />
              </>
            )}
            {compareMetric === 'size' && (
              <>
                <Line type="monotone" dataKey="student_count" stroke="#06b6d4" strokeWidth={2} name="Students" />
                <Line type="monotone" dataKey="total_sessions" stroke="#84cc16" strokeWidth={2} name="Sessions" />
              </>
            )}
          </LineChart>
        )

      default:
        return (
          <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="displayName" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {compareMetric === 'performance' && (
              <>
                <Bar dataKey="avg_attendance_rate" fill="#3b82f6" name="Attendance Rate" />
                <Bar dataKey="avg_attention_rate" fill="#10b981" name="Attention Rate" />
                <Bar dataKey="completion_rate" fill="#8b5cf6" name="Completion Rate" />
              </>
            )}
            {compareMetric === 'engagement' && (
              <>
                <Bar dataKey="avg_grade" fill="#f59e0b" name="Average Grade" />
                <Bar dataKey="satisfaction_score" fill="#f97316" name="Satisfaction Score" />
              </>
            )}
            {compareMetric === 'size' && (
              <>
                <Bar dataKey="student_count" fill="#06b6d4" name="Student Count" />
                <Bar dataKey="instructor_count" fill="#8b5cf6" name="Instructor Count" />
                <Bar dataKey="total_sessions" fill="#84cc16" name="Total Sessions" />
              </>
            )}
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
              onClick={() => setChartType('radar')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'radar' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Radar
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
              Line
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <select
              value={compareMetric}
              onChange={(e) => setCompareMetric(e.target.value as any)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
            >
              <option value="performance">Performance Metrics</option>
              <option value="engagement">Engagement Metrics</option>
              <option value="size">Size Metrics</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
              <option value="upcoming">Upcoming Only</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Bootcamps</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.totalBootcamps}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Students</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.totalStudents}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-purple-800 dark:text-purple-200">Instructors</div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.totalInstructors}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Avg Attend</span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {stats.avgAttendance.toFixed(0)}%
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Avg Grade</span>
            </div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {stats.avgGrade.toFixed(1)}
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-indigo-800 dark:text-indigo-200">Completion</div>
            <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
              {stats.avgCompletion.toFixed(0)}%
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Active</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {stats.activeBootcamps}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Top Performing Bootcamps</h4>
          <div className="space-y-3">
            {filteredBootcamps
              .sort((a, b) => (b.avg_grade + b.completion_rate + b.avg_attendance_rate) - (a.avg_grade + a.completion_rate + a.avg_attendance_rate))
              .slice(0, 3)
              .map((bootcamp, index) => (
                <div key={bootcamp.bootcamp_id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700 rounded border">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{bootcamp.bootcamp_name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {bootcamp.student_count} students • {bootcamp.total_sessions} sessions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex space-x-2 text-xs">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {bootcamp.avg_attendance_rate.toFixed(0)}% attend
                      </span>
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        {bootcamp.avg_grade.toFixed(1)} grade
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
