"use client"

import { IconBell, IconUser, IconSearch } from '@tabler/icons-react'
import { ThemeToggle } from './theme-toggle'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/cn'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: 'admin' | 'instructor'
  title?: string
}

export function DashboardLayout({ 
  children, 
  userRole = 'instructor',
  title = 'Dashboard'
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar userRole={userRole} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="glass border-b border-white/20 dark:border-slate-700/50">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Page Title & Search */}
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {title}
                </h1>
                
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 w-64 glass rounded-lg border-0 bg-white/30 dark:bg-slate-800/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg glass hover:bg-white/10 dark:hover:bg-slate-700/50 transition-all">
                  <IconBell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">3</span>
                  </span>
                </button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Profile */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      John Doe
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {userRole}
                    </div>
                  </div>
                  
                  <button className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
                    <IconUser className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
