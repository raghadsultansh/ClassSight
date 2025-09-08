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
  ReferenceLine
} from 'recharts'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AttentionData {
  date: string
  attention: number
  distraction: number
  max_attention?: number
  min_attention?: number
  session_count?: number
}

interface AttentionChartProps {
  data: AttentionData[]
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
              {entry.value.toFixed(1)}%
            </span>
          </div>
        ))}
        {payload[0]?.payload?.session_count && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">
            Sessions: {payload[0].payload.session_count}
          </div>
        )}
      </div>
    )
  }
  return null
}

export function AttentionChart({ data, granularity, isLoading, className }: AttentionChartProps) {
  const [showMinMax, setShowMinMax] = useState(false)
  
  // Calculate statistics
  const stats = {
    avgAttention: data.length > 0 ? data.reduce((sum, item) => sum + item.attention, 0) / data.length : 0,
    avgDistraction: data.length > 0 ? data.reduce((sum, item) => sum + item.distraction, 0) / data.length : 0,
    maxAttention: Math.max(...data.map(item => item.attention || 0)),
    minAttention: Math.min(...data.map(item => item.attention || 0))
  }

  const title = `Attention vs Distraction Analysis`
  const description = `Track student attention and distraction rates over time. Higher attention rates indicate better engagement and learning outcomes.`

  return (
    <ChartCard
      title={title}
      description={description}
      isLoading={isLoading}
      className={className}
    >
      <div className="space-y-4">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Performance Metrics</h4>
          <button
            onClick={() => setShowMinMax(!showMinMax)}
            className={cn(
              "p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
              showMinMax && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            )}
            title="Toggle Min/Max Lines"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Avg Attention</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.avgAttention.toFixed(1)}%
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-800 dark:text-red-200">Avg Distraction</span>
            </div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {stats.avgDistraction.toFixed(1)}%
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-blue-800 dark:text-blue-200">Peak Attention</div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.maxAttention.toFixed(1)}%
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-orange-800 dark:text-orange-200">Low Point</div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {stats.minAttention.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis 
                dataKey="date" 
                className="text-slate-600 dark:text-slate-400"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-slate-600 dark:text-slate-400"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Reference lines */}
              <ReferenceLine y={stats.avgAttention} stroke="#10b981" strokeDasharray="5 5" opacity={0.7} />
              <ReferenceLine y={stats.avgDistraction} stroke="#ef4444" strokeDasharray="5 5" opacity={0.7} />
              
              {/* Min/Max lines if enabled */}
              {showMinMax && (
                <>
                  <ReferenceLine y={stats.maxAttention} stroke="#3b82f6" strokeDasharray="2 2" opacity={0.5} />
                  <ReferenceLine y={stats.minAttention} stroke="#f97316" strokeDasharray="2 2" opacity={0.5} />
                </>
              )}
              
              <Line 
                type="monotone" 
                dataKey="attention" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981' }}
                name="Attention Rate"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="distraction" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444' }}
                name="Distraction Rate"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Key Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="text-slate-600 dark:text-slate-400">
              <strong>Engagement Ratio:</strong> {((stats.avgAttention / (stats.avgAttention + stats.avgDistraction)) * 100).toFixed(1)}% focused
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              <strong>Performance Range:</strong> {(stats.maxAttention - stats.minAttention).toFixed(1)}% variance
            </div>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
