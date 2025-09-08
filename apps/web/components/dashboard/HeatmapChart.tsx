"use client"

import { ChartCard } from '@/components/chart-card'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

interface SessionPeriodData {
  period: string
  attention: number
  attendance: number
  sessions: number
  avg_students: number
  engagement: number
}

interface HeatmapChartProps {
  data: SessionPeriodData[]
  metric: 'attention' | 'attendance' | 'engagement'
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-blue-600">
            Attention: <span className="font-medium">{data.attention.toFixed(1)}%</span>
          </p>
          <p className="text-green-600">
            Attendance: <span className="font-medium">{data.attendance.toFixed(1)}%</span>
          </p>
          <p className="text-purple-600">
            Sessions: <span className="font-medium">{data.sessions}</span>
          </p>
          <p className="text-orange-600">
            Avg Students: <span className="font-medium">{data.avg_students.toFixed(1)}</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function HeatmapChart({ 
  data = [], 
  metric = 'attention',
  isLoading = false,
  className 
}: HeatmapChartProps) {
  const getBarColor = (metric: string) => {
    switch (metric) {
      case 'attention': return '#3b82f6'
      case 'attendance': return '#10b981'
      case 'engagement': return '#8b5cf6'
      default: return '#3b82f6'
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'attention': return 'Attention Rate'
      case 'attendance': return 'Attendance Rate'
      case 'engagement': return 'Engagement Score'
      default: return 'Performance'
    }
  }
  
  return (
    <ChartCard
      title="Session Performance by Time Period"
      description="Performance metrics across different times of the day"
      isLoading={isLoading}
      className={className}
    >
      <div className="space-y-4">
        <div className="h-80 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="period" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar 
                dataKey={metric}
                name={getMetricLabel(metric)}
                fill={getBarColor(metric)}
                radius={[4, 4, 0, 0]}
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          {data.map((period) => (
            <div key={period.period} className="text-center p-3 bg-slate-50/80 rounded-lg border">
              <div className="font-semibold text-slate-900">{period.period}</div>
              <div className="text-slate-600 mt-1">
                {period.sessions} sessions
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ~{period.avg_students.toFixed(0)} students/session
              </div>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div>Attention: {period.attention.toFixed(1)}%</div>
                <div>Attendance: {period.attendance.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}
