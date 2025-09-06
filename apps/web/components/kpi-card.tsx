"use client"

import { IconTrendingUp, IconTrendingDown, IconInfoCircle } from '@tabler/icons-react'
import { cn } from '@/lib/cn'

interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
  }
  icon?: React.ReactNode
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function KPICard({ 
  title, 
  value, 
  change, 
  icon, 
  description, 
  trend = 'neutral',
  className 
}: KPICardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400'
      case 'down': return 'text-red-600 dark:text-red-400'
      default: return 'text-slate-600 dark:text-slate-400'
    }
  }

  const TrendIcon = trend === 'up' ? IconTrendingUp : trend === 'down' ? IconTrendingDown : null

  return (
    <div className={cn(
      "glass rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {title}
            </h3>
          </div>
        </div>
        
        {description && (
          <button 
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 dark:hover:bg-slate-700/50"
            title={description}
          >
            <IconInfoCircle className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      <div className="mb-2">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </div>

      {change && (
        <div className="flex items-center space-x-1">
          {TrendIcon && <TrendIcon className={cn("w-4 h-4", getTrendColor())} />}
          <span className={cn("text-sm font-medium", getTrendColor())}>
            {change.value > 0 ? '+' : ''}{change.value}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            vs {change.period}
          </span>
        </div>
      )}
    </div>
  )
}
