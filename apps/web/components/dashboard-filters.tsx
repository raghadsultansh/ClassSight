"use client"

import { useState } from 'react'
import { IconFilter, IconChevronDown, IconRefresh, IconClock } from '@tabler/icons-react'
import { cn } from '@/lib/cn'

export interface FilterState {
  view: 'overview' | 'attention' | 'attendance' | 'students' | 'comparisons' | 'instructors'
  bootcamps: string[]
  instructors: string[]
  granularity: 'half-hourly' | 'hourly' | 'daily' | 'weekly'
  includeCompleted: boolean
  dateRange: {
    start: string
    end: string
  }
}

interface DashboardFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  userRole: 'admin' | 'instructor'
  lastUpdated?: Date
  isLoading?: boolean
  onRefresh?: () => void
}

export function DashboardFilters({ 
  filters, 
  onFiltersChange, 
  userRole, 
  lastUpdated,
  isLoading,
  onRefresh 
}: DashboardFiltersProps) {
  // Mock data - will be replaced with real API calls
  const allBootcamps = [
    { id: '1', name: 'Web Development Bootcamp', status: 'active', instructorId: 'inst-1' },
    { id: '2', name: 'Data Science Bootcamp', status: 'active', instructorId: 'inst-2' },
    { id: '3', name: 'Mobile Development', status: 'active', instructorId: 'inst-1' },
    { id: '4', name: 'AI/ML Fundamentals', status: 'completed', instructorId: 'inst-3' },
    { id: '5', name: 'DevOps Essentials', status: 'completed', instructorId: 'inst-2' },
  ]

  const allInstructors = [
    { id: 'inst-1', name: 'Dr. Ahmed Hassan', avgAttendance: 87.5, avgAttention: 74.2 },
    { id: 'inst-2', name: 'Prof. Sarah Wilson', avgAttendance: 92.1, avgAttention: 78.9 },
    { id: 'inst-3', name: 'Dr. Mohammed Ali', avgAttendance: 85.3, avgAttention: 71.8 },
  ]

  const availableBootcamps = userRole === 'admin' 
    ? allBootcamps 
    : allBootcamps.filter(b => b.instructorId === 'inst-1') // Current user's bootcamps

  const viewOptions = [
    { value: 'overview', label: 'Overview', description: 'All charts and insights', roles: ['admin', 'instructor'] },
    { value: 'attention', label: 'Attention Charts', description: 'Focus on attention metrics', roles: ['admin', 'instructor'] },
    { value: 'attendance', label: 'Attendance Charts', description: 'Focus on attendance data', roles: ['admin', 'instructor'] },
    { value: 'students', label: 'Student Charts', description: 'Student performance analytics', roles: ['admin', 'instructor'] },
    { value: 'comparisons', label: 'Comparison Charts', description: 'Comparative analysis', roles: ['admin', 'instructor'] },
    { value: 'instructors', label: 'Instructor Analytics', description: 'Best performing instructors', roles: ['admin'] },
  ].filter(option => option.roles.includes(userRole))

  const granularityOptions = [
    { value: 'half-hourly', label: 'Half-Hourly', description: '30-minute intervals' },
    { value: 'hourly', label: 'Hourly', description: '1-hour intervals' },
    { value: 'daily', label: 'Daily', description: 'Daily aggregation' },
    { value: 'weekly', label: 'Weekly', description: 'Weekly summaries' },
  ]

  const updateFilters = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="glass rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <IconFilter className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Dashboard Filters
          </h2>
        </div>

        {/* Refresh Section */}
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <IconClock className="w-4 h-4 mr-1" />
              Updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all",
              "glass border border-white/20 dark:border-slate-700/50",
              isLoading 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-white/10 dark:hover:bg-slate-700/50"
            )}
          >
            <IconRefresh className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* View Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Data View
          </label>
          <div className="relative">
            <select
              value={filters.view}
              onChange={(e) => updateFilters('view', e.target.value)}
              className="w-full px-3 py-2 glass rounded-lg border-0 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {viewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {viewOptions.find(o => o.value === filters.view)?.description}
          </p>
        </div>

        {/* Bootcamps Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Bootcamps
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableBootcamps
              .filter(bootcamp => filters.includeCompleted || bootcamp.status === 'active')
              .map((bootcamp) => (
                <label key={bootcamp.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.bootcamps?.includes(bootcamp.id) || false}
                    onChange={(e) => {
                      const currentBootcamps = filters.bootcamps || []
                      const newBootcamps = e.target.checked
                        ? [...currentBootcamps, bootcamp.id]
                        : currentBootcamps.filter(id => id !== bootcamp.id)
                      updateFilters('bootcamps', newBootcamps)
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">
                    {bootcamp.name}
                  </span>
                  {bootcamp.status === 'completed' && (
                    <span className="ml-auto text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                      Completed
                    </span>
                  )}
                </label>
              ))}
          </div>
          
          <label className="flex items-center mt-3 pt-3 border-t border-white/20 dark:border-slate-700/50">
            <input
              type="checkbox"
              checked={filters.includeCompleted}
              onChange={(e) => updateFilters('includeCompleted', e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">
              Show completed bootcamps
            </span>
          </label>
        </div>

        {/* Instructors Filter (Admin Only) */}
        {userRole === 'admin' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Instructors
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {allInstructors.map((instructor) => (
                <label key={instructor.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.instructors?.includes(instructor.id) || false}
                    onChange={(e) => {
                      const currentInstructors = filters.instructors || []
                      const newInstructors = e.target.checked
                        ? [...currentInstructors, instructor.id]
                        : currentInstructors.filter(id => id !== instructor.id)
                      updateFilters('instructors', newInstructors)
                    }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">
                    {instructor.name}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Filter by instructor performance
            </div>
          </div>
        )}

        {/* Time Granularity Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Time Granularity
          </label>
          <div className="relative">
            <select
              value={filters.granularity}
              onChange={(e) => updateFilters('granularity', e.target.value)}
              className="w-full px-3 py-2 glass rounded-lg border-0 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {granularityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {granularityOptions.find(o => o.value === filters.granularity)?.description}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col justify-end">
          <button
            onClick={() => onFiltersChange({
              view: 'overview',
              bootcamps: availableBootcamps.filter(b => b.status === 'active').map(b => b.id),
              instructors: userRole === 'admin' ? allInstructors.map(i => i.id) : [],
              granularity: 'half-hourly',
              includeCompleted: false,
              dateRange: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              }
            })}
            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  )
}
