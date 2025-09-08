"use client"

import { useState, useEffect } from 'react'
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import {
  Filter,
  Clock,
  RefreshCw,
  BarChart3,
  Eye,
  UserCheck,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { MultiSelect } from "@/components/ui/multi-select"
import { cn } from "@/lib/utils"

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const [allBootcamps, setAllBootcamps] = useState([
    { label: 'All Bootcamps', value: 'all' }
  ])
  
  const [allInstructors, setAllInstructors] = useState([
    { label: 'All Instructors', value: 'all' }
  ])

  // Fetch real bootcamps and instructors data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Import the API here to avoid circular dependencies
        const { dashboardAPI } = await import('@/lib/fastapi')
        
        // Fetch bootcamps
        console.log('🔍 Fetching bootcamps with includeCompleted:', filters.includeCompleted)
        const bootcampsResponse = await dashboardAPI.getBootcamps(filters.includeCompleted).catch((error) => {
          console.error('❌ Bootcamps fetch error:', error)
          return []
        })
        console.log('📦 Raw bootcamps response:', bootcampsResponse)
        console.log('📦 Response type:', typeof bootcampsResponse)
        console.log('📦 Response keys:', bootcampsResponse ? Object.keys(bootcampsResponse) : 'no keys')
        
        // Handle different response structures
        let bootcampsList = []
        if (bootcampsResponse && typeof bootcampsResponse === 'object' && 'bootcamps' in bootcampsResponse) {
          // Response with bootcamps property
          bootcampsList = (bootcampsResponse as any).bootcamps
          console.log('📋 Found bootcamps property:', bootcampsList.length, 'items')
        } else if (bootcampsResponse && typeof bootcampsResponse === 'object' && 'items' in bootcampsResponse) {
          // Paginated response
          bootcampsList = (bootcampsResponse as any).items
          console.log('📋 Found paginated bootcamps:', bootcampsList.length, 'items')
        } else if (Array.isArray(bootcampsResponse)) {
          // Direct array response
          bootcampsList = bootcampsResponse
          console.log('📋 Found direct array bootcamps:', bootcampsList.length, 'items')
        } else {
          console.log('❌ Unexpected bootcamps response format')
          bootcampsList = []
        }
        
        if (bootcampsList.length > 0) {
          console.log('🏗️ Sample bootcamp:', bootcampsList[0])
          const bootcampOptions = [
            { label: 'All Bootcamps', value: 'all' },
            ...bootcampsList.map((bootcamp: any) => ({
              label: bootcamp.bootcamp_name || bootcamp.name || bootcamp.title || 'Unnamed Bootcamp',
              value: bootcamp.bootcamp_id?.toString() || bootcamp.id?.toString() || 'no-id'
            }))
          ]
          console.log('✅ Bootcamp options set:', bootcampOptions)
          setAllBootcamps(bootcampOptions)
        } else {
          console.log('⚠️ No bootcamps found, keeping default')
        }

        // Fetch instructors (admin only)
        if (userRole === 'admin') {
          console.log('👨‍🏫 Fetching instructors...')
          const instructorsResponse = await dashboardAPI.getInstructors().catch((error) => {
            console.error('❌ Instructors fetch error:', error)
            return []
          })
          console.log('👨‍🏫 Raw instructors response:', instructorsResponse)
          console.log('👨‍🏫 Response type:', typeof instructorsResponse)
          
          // Handle different response structures
          let instructorsList = []
          if (instructorsResponse && typeof instructorsResponse === 'object' && 'instructors' in instructorsResponse) {
            // Response with instructors property
            instructorsList = (instructorsResponse as any).instructors
            console.log('📋 Found instructors property:', instructorsList.length, 'items')
          } else if (instructorsResponse && typeof instructorsResponse === 'object' && 'items' in instructorsResponse) {
            // Paginated response
            instructorsList = (instructorsResponse as any).items
            console.log('📋 Found paginated instructors:', instructorsList.length, 'items')
          } else if (Array.isArray(instructorsResponse)) {
            // Direct array response
            instructorsList = instructorsResponse
            console.log('📋 Found direct array instructors:', instructorsList.length, 'items')
          } else {
            console.log('❌ Unexpected instructors response format')
            instructorsList = []
          }
          
          if (instructorsList.length > 0) {
            console.log('👨‍🏫 Sample instructor:', instructorsList[0])
            const instructorOptions = [
              { label: 'All Instructors', value: 'all' },
              ...instructorsList.map((instructor: any) => ({
                label: instructor.full_name || instructor.name || 'Unnamed Instructor',
                value: instructor.instructor_id?.toString() || instructor.id?.toString() || 'no-id'
              }))
            ]
            console.log('✅ Instructor options set:', instructorOptions)
            setAllInstructors(instructorOptions)
          }
        }
      } catch (error) {
        console.error('Failed to fetch filter data:', error)
      }
    }

    fetchFilterData()
  }, [userRole, filters.includeCompleted])

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: format(range.from, "yyyy-MM-dd"),
          end: range?.to ? format(range.to, "yyyy-MM-dd") : format(range.from, "yyyy-MM-dd")
        }
      })
    }
  }

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const viewOptions = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'attention', label: 'Attention Analysis', icon: Eye },
    { value: 'attendance', label: 'Attendance Tracking', icon: UserCheck },
    { value: 'students', label: 'Student Analytics', icon: Users },
    { value: 'comparisons', label: 'Comparative Analysis', icon: TrendingUp },
    ...(userRole === 'admin' ? [{ value: 'instructors', label: 'Instructor Performance', icon: Users }] : []),
  ]

  const granularityOptions = [
    { value: 'half-hourly', label: '30 Minutes' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
  ]

  // Filter bootcamps based on user role
  const availableBootcamps = userRole === 'admin' ? allBootcamps : allBootcamps.slice(0, 3)
  const availableInstructors = userRole === 'admin' ? allInstructors : []

    return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg mb-6">
      {/* Clean Header - improved readability */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Dashboard Filters
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Customize your view
            </p>
          </div>
        </div>        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Live Data</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Updated {format(lastUpdated, "HH:mm")}
            </span>
          )}
          {onRefresh && (
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* View Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Dashboard View
          </label>
          <Select value={filters.view} onValueChange={(value) => updateFilter('view', value)}>
            <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:border-blue-900 dark:focus:border-blue-500 text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 backdrop-blur-xl">
              {viewOptions.map(option => {
                const IconComponent = option.icon
                return (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="hover:bg-blue-900 hover:text-white focus:bg-blue-900 focus:text-white data-[highlighted]:bg-blue-900 data-[highlighted]:text-white"
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-4 h-4" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Bootcamps Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Bootcamps
          </label>
          <MultiSelect
            options={availableBootcamps}
            selected={filters.bootcamps}
            onChange={(selected) => updateFilter('bootcamps', selected)}
            placeholder="Select bootcamps..."
            className="h-10 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:border-blue-900 dark:focus:border-blue-500"
          />
        </div>

        {/* Instructors Filter (Admin only) */}
        {userRole === 'admin' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Instructors
            </label>
            <MultiSelect
              options={availableInstructors}
              selected={filters.instructors}
              onChange={(selected) => updateFilter('instructors', selected)}
              placeholder="Select instructors..."
              className="h-10 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:border-blue-900 dark:focus:border-blue-500"
            />
          </div>
        )}

        {/* Granularity */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Time Period
          </label>
          <Select value={filters.granularity} onValueChange={(value) => updateFilter('granularity', value)}>
            <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:border-blue-900 dark:focus:border-blue-500 text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 backdrop-blur-xl">
              {granularityOptions.map(option => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="hover:bg-blue-900 hover:text-white focus:bg-blue-900 focus:text-white data-[highlighted]:bg-blue-900 data-[highlighted]:text-white"
                >
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Date Range
        </label>
        <DatePickerWithRange
          date={dateRange}
          onDateChange={handleDateRangeChange}
          className="w-fit [&>button]:bg-white/50 dark:[&>button]:bg-slate-800/50 [&>button]:border-slate-200 dark:[&>button]:border-slate-700 [&>button]:text-slate-900 dark:[&>button]:text-white [&>button]:hover:bg-blue-50 dark:[&>button]:hover:bg-blue-900/20 [&>button]:backdrop-blur-sm"
        />
      </div>

      {/* Advanced Options */}
      <div className="flex items-center justify-between pt-4 border-t border-blue-600/30">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-blue-200">
            <input
              type="checkbox"
              checked={filters.includeCompleted}
              onChange={(e) => updateFilter('includeCompleted', e.target.checked)}
              className="rounded border-blue-500 bg-blue-800/50 text-blue-400 focus:ring-blue-400 focus:ring-offset-0"
            />
            <span>Include completed bootcamps</span>
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({
              view: 'overview',
              bootcamps: [],
              granularity: 'daily',
              includeCompleted: false,
              dateRange: {
                start: format(subDays(new Date(), 30), "yyyy-MM-dd"),
                end: format(new Date(), "yyyy-MM-dd")
              },
              instructors: []
            })}
            className="text-blue-200 hover:text-white hover:bg-blue-700/50 border border-blue-600/50"
          >
            Reset
          </Button>
          
          <Button
            size="sm"
            onClick={() => onFiltersChange({
              ...filters,
              bootcamps: availableBootcamps.map(b => b.value),
              instructors: userRole === 'admin' ? availableInstructors.map(i => i.value) : [],
            })}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 border border-blue-500"
          >
            Select All
          </Button>
        </div>
      </div>
    </div>
  )
}
