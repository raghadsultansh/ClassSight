"use client"

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardFilters, FilterState } from '@/components/dashboard-filters'
import { KPICard } from '@/components/kpi-card'
import { ChartCard } from '@/components/chart-card'
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
  IconTrendingUp 
} from '@tabler/icons-react'

// Mock data based on your EDA
const mockAttendanceData = [
  { time: '10:00', attendance: 85.2, attention: 72.5, distraction: 15.8 },
  { time: '10:30', attendance: 88.1, attention: 75.3, distraction: 12.7 },
  { time: '11:00', attendance: 92.4, attention: 78.9, distraction: 10.5 },
  { time: '11:30', attendance: 89.7, attention: 76.2, distraction: 13.1 },
  { time: '12:00', attendance: 85.3, attention: 70.8, distraction: 18.2 },
  { time: '13:00', attendance: 78.9, attention: 68.4, distraction: 21.5 },
  { time: '13:30', attendance: 82.1, attention: 71.2, distraction: 16.9 },
  { time: '14:00', attendance: 86.5, attention: 74.7, distraction: 14.3 },
  { time: '14:30', attendance: 83.8, attention: 72.9, distraction: 15.8 },
  { time: '15:00', attendance: 80.2, attention: 69.1, distraction: 19.4 },
]

const mockWeeklyData = [
  { week: 'Week 1', attendance: 86.5, maxStudents: 28, minStudents: 18, avgStudents: 23 },
  { week: 'Week 2', attendance: 88.2, maxStudents: 30, minStudents: 20, avgStudents: 25 },
  { week: 'Week 3', attendance: 84.7, maxStudents: 27, minStudents: 17, avgStudents: 22 },
  { week: 'Week 4', attendance: 90.1, maxStudents: 32, minStudents: 22, avgStudents: 27 },
  { week: 'Week 5', attendance: 87.8, maxStudents: 29, minStudents: 19, avgStudents: 24 },
]

const mockDailyTrends = [
  { date: '2025-01-01', attendance: 85.2, attention: 72.1, distraction: 16.8 },
  { date: '2025-01-02', attendance: 88.4, attention: 75.3, distraction: 14.2 },
  { date: '2025-01-03', attendance: 86.7, attention: 73.8, distraction: 15.5 },
  { date: '2025-01-04', attendance: 91.2, attention: 78.9, distraction: 12.1 },
  { date: '2025-01-05', attendance: 89.5, attention: 76.4, distraction: 13.7 },
  { date: '2025-01-06', attendance: 87.8, attention: 74.2, distraction: 15.1 },
  { date: '2025-01-07', attendance: 90.3, attention: 77.6, distraction: 12.8 },
]

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    view: 'overview',
    bootcamps: ['1', '2'],
    granularity: 'daily',
    includeCompleted: false
  })

  const userRole = 'instructor' // This would come from auth context

  const renderOverviewCharts = () => (
    <>
      {/* KPI Cards */}
      <div className="grid lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          title="Average Attendance"
          value="87.8%"
          change={{ value: 2.4, period: 'last week' }}
          trend="up"
          icon={<IconUsers className="w-5 h-5 text-white" />}
          description="Overall class attendance percentage across all sessions"
        />
        <KPICard
          title="Attention Rate"
          value="74.2%"
          change={{ value: 1.8, period: 'last week' }}
          trend="up"
          icon={<IconEye className="w-5 h-5 text-white" />}
          description="Average student attention rate during lessons"
        />
        <KPICard
          title="Active Students"
          value="24"
          change={{ value: -1.2, period: 'last week' }}
          trend="down"
          icon={<IconUsers className="w-5 h-5 text-white" />}
          description="Average number of active students per session"
        />
        <KPICard
          title="Session Duration"
          value="2.5h"
          change={{ value: 0.0, period: 'last week' }}
          trend="neutral"
          icon={<IconClock className="w-5 h-5 text-white" />}
          description="Average session duration"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Half-Hourly Attendance */}
        <ChartCard
          title="Half-Hourly Attendance Pattern"
          description="Shows attendance patterns throughout the day in 30-minute intervals"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
              <XAxis 
                dataKey="time" 
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
                dataKey="attendance" 
                stroke="#6366f1" 
                strokeWidth={3}
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
              />
              <ReferenceLine 
                y={87.8} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label={{ value: "Mean: 87.8%", position: "insideTopRight" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Weekly Student Numbers */}
        <ChartCard
          title="Weekly Student Numbers"
          description="Max, min, and average student counts per week"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockWeeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
              <XAxis 
                dataKey="week" 
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
              <Bar dataKey="maxStudents" fill="#6366f1" name="Max Students" />
              <Bar dataKey="avgStudents" fill="#8b5cf6" name="Avg Students" />
              <Bar dataKey="minStudents" fill="#ec4899" name="Min Students" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Trend Comparison Chart */}
      <div className="mb-6">
        <ChartCard
          title="Daily Trends: Attendance, Attention & Distraction"
          description="Comparative view of key metrics over time"
          className="col-span-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockDailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
              <XAxis 
                dataKey="date" 
                stroke="rgb(100, 116, 139)" 
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="attendance" 
                stroke="#6366f1" 
                strokeWidth={2}
                name="Attendance %"
              />
              <Line 
                type="monotone" 
                dataKey="attention" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Attention %"
              />
              <Line 
                type="monotone" 
                dataKey="distraction" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Distraction %"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )

  const renderAttentionCharts = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      <ChartCard
        title="Attention Rate by Time"
        description="How attention varies throughout the day"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockAttendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
            <XAxis dataKey="time" stroke="rgb(100, 116, 139)" fontSize={12} />
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
              dataKey="attention" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Attention vs Distraction"
        description="Comparison of attention and distraction rates"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockAttendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
            <XAxis dataKey="time" stroke="rgb(100, 116, 139)" fontSize={12} />
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
            <Bar dataKey="attention" fill="#ef4444" name="Attention %" />
            <Bar dataKey="distraction" fill="#f59e0b" name="Distraction %" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )

  const renderContent = () => {
    switch (filters.view) {
      case 'attention':
        return renderAttentionCharts()
      case 'attendance':
        return (
          <ChartCard
            title="Attendance Trends"
            description="Detailed attendance analysis"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                <XAxis dataKey="date" stroke="rgb(100, 116, 139)" fontSize={12} />
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
                  dataKey="attendance" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'students':
        return (
          <ChartCard
            title="Student Count Analysis"
            description="Student participation metrics"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                <XAxis dataKey="week" stroke="rgb(100, 116, 139)" fontSize={12} />
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
                <Bar dataKey="maxStudents" fill="#6366f1" name="Max Students" />
                <Bar dataKey="avgStudents" fill="#8b5cf6" name="Avg Students" />
                <Bar dataKey="minStudents" fill="#ec4899" name="Min Students" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'comparisons':
        return renderAttentionCharts()
      default:
        return renderOverviewCharts()
    }
  }

  return (
    <DashboardLayout userRole={userRole} title="Analytics Dashboard">
      <DashboardFilters 
        filters={filters}
        onFiltersChange={setFilters}
        userRole={userRole}
      />
      
      {renderContent()}
    </DashboardLayout>
  )
}
