"use client"

import { TrendingUp, TrendingDown, Eye, Users, Clock, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiData {
  value: number
  change: number
  label: string
  icon: 'attendance' | 'attention' | 'students' | 'engagement'
  format?: 'percentage' | 'number' | 'score'
}

interface KpiCardProps {
  data: KpiData
  className?: string
}

const iconMap = {
  attendance: Users,
  attention: Eye, 
  students: Clock,
  engagement: BarChart3
}

const colorMap = {
  attendance: 'from-blue-500 to-blue-600',
  attention: 'from-purple-500 to-purple-600',
  students: 'from-green-500 to-green-600',
  engagement: 'from-orange-500 to-orange-600'
}

export function KpiCard({ data, className }: KpiCardProps) {
  const Icon = iconMap[data.icon]
  const gradientColor = colorMap[data.icon]
  
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'score':
        return `${value.toFixed(1)}/100`
      default:
        return value.toLocaleString()
    }
  }

  const isPositiveChange = data.change >= 0

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105",
      gradientColor,
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/10" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
          
          <div className={cn(
            "flex items-center space-x-1 text-sm font-medium px-2 py-1 rounded-full",
            isPositiveChange 
              ? "bg-green-500/20 text-green-100" 
              : "bg-red-500/20 text-red-100"
          )}>
            {isPositiveChange ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(data.change).toFixed(1)}%</span>
          </div>
        </div>

        {/* Value */}
        <div className="mb-2">
          <div className="text-3xl font-bold">
            {formatValue(data.value, data.format)}
          </div>
        </div>

        {/* Label */}
        <div className="text-white/80 text-sm font-medium">
          {data.label}
        </div>
      </div>
    </div>
  )
}
