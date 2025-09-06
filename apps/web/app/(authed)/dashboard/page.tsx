"use client"

import { useState, useEffect } from 'react'
import { DashboardFilters, FilterState } from '@/components/dashboard-filters'
import { KPICard } from '@/components/kpi-card'
import { ChartCard } from '@/components/chart-card'
import { dashboardAPI, APIError } from '@/lib/fastapi'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts'
import { 
  IconUsers, 
  IconEye, 
  IconClock, 
  IconTrendingUp,
  IconLoader2
} from '@tabler/icons-react'

interface DashboardData {
  kpis?: any
  attendanceChart?: any[]
  attentionChart?: any[]
  gradeDistribution?: any[]
  leaderboard?: any[]
  attendanceHeatmap?: any[]
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    view: 'overview',
    bootcamps: [],
    instructors: [],
    granularity: 'daily',
    includeCompleted: false,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0] // today
    }
  })
  
  const [data, setData] = useState<DashboardData>({
    attendanceChart: [],
    attentionChart: [],
    gradeDistribution: [],
    leaderboard: [],
    attendanceHeatmap: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const filterPayload = {
        bootcamp_ids: filters.bootcamps,
        granularity: filters.granularity,
        include_completed: filters.includeCompleted
      }

      const [kpis, attendanceChart, attentionChart, gradeDistribution, leaderboard, attendanceHeatmap] = await Promise.all([
        dashboardAPI.getKPIs(filterPayload).catch(() => null),
        dashboardAPI.getAttendanceChart(filterPayload).catch(() => null),
        dashboardAPI.getAttentionChart(filterPayload).catch(() => null),
        dashboardAPI.getGradeDistribution(filterPayload).catch(() => null),
        dashboardAPI.getLeaderboard(filterPayload).catch(() => null),
        dashboardAPI.getAttendanceHeatmap(filterPayload).catch(() => null)
      ])

      setData({
        kpis: kpis || {},
        attendanceChart: attendanceChart || [],
        attentionChart: attentionChart || [],
        gradeDistribution: gradeDistribution || [],
        leaderboard: leaderboard || [],
        attendanceHeatmap: attendanceHeatmap || []
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof APIError ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [filters])

  const renderLoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center space-x-2">
        <IconLoader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="text-slate-600 dark:text-slate-300">Loading dashboard data...</span>
      </div>
    </div>
  )

  const renderErrorState = () => (
    <div className="glass rounded-xl p-6 text-center">
      <div className="text-red-600 dark:text-red-400 mb-4">
        <IconTrendingUp className="w-12 h-12 mx-auto mb-2" />
        <h3 className="text-lg font-semibold">Unable to load dashboard</h3>
        <p className="text-sm">{error}</p>
      </div>
      <button 
        onClick={fetchDashboardData}
        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
      >
        Try Again
      </button>
    </div>
  )

  const renderOverviewCharts = () => (
    <>
      {/* KPI Cards */}
      {data.kpis && (
        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          <KPICard
            title="Average Attendance"
            value={`${data.kpis.avg_attendance_percentage?.toFixed(1) || 0}%`}
            change={{ 
              value: data.kpis.attendance_change_percentage || 0, 
              period: 'last week' 
            }}
            trend={data.kpis.attendance_change_percentage > 0 ? 'up' : data.kpis.attendance_change_percentage < 0 ? 'down' : 'neutral'}
            icon={<IconUsers className="w-5 h-5 text-white" />}
            description="Overall class attendance percentage across all sessions"
          />
          <KPICard
            title="Attention Rate"
            value={`${data.kpis.avg_attention_rate?.toFixed(1) || 0}%`}
            change={{ 
              value: data.kpis.attention_change_percentage || 0, 
              period: 'last week' 
            }}
            trend={data.kpis.attention_change_percentage > 0 ? 'up' : data.kpis.attention_change_percentage < 0 ? 'down' : 'neutral'}
            icon={<IconEye className="w-5 h-5 text-white" />}
            description="Average student attention rate during lessons"
          />
          <KPICard
            title="Active Students"
            value={data.kpis.avg_students || 0}
            change={{ 
              value: data.kpis.students_change_percentage || 0, 
              period: 'last week' 
            }}
            trend={data.kpis.students_change_percentage > 0 ? 'up' : data.kpis.students_change_percentage < 0 ? 'down' : 'neutral'}
            icon={<IconUsers className="w-5 h-5 text-white" />}
            description="Average number of active students per session"
          />
          <KPICard
            title="Total Sessions"
            value={data.kpis.total_sessions || 0}
            change={{ 
              value: data.kpis.sessions_change_percentage || 0, 
              period: 'last week' 
            }}
            trend={data.kpis.sessions_change_percentage > 0 ? 'up' : data.kpis.sessions_change_percentage < 0 ? 'down' : 'neutral'}
            icon={<IconClock className="w-5 h-5 text-white" />}
            description="Total number of sessions recorded"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Attendance Chart */}
        {data.attendanceChart && (
          <ChartCard
            title="Attendance Pattern"
            description="Shows attendance patterns over time based on selected granularity"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                <XAxis 
                  dataKey="period" 
                  stroke="rgb(100, 116, 139)" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgb(100, 116, 139)" 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendance_percentage" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Attention Chart */}
        {data.attentionChart && (
          <ChartCard
            title="Attention Analysis"
            description="Student attention and distraction rates over time"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attentionChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                <XAxis 
                  dataKey="period" 
                  stroke="rgb(100, 116, 139)" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgb(100, 116, 139)" 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avg_attention_rate" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Attention %"
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_distraction_rate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Distraction %"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Grade Distribution */}
      {data.gradeDistribution && (
        <div className="mb-6">
          <ChartCard
            title="Grade Distribution"
            description="Distribution of student grades across bootcamps"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                <XAxis 
                  dataKey="grade_range" 
                  stroke="rgb(100, 116, 139)" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="rgb(100, 116, 139)" 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </>
  )

  const renderAttentionCharts = () => (
    <div className="grid lg:grid-cols-1 gap-6">
      {data.attentionChart && (
        <ChartCard
          title="Detailed Attention Analysis"
          description="Comprehensive view of attention and distraction patterns"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.attentionChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
              <XAxis dataKey="period" stroke="rgb(100, 116, 139)" fontSize={12} />
              <YAxis stroke="rgb(100, 116, 139)" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(15, 23, 42, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avg_attention_rate" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Attention %"
              />
              <Line 
                type="monotone" 
                dataKey="avg_distraction_rate" 
                stroke="#f59e0b" 
                strokeWidth={3}
                name="Distraction %"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )

  const renderContent = () => {
    if (loading) return renderLoadingState()
    if (error) return renderErrorState()

    switch (filters.view) {
      case 'attention':
        return renderAttentionCharts()
      case 'attendance':
        return data.attendanceChart ? (
          <ChartCard
            title="Attendance Trends"
            description="Detailed attendance analysis"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                <XAxis dataKey="period" stroke="rgb(100, 116, 139)" fontSize={12} />
                <YAxis stroke="rgb(100, 116, 139)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendance_percentage" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : renderLoadingState()
      case 'students':
        return data.kpis ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <KPICard
              title="Average Students"
              value={data.kpis.avg_students || 0}
              description="Average number of students per session"
            />
            <KPICard
              title="Max Students"
              value={data.kpis.max_students || 0}
              description="Maximum students in a single session"
            />
          </div>
        ) : renderLoadingState()
      case 'comparisons':
        return renderAttentionCharts()
      default:
        return renderOverviewCharts()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Real-time insights into classroom engagement and performance
          </p>
        </div>
      </div>

      <DashboardFilters 
        filters={filters}
        onFiltersChange={setFilters}
        userRole="admin" // TODO: Get from auth context
      />
      
      {renderContent()}
    </div>
  )
}