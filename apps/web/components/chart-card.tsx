"use client"

import { useState } from 'react'
import { IconInfoCircle, IconMaximize, IconDownload, IconX, IconMinimize } from '@tabler/icons-react'
import { cn } from '@/lib/cn'
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
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="glass rounded-xl p-6 w-full h-full max-w-7xl max-h-full flex flex-col">
          {/* Expanded Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              {description && (
                <button 
                  onClick={() => setShowDescription(!showDescription)}
                  className="p-1 rounded hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <IconInfoCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
              >
                <IconX className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "glass rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
      className
    )}>
      {/* Normal Header */}
      <div className="flex items-center justify-between mb-6">
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
              className="p-1 rounded hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
            >
              <IconInfoCircle className={cn(
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
              <IconDownload className="w-4 h-4 text-slate-400" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="p-1 rounded hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
            >
              <IconMaximize className="w-4 h-4 text-slate-400" />
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
        className="h-64"
        onClick={() => setIsExpanded(true)}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
