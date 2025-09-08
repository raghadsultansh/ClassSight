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
  ScatterChart,
  Scatter
} from 'recharts'
import { Award, Users, Eye, TrendingUp, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InstructorPerformanceData {
  instructor_id: string
  full_name: string
  avg_attendance: number
  avg_attention: number
  avg_student_grades: number
  total_students: number
  total_sessions: number
  effectiveness_score: number
}

interface InstructorPerformanceChartProps {
  data: InstructorPerformanceData[]
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg max-w-xs">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between space-x-2 text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
            </div>
            <span className="font-medium text-slate-900 dark:text-white">
              {entry.value.toFixed(1)}
              {entry.name.includes('Rate') || entry.name.includes('Score') ? '%' : ''}
            </span>
          </div>
        ))}
        {payload[0]?.payload && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
            <div>Students: {payload[0].payload.total_students}</div>
            <div>Sessions: {payload[0].payload.total_sessions}</div>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function InstructorPerformanceChart({ data, isLoading, className }: InstructorPerformanceChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'radar' | 'scatter'>('bar')
  const [sortBy, setSortBy] = useState<'effectiveness' | 'attendance' | 'attention' | 'grades'>('effectiveness')
  
  // Sort data based on selected criteria
  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'attendance':
        return b.avg_attendance - a.avg_attendance
      case 'attention':
        return b.avg_attention - a.avg_attention
      case 'grades':
        return b.avg_student_grades - a.avg_student_grades
      default:
        return b.effectiveness_score - a.effectiveness_score
    }
  })

  // Calculate statistics
  const stats = {
    totalInstructors: data.length,
    avgEffectiveness: data.reduce((sum, item) => sum + item.effectiveness_score, 0) / data.length,
    topPerformer: data.reduce((prev, current) => 
      prev.effectiveness_score > current.effectiveness_score ? prev : current
    ),
    totalStudents: data.reduce((sum, item) => sum + item.total_students, 0),
    totalSessions: data.reduce((sum, item) => sum + item.total_sessions, 0)
  }

  // Prepare radar chart data
  const radarData = sortedData.slice(0, 5).map(instructor => ({
    instructor: instructor.full_name.split(' ')[0], // First name only
    attendance: instructor.avg_attendance,
    attention: instructor.avg_attention,
    grades: instructor.avg_student_grades,
    fullName: instructor.full_name
  }))

  const title = `Instructor Performance Dashboard`
  const description = `Comprehensive analysis of instructor effectiveness based on student attendance, attention rates, and academic performance.`

  const renderChart = () => {
    switch (chartType) {
      case 'radar':
        return (
          <RadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <PolarGrid />
            <PolarAngleAxis dataKey="instructor" className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 10 }} />
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
            <Legend />
          </RadarChart>
        )
      
      case 'scatter':
        return (
          <ScatterChart data={sortedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              type="number" 
              dataKey="avg_attendance" 
              name="Attendance" 
              domain={[0, 100]}
              className="text-slate-600 dark:text-slate-400" 
            />
            <YAxis 
              type="number" 
              dataKey="avg_attention" 
              name="Attention" 
              domain={[0, 100]}
              className="text-slate-600 dark:text-slate-400" 
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Instructors" data={sortedData} fill="#8884d8" />
          </ScatterChart>
        )
      
      default:
        return (
          <BarChart data={sortedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="full_name" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="avg_attendance" fill="#3b82f6" name="Attendance Rate" />
            <Bar dataKey="avg_attention" fill="#10b981" name="Attention Rate" />
            <Bar dataKey="avg_student_grades" fill="#f59e0b" name="Student Grades" />
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
              onClick={() => setChartType('scatter')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                chartType === 'scatter' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Scatter
            </button>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
            >
              <option value="effectiveness">Effectiveness</option>
              <option value="attendance">Attendance</option>
              <option value="attention">Attention</option>
              <option value="grades">Grades</option>
            </select>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Instructors</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.totalInstructors}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Avg Effectiveness</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.avgEffectiveness.toFixed(1)}%
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Top Performer</span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100 truncate">
              {stats.topPerformer?.full_name.split(' ')[0] || 'N/A'}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-purple-800 dark:text-purple-200">Total Students</div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.totalStudents}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Sessions</div>
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

        {/* Top Performers List */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Top Performers</h4>
          <div className="space-y-2">
            {sortedData.slice(0, 3).map((instructor, index) => (
              <div key={instructor.instructor_id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"
                  )}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {instructor.full_name}
                  </span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {instructor.effectiveness_score.toFixed(1)}% effectiveness
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
