"use client"

import { useState } from 'react'
import { ChartCard } from '@/components/chart-card'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Eye, Users, Clock, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CorrelationData {
  x_value: number
  y_value: number
  label: string
  size: number
  category: string
}

interface CorrelationMatrix {
  variable1: string
  variable2: string
  correlation: number
  p_value: number
  significance: 'high' | 'medium' | 'low' | 'none'
}

interface CorrelationAnalysisChartProps {
  scatterData: CorrelationData[]
  correlationMatrix: CorrelationMatrix[]
  isLoading?: boolean
  className?: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg max-w-xs">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">{data.label}</p>
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
              {entry.value.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          Category: {data.category}
        </div>
      </div>
    )
  }
  return null
}

const CorrelationTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const correlation = payload[0].value
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{label}</p>
        <div className="text-sm">
          <span className="text-slate-600 dark:text-slate-400">Correlation: </span>
          <span className={cn(
            "font-bold",
            Math.abs(correlation) > 0.7 ? "text-red-600 dark:text-red-400" :
            Math.abs(correlation) > 0.5 ? "text-yellow-600 dark:text-yellow-400" :
            Math.abs(correlation) > 0.3 ? "text-blue-600 dark:text-blue-400" :
            "text-slate-600 dark:text-slate-400"
          )}>
            {correlation.toFixed(3)}
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {Math.abs(correlation) > 0.7 ? "Strong correlation" :
           Math.abs(correlation) > 0.5 ? "Moderate correlation" :
           Math.abs(correlation) > 0.3 ? "Weak correlation" :
           "No correlation"}
        </div>
      </div>
    )
  }
  return null
}

export function CorrelationAnalysisChart({ 
  scatterData, 
  correlationMatrix, 
  isLoading, 
  className 
}: CorrelationAnalysisChartProps) {
  const [viewType, setViewType] = useState<'scatter' | 'matrix' | 'trends'>('scatter')
  const [selectedXVariable, setSelectedXVariable] = useState<string>('attention')
  const [selectedYVariable, setSelectedYVariable] = useState<string>('grades')

  // Filter data based on selected variables
  const filteredData = scatterData.filter(item => 
    item.category.includes(selectedXVariable) || item.category.includes(selectedYVariable)
  )

  // Calculate correlation coefficient for current selection
  const calculateCorrelation = (data: CorrelationData[]) => {
    if (data.length < 2) return 0
    
    const xValues = data.map(d => d.x_value)
    const yValues = data.map(d => d.y_value)
    
    const n = data.length
    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = yValues.reduce((sum, y) => sum + y, 0)
    const sumXY = data.reduce((sum, d) => sum + (d.x_value * d.y_value), 0)
    const sumX2 = xValues.reduce((sum, x) => sum + (x * x), 0)
    const sumY2 = yValues.reduce((sum, y) => sum + (y * y), 0)
    
    const numerator = (n * sumXY) - (sumX * sumY)
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  const currentCorrelation = calculateCorrelation(filteredData)

  // Get color for correlation strength
  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation)
    if (abs > 0.7) return '#ef4444' // Strong - red
    if (abs > 0.5) return '#f59e0b' // Moderate - yellow  
    if (abs > 0.3) return '#3b82f6' // Weak - blue
    return '#6b7280' // None - gray
  }

  // Statistics
  const stats = {
    totalPoints: scatterData.length,
    strongCorrelations: correlationMatrix.filter(c => Math.abs(c.correlation) > 0.7).length,
    positiveCorrelations: correlationMatrix.filter(c => c.correlation > 0.3).length,
    negativeCorrelations: correlationMatrix.filter(c => c.correlation < -0.3).length,
    avgCorrelation: correlationMatrix.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlationMatrix.length
  }

  const title = "Correlation Analysis Dashboard"
  const description = "Explore relationships between different educational metrics and identify patterns in student performance data."

  const renderChart = () => {
    switch (viewType) {
      case 'matrix':
        return (
          <BarChart 
            data={correlationMatrix} 
            layout="horizontal" 
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis type="number" domain={[-1, 1]} className="text-slate-600 dark:text-slate-400" />
            <YAxis 
              type="category" 
              dataKey="variable1" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
              width={80}
            />
            <Tooltip content={<CorrelationTooltip />} />
            <Bar dataKey="correlation" name="Correlation">
              {correlationMatrix.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCorrelationColor(entry.correlation)} />
              ))}
            </Bar>
          </BarChart>
        )
      
      case 'trends':
        return (
          <LineChart data={scatterData.slice(0, 20)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="label" 
              className="text-slate-600 dark:text-slate-400" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis className="text-slate-600 dark:text-slate-400" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="x_value" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              name={selectedXVariable}
            />
            <Line 
              type="monotone" 
              dataKey="y_value" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={{ r: 4 }}
              name={selectedYVariable}
            />
          </LineChart>
        )

      default:
        return (
          <ScatterChart data={filteredData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              type="number" 
              dataKey="x_value" 
              name={selectedXVariable}
              className="text-slate-600 dark:text-slate-400" 
            />
            <YAxis 
              type="number" 
              dataKey="y_value" 
              name={selectedYVariable}
              className="text-slate-600 dark:text-slate-400" 
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Data Points" data={filteredData} fill="#8884d8">
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCorrelationColor(currentCorrelation)} />
              ))}
            </Scatter>
          </ScatterChart>
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
              onClick={() => setViewType('scatter')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'scatter' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Scatter Plot
            </button>
            <button
              onClick={() => setViewType('matrix')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'matrix' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Matrix
            </button>
            <button
              onClick={() => setViewType('trends')}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded transition-colors",
                viewType === 'trends' 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Trends
            </button>
          </div>

          {/* Variable Selectors */}
          {viewType === 'scatter' && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedXVariable}
                onChange={(e) => setSelectedXVariable(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
              >
                <option value="attention">Attention</option>
                <option value="attendance">Attendance</option>
                <option value="grades">Grades</option>
                <option value="time">Time Spent</option>
              </select>
              <span className="text-xs text-slate-600 dark:text-slate-400">vs</span>
              <select
                value={selectedYVariable}
                onChange={(e) => setSelectedYVariable(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800"
              >
                <option value="grades">Grades</option>
                <option value="attention">Attention</option>
                <option value="attendance">Attendance</option>
                <option value="time">Time Spent</option>
              </select>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Data Points</span>
            </div>
            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {stats.totalPoints}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-800 dark:text-red-200">Strong</span>
            </div>
            <div className="text-lg font-bold text-red-900 dark:text-red-100">
              {stats.strongCorrelations}
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800 dark:text-green-200">Positive</span>
            </div>
            <div className="text-lg font-bold text-green-900 dark:text-green-100">
              {stats.positiveCorrelations}
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-800 dark:text-orange-200">Negative</span>
            </div>
            <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
              {stats.negativeCorrelations}
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg p-3">
            <div className="text-xs font-medium text-purple-800 dark:text-purple-200">Avg Strength</div>
            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {stats.avgCorrelation.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Current Correlation */}
        {viewType === 'scatter' && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {selectedXVariable} vs {selectedYVariable}
              </span>
              <span className={cn(
                "text-lg font-bold",
                Math.abs(currentCorrelation) > 0.7 ? "text-red-600 dark:text-red-400" :
                Math.abs(currentCorrelation) > 0.5 ? "text-yellow-600 dark:text-yellow-400" :
                Math.abs(currentCorrelation) > 0.3 ? "text-blue-600 dark:text-blue-400" :
                "text-slate-600 dark:text-slate-400"
              )}>
                r = {currentCorrelation.toFixed(3)}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {Math.abs(currentCorrelation) > 0.7 ? "Strong correlation detected" :
               Math.abs(currentCorrelation) > 0.5 ? "Moderate correlation found" :
               Math.abs(currentCorrelation) > 0.3 ? "Weak correlation present" :
               "No significant correlation"}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-80 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Correlation Insights */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Key Correlations</h4>
          <div className="space-y-2">
            {correlationMatrix
              .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
              .slice(0, 3)
              .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-slate-700 rounded border">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getCorrelationColor(item.correlation) }}
                    />
                    <span className="text-sm text-slate-900 dark:text-white">
                      {item.variable1} × {item.variable2}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {item.correlation.toFixed(3)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
