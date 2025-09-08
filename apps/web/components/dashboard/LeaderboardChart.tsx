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
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Trophy, Star, Award, TrendingUp, Users, Crown, Medal, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  name: string
  score: number
  rank: number
  category: string
  trend: 'up' | 'down' | 'stable'
  change: number
  avatar?: string
  badges: string[]
  details: {
    attendance_rate: number
    attention_rate: number
    grade_average: number
    improvement: number
  }
}

interface LeaderboardChartProps {
  data: LeaderboardEntry[]
  category: 'overall' | 'attendance' | 'attention' | 'grades' | 'improvement'
  type: 'students' | 'instructors' | 'bootcamps'
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && payload[0].payload) {
    const entry = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center space-x-2 mb-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
            entry.rank === 1 ? "bg-yellow-500" : 
            entry.rank === 2 ? "bg-gray-400" : 
            entry.rank === 3 ? "bg-orange-600" : "bg-slate-500"
          )}>
            {entry.rank}
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.name}</p>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Score:</span>
            <span className="font-medium text-slate-900 dark:text-white">{entry.score.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Attendance:</span>
            <span className="font-medium text-slate-900 dark:text-white">{entry.details.attendance_rate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Attention:</span>
            <span className="font-medium text-slate-900 dark:text-white">{entry.details.attention_rate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Grades:</span>
            <span className="font-medium text-slate-900 dark:text-white">{entry.details.grade_average.toFixed(1)}</span>
          </div>
        </div>
        {entry.badges.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Badges:</div>
            <div className="flex flex-wrap gap-1">
              {entry.badges.map((badge, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  return null
}

export function LeaderboardChart({ 
  data, 
  category, 
  type, 
  isLoading, 
  className 
}: LeaderboardChartProps) {
  const [viewType, setViewType] = useState<'list' | 'chart' | 'pie'>('list')
  const [showTop, setShowTop] = useState<number>(10)
  
  // Sort and slice data based on showTop
  const displayData = data.slice(0, showTop)

  // Prepare pie chart data for distribution analysis
  const pieData = [
    { name: 'Top 25%', value: data.filter(d => d.rank <= data.length * 0.25).length, color: '#10b981' },
    { name: 'Second 25%', value: data.filter(d => d.rank > data.length * 0.25 && d.rank <= data.length * 0.5).length, color: '#3b82f6' },
    { name: 'Third 25%', value: data.filter(d => d.rank > data.length * 0.5 && d.rank <= data.length * 0.75).length, color: '#f59e0b' },
    { name: 'Bottom 25%', value: data.filter(d => d.rank > data.length * 0.75).length, color: '#ef4444' }
  ]

  // Calculate statistics
  const stats = {
    totalEntries: data.length,
    averageScore: data.reduce((sum, entry) => sum + entry.score, 0) / data.length,
    topPerformer: data[0],
    improvingCount: data.filter(entry => entry.trend === 'up').length,
    decliningCount: data.filter(entry => entry.trend === 'down').length,
    averageAttendance: data.reduce((sum, entry) => sum + entry.details.attendance_rate, 0) / data.length
  }

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'attendance':
        return { icon: Users, color: 'blue', label: 'Attendance Leaders' }
      case 'attention':
        return { icon: Target, color: 'green', label: 'Attention Champions' }
      case 'grades':
        return { icon: Award, color: 'yellow', label: 'Academic Excellence' }
      case 'improvement':
        return { icon: TrendingUp, color: 'purple', label: 'Most Improved' }
      default:
        return { icon: Trophy, color: 'gold', label: 'Overall Leaderboard' }
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'instructors':
        return 'Instructors'
      case 'bootcamps':
        return 'Bootcamps'
      default:
        return 'Students'
    }
  }

  const categoryInfo = getCategoryInfo(category)
  const CategoryIcon = categoryInfo.icon
  const typeLabel = getTypeLabel(type)

  const title = `${categoryInfo.label} - ${typeLabel}`
  const description = `Top performers ranked by ${category === 'overall' ? 'combined performance metrics' : categoryInfo.label.toLowerCase()}.`

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />
    if (rank === 3) return <Award className="w-4 h-4 text-orange-600" />
    return <span className="text-sm font-bold text-slate-600 dark:text-slate-400">#{rank}</span>
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />
    if (trend === 'down') return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
    return <div className="w-3 h-3 bg-gray-400 rounded-full" />
  }

  const renderChart = () => {
    switch (viewType) {
      case 'pie':
        return (
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )
      
      case 'chart':
        return (
          <BarChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="name" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" name="Score">
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={
                  entry.rank === 1 ? '#fbbf24' : 
                  entry.rank === 2 ? '#9ca3af' : 
                  entry.rank === 3 ? '#fb7185' : '#6b7280'
                } />
              ))}
            </Bar>
          </BarChart>
        )

      default:
        return (
          <div className="space-y-2 h-full overflow-y-auto">
            {displayData.map((entry, index) => (
              <div 
                key={entry.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md",
                  entry.rank <= 3 
                    ? "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700/50" 
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-center space-x-3">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  {/* Name and badges */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "font-medium",
                        entry.rank <= 3 ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"
                      )}>
                        {entry.name}
                      </span>
                      {getTrendIcon(entry.trend, entry.change)}
                    </div>
                    {entry.badges.length > 0 && (
                      <div className="flex space-x-1 mt-1">
                        {entry.badges.slice(0, 2).map((badge, badgeIndex) => (
                          <span 
                            key={badgeIndex} 
                            className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded"
                          >
                            {badge}
                          </span>
                        ))}
                        {entry.badges.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded">
                            +{entry.badges.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Key metrics */}
                  <div className="hidden sm:flex items-center space-x-3 text-xs">
                    <div className="text-center">
                      <div className="text-slate-500 dark:text-slate-400">Attend</div>
                      <div className="font-medium">{entry.details.attendance_rate.toFixed(0)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500 dark:text-slate-400">Focus</div>
                      <div className="font-medium">{entry.details.attention_rate.toFixed(0)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500 dark:text-slate-400">Grade</div>
                      <div className="font-medium">{entry.details.grade_average.toFixed(1)}</div>
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="text-right">
                    <div className={cn(
                      "text-lg font-bold",
                      entry.rank <= 3 ? "text-yellow-700 dark:text-yellow-300" : "text-slate-900 dark:text-white"
                    )}>
                      {entry.score.toFixed(1)}
                    </div>
                    {entry.change !== 0 && (
                      <div className={cn(
                        "text-xs",
                        entry.trend === 'up' ? "text-green-600 dark:text-green-400" : 
                        entry.trend === 'down' ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {entry.trend === 'up' ? '+' : ''}{entry.change.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              onClick={() => setViewType('list')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'list' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              List View
            </button>
            <button
              onClick={() => setViewType('chart')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'chart' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewType('pie')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'pie' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Distribution
            </button>
          </div>

          {/* Show Count Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 dark:text-slate-400">Show:</span>
            <select
              value={showTop}
              onChange={(e) => setShowTop(Number(e.target.value))}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={data.length}>All</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">Total</span>
            </div>
            <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
              {stats.totalEntries}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-800 dark:text-blue-200">Avg Score</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.averageScore.toFixed(1)}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Improving</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.improvingCount}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-red-800 dark:text-red-200">Declining</div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {stats.decliningCount}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800 dark:text-purple-200">Champion</span>
            </div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100 truncate">
              {stats.topPerformer?.name.split(' ')[0] || 'N/A'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg Attend</div>
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {stats.averageAttendance.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-96 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Achievement Highlights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Achievement Highlights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {data.slice(0, 3).map((entry, index) => (
              <div key={entry.id} className="bg-white dark:bg-slate-700 rounded border p-3">
                <div className="flex items-center space-x-2 mb-2">
                  {getRankIcon(entry.rank)}
                  <span className="font-medium text-slate-900 dark:text-white">{entry.name}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {entry.score.toFixed(1)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {entry.details.attendance_rate.toFixed(0)}% attendance • {entry.details.attention_rate.toFixed(0)}% focus
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
