"use client"

import { useState, useEffect } from 'react'
import { DashboardFilters, FilterState } from '@/components/dashboard-filters'
import { dashboardAPI, APIError } from '@/lib/fastapi'
import { ChartCard } from '@/components/chart-card'
import { 
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
  Eye,
  TrendingUp,
  Award,
  BarChart3
} from 'lucide-react'

// Import Recharts components
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

// Import our comprehensive chart components
import { KpiCard } from '@/components/dashboard/KpiCard'
import { AttentionChart } from '@/components/dashboard/AttentionChart'
import { StudentMetricsChart } from '@/components/dashboard/StudentMetricsChart'
import { GradePerformanceChart } from '@/components/dashboard/GradePerformanceChart'
import { InstructorPerformanceChart } from '@/components/dashboard/InstructorPerformanceChart'
import { CorrelationAnalysisChart } from '@/components/dashboard/CorrelationAnalysisChart'
import { HeatmapChart } from '@/components/dashboard/HeatmapChart'
import { LeaderboardChart } from '@/components/dashboard/LeaderboardChart'

interface DashboardData {
  kpis?: any
  attendanceChart?: any[]
  attentionChart?: any[]
  gradeDistribution?: any[]
  leaderboard?: any[]
  attendanceHeatmap?: any[]
  studentMetrics?: any[]
  gradePerformance?: any
  instructorPerformance?: any[]
  correlationData?: {
    scatterData: any[]
    correlationMatrix: any[]
  }
  heatmapData?: any[]
  leaderboardData?: any[]
  bootcampComparison?: any[]
  predictiveInsights?: {
    data: any[]
    alerts: any[]
    accuracy: number
  }
  engagementMetrics?: {
    data: any[]
    real_time_metrics: any
  }
}

export default function DashboardPage() {
  // Set default auth headers if not present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('x-user-id')) {
        localStorage.setItem('x-user-id', '1')
        console.log('Set default x-user-id to 1')
      }
      if (!localStorage.getItem('x-user-role')) {
        localStorage.setItem('x-user-role', 'admin')
        console.log('Set default x-user-role to admin')
      }
      
      console.log('Current auth headers:', {
        'x-user-id': localStorage.getItem('x-user-id'),
        'x-user-role': localStorage.getItem('x-user-role')
      })
    }
  }, [])

  const [filters, setFilters] = useState<FilterState>({
    view: 'overview',
    bootcamps: [],
    instructors: [],
    granularity: 'daily',
    includeCompleted: true, // Default to true so users can see the rich data from completed bootcamps
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
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

      // Comprehensive filter sanitization
      const sanitizeArray = (arr: any[]): string[] => {
        if (!Array.isArray(arr)) return []
        return arr
          .filter(item => item !== null && item !== undefined && item !== '' && item !== 'null' && item !== 'undefined')
          .map(item => String(item))
          .filter(item => item.trim() !== '')
      }

      // Filter and process bootcamp IDs
      const sanitizedBootcamps = sanitizeArray(filters.bootcamps)
      const validBootcampIds = sanitizedBootcamps
        .filter(id => id !== 'all')  // Remove 'all' option
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id) && id > 0)  // Filter out invalid numbers

      // Filter and process instructor IDs  
      const sanitizedInstructors = sanitizeArray(filters.instructors)
      const validInstructorIds = sanitizedInstructors.filter(id => id !== 'all')

      // Smart bootcamp selection: if no bootcamps selected, use bootcamps with actual data
      let finalBootcampIds = validBootcampIds
      if (validBootcampIds.length === 0) {
        if (filters.includeCompleted) {
          finalBootcampIds = [1, 2, 3, 4, 5, 8] // All bootcamps from your database
        } else {
          finalBootcampIds = [1] // Use bootcamp 1 (Data Science) which has actual class_samples data
        }
        console.log('📊 No bootcamps selected, using bootcamps with data:', finalBootcampIds)
      }

      const filterPayload = {
        bootcamp_ids: finalBootcampIds,
        instructor_ids: validInstructorIds.length > 0 ? validInstructorIds : null,
        granularity: filters.granularity,
        include_completed: filters.includeCompleted
      }

      console.log('=== Dashboard Filter Processing DEBUG ===')
      console.log('Raw filters:', filters)
      console.log('Sanitized bootcamps:', sanitizedBootcamps)
      console.log('Sanitized instructors:', sanitizedInstructors)
      console.log('Valid bootcamp IDs:', validBootcampIds)
      console.log('Valid instructor IDs:', validInstructorIds)
      console.log('Final filter payload:', filterPayload)

      const [
        kpis, 
        attendanceChart, 
        attentionChart, 
        studentMetrics,
        gradePerformance,
        instructorPerformance,
        correlationData,
        heatmapData
      ] = await Promise.all([
        dashboardAPI.getKpis(filterPayload).catch(err => { console.error('KPIs failed:', err.message || err); return null; }),
        dashboardAPI.getAttendanceChart(filterPayload).catch(err => { console.error('Attendance chart failed:', err.message || err); return []; }),
        dashboardAPI.getAttentionChart(filterPayload).catch(err => { console.error('Attention chart failed:', err.message || err); return []; }),
        dashboardAPI.getStudentMetrics(filterPayload).catch(err => { console.error('Student metrics failed:', err.message || err); return []; }),
        dashboardAPI.getGradePerformance(filterPayload).catch(err => { console.error('Grade performance failed:', err.message || err); return []; }),
        dashboardAPI.getInstructorPerformance(filterPayload).catch(err => { console.error('Instructor performance failed:', err.message || err); return []; }),
        dashboardAPI.getCorrelationAnalysis(filterPayload).catch(err => { console.error('Correlation analysis failed:', err.message || err); return { scatterData: [], correlationMatrix: [] }; }),
        dashboardAPI.getHeatmapData(filterPayload).catch(err => { console.error('Heatmap data failed:', err.message || err); return []; })
      ])

      // Transform chart data to match expected format
      const transformAttendanceChart = (data: any) => {
        if (!Array.isArray(data)) return []
        return data.map(item => ({
          ...item,
          period: item.date,
          attendance_percentage: item.attendance
        }))
      }

      const transformAttentionChart = (data: any) => {
        if (!Array.isArray(data)) return []
        return data.map(item => ({
          ...item,
          period: item.date,
          avg_attention_rate: item.attention,
          avg_distraction_rate: item.distraction
        }))
      }

      const transformToLeaderboard = (data: any) => {
        if (!Array.isArray(data)) return []
        
        // Create leaderboard entries from student metrics data
        return data.map((item, index) => ({
          id: `student_${index + 1}`,
          name: `Day ${new Date(item.date).getDate()}`,
          score: Math.round(item.avg_present || 0),
          rank: index + 1,
          category: 'attendance',
          trend: index > 0 ? (item.avg_present > data[index - 1]?.avg_present ? 'up' : 'down') : 'stable',
          change: index > 0 ? Math.round((item.avg_present - data[index - 1]?.avg_present) * 10) / 10 : 0,
          badges: item.avg_present > 20 ? ['high-performer'] : [],
          details: {
            attendance_rate: Math.round((item.avg_present / item.enrolled) * 100),
            attention_rate: 85, // Mock data for now
            grade_average: 3.2, // Mock data for now
            improvement: index > 0 ? Math.round((item.avg_present - data[index - 1]?.avg_present) * 10) / 10 : 0
          }
        })).sort((a, b) => b.score - a.score).slice(0, 10) // Top 10 entries
      }

      // Debug logging
      console.log('Dashboard API Responses:', {
        kpis,
        attentionChart: Array.isArray(attentionChart) ? attentionChart.slice(0, 2) : attentionChart,
        studentMetrics: Array.isArray(studentMetrics) ? studentMetrics.slice(0, 2) : studentMetrics,
        heatmapData: Array.isArray(heatmapData) ? heatmapData.slice(0, 2) : heatmapData,
        gradePerformance: gradePerformance,
        instructorPerformance: Array.isArray(instructorPerformance) ? instructorPerformance.slice(0, 2) : instructorPerformance,
        correlationData
      })

      setData({
        kpis: kpis || {},
        attendanceChart: transformAttendanceChart(attendanceChart),
        attentionChart: transformAttentionChart(attentionChart),
        gradeDistribution: [],
        leaderboard: [],
        attendanceHeatmap: [],
        studentMetrics: Array.isArray(studentMetrics) ? studentMetrics : [],
        gradePerformance: gradePerformance || { distribution: [], trends: [] },
        instructorPerformance: Array.isArray(instructorPerformance) ? instructorPerformance : [],
        correlationData: (correlationData as any) || { scatterData: [], correlationMatrix: [] },
        heatmapData: Array.isArray(heatmapData) ? heatmapData : [],
        leaderboardData: transformToLeaderboard(studentMetrics)
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
    <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-12 shadow-2xl">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">Loading Dashboard</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Fetching your analytics data...</p>
        </div>
      </div>
    </div>
  )

  const renderErrorState = () => (
    <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-red-200/30 dark:border-red-500/20 rounded-2xl p-12 shadow-2xl">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Unable to load dashboard</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="group px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          <span className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span>Try Again</span>
          </span>
        </button>
      </div>
    </div>
  )

  const renderOverviewCharts = () => (
    <>
      {/* KPI Cards */}
      {data.kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          <KpiCard
            data={{
              value: data.kpis.average_attendance?.value || 0,
              change: data.kpis.average_attendance?.change || 0,
              label: "Average Attendance",
              icon: 'attendance',
              format: 'percentage'
            }}
          />
          <KpiCard
            data={{
              value: data.kpis.average_attention?.value || 0,
              change: data.kpis.average_attention?.change || 0,
              label: "Attention Rate",
              icon: 'attention',
              format: 'percentage'
            }}
          />
          <KpiCard
            data={{
              value: data.kpis.total_students?.value || 0,
              change: data.kpis.total_students?.change || 0,
              label: "Active Students",
              icon: 'students',
              format: 'number'
            }}
          />
          <KpiCard
            data={{
              value: data.kpis.engagement_score?.value || 0,
              change: data.kpis.engagement_score?.change || 0,
              label: "Engagement Score",
              icon: 'engagement',
              format: 'score'
            }}
          />
        </div>
      )}

      {/* Comprehensive Charts Grid */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Enhanced Attention Analysis */}
          <div className="min-h-[450px] p-1">
            <AttentionChart 
              data={data.attentionChart || []}
              granularity={filters.granularity}
              isLoading={loading}
            />
          </div>

          {/* Student Metrics */}
          <div className="min-h-[450px] p-1">
            <StudentMetricsChart 
              data={data.studentMetrics || []}
              granularity={filters.granularity}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Grade Performance */}
          <div className="min-h-[450px] p-1">
            <GradePerformanceChart 
              data={{
                distribution: data.gradePerformance?.distribution || [],
                trends: data.gradePerformance?.trends || []
              }}
              isLoading={loading}
            />
          </div>

          {/* Leaderboard */}
          <div className="min-h-[450px] p-1">
            <LeaderboardChart 
              data={[]}
              category="overall"
              type="students"
              isLoading={loading}
            />
          </div>
        </div>

        {/* Third Row - Wide Charts */}
        <div className="grid grid-cols-1 gap-8">
          {/* Correlation Analysis */}
          <div className="min-h-[550px] p-1">
            <CorrelationAnalysisChart 
              scatterData={data.correlationData?.scatterData || []}
              correlationMatrix={data.correlationData?.correlationMatrix || []}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Fourth Row - Session Performance */}
        <div className="grid grid-cols-1 gap-8">
          <div className="min-h-[550px] p-1">
            <HeatmapChart 
              data={data.heatmapData || []}
              metric="attention"
              isLoading={loading}
            />
          </div>
        </div>
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
    <div className="space-y-6">
      {/* Enhanced Attention Analysis */}
      <AttentionChart 
        data={data.attentionChart || []}
        granularity={filters.granularity}
        isLoading={loading}
      />
      
      {/* Correlation with Attention */}
      <CorrelationAnalysisChart 
        scatterData={data.correlationData?.scatterData || []}
        correlationMatrix={data.correlationData?.correlationMatrix || []}
        isLoading={loading}
      />
      
      {/* Attention Heatmap */}
      <HeatmapChart 
        data={data.heatmapData || []}
        metric="attention"
        isLoading={loading}
      />
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
            <KpiCard
              data={{
                value: data.kpis.avg_students || 0,
                change: 0,
                label: "Average Students",
                icon: 'students',
                format: 'number'
              }}
            />
            <KpiCard
              data={{
                value: data.kpis.max_students || 0,
                change: 0,
                label: "Max Students",
                icon: 'students',
                format: 'number'
              }}
            />
          </div>
        ) : renderLoadingState()
      case 'comparisons':
        return renderAttentionCharts()
      case 'instructors':
        return (
          <div className="space-y-8">
            <div className="min-h-[550px] p-1">
              <InstructorPerformanceChart 
                data={data.instructorPerformance || []}
                isLoading={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="min-h-[450px] p-1">
                <LeaderboardChart 
                  data={data.leaderboardData || []}
                  category="overall"
                  type="instructors"
                  isLoading={loading}
                />
              </div>
              
              <div className="min-h-[450px] p-1">
                <HeatmapChart 
                  data={data.heatmapData || []}
                  metric="engagement"
                  isLoading={loading}
                />
              </div>
            </div>
          </div>
        )
      default:
        return renderOverviewCharts()
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <div className="max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Modern Clean Header */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  ClassSight Analytics Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
                  Comprehensive attendance and engagement analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Live</span>
              </div>
              <button
                onClick={fetchDashboardData}
                className="p-2 md:p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-slate-700 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Modern Filters */}
        <DashboardFilters 
          filters={filters}
          onFiltersChange={setFilters}
          userRole="admin"
          isLoading={loading}
          onRefresh={fetchDashboardData}
        />
        
        {/* Main Content Area - Improved responsive layout */}
        <div className="w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}