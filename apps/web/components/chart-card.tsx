"use client"

import { useState } from 'react'
import { Info, Maximize, Download, X, Minimize } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  actions?: boolean
  isLoading?: boolean
}

export function ChartCard({ 
  title, 
  description, 
  children, 
  className, 
  actions = true, 
  isLoading = false 
}: ChartCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDescription, setShowDescription] = useState(false)

  if (isExpanded) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6"
        onClick={() => setIsExpanded(false)}
      >
        <div 
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl shadow-2xl p-6 w-full h-full max-w-7xl max-h-full flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Expanded Header */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              {description && (
                <button 
                  onClick={() => setShowDescription(!showDescription)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>

          {/* Description Panel */}
          {showDescription && description && (
            <div className="mb-4 p-4 glass rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
              <p className="text-sm text-indigo-800 dark:text-indigo-200">{description}</p>
            </div>
          )}

          {/* Expanded Chart Content */}
          <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="w-full h-full overflow-hidden">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg transition-all duration-200 hover:shadow-xl group",
      className
    )}>
      {/* Normal Header */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          {description && (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowDescription(!showDescription)
              }}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Info className={cn(
                "w-4 h-4 transition-colors",
                showDescription 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              )} />
            </button>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Implement download
              }}
              className="p-1 rounded hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="p-1 rounded hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Maximize className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Description Panel */}
      {showDescription && description && (
        <div className="mb-4 p-3 glass rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
          <p className="text-sm text-indigo-800 dark:text-indigo-200">{description}</p>
        </div>
      )}

      {/* Chart Content */}
      <div 
        className="h-64 relative overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 p-2"
        onClick={() => setIsExpanded(true)}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="w-full h-full overflow-hidden">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
