"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  IconDashboard, 
  IconRobot, 
  IconFileText, 
  IconSchool, 
  IconUsers, 
  IconSettings,
  IconCamera,
  IconLogout,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react'
import { cn } from '@/lib/cn'
import { useState } from 'react'

interface SidebarProps {
  userRole: 'admin' | 'instructor'
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: IconDashboard, roles: ['admin', 'instructor'] },
    { name: 'AI Assistant', href: '/assistant', icon: IconRobot, roles: ['admin', 'instructor'] },
    { name: 'Reports', href: '/reports', icon: IconFileText, roles: ['admin', 'instructor'] },
    { name: 'Grades', href: '/grades', icon: IconSchool, roles: ['admin', 'instructor'] },
    { name: 'Assessments', href: '/assessments', icon: IconFileText, roles: ['instructor'] },
    { name: 'My Bootcamps', href: '/my-bootcamps', icon: IconUsers, roles: ['instructor'] },
    { name: 'Bootcamps', href: '/bootcamps', icon: IconUsers, roles: ['admin'] },
    { name: 'Admin Panel', href: '/admin-panel', icon: IconSettings, roles: ['admin'] },
    { name: 'Admin Instructors', href: '/admin-instructors', icon: IconUsers, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: IconSettings, roles: ['admin', 'instructor'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className={cn(
      "relative flex flex-col h-full glass border-r border-white/20 dark:border-slate-700/50 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-slate-700/50">
        <Link href="/" className={cn("flex items-center space-x-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <IconCamera className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ClassSight
            </span>
          )}
        </Link>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors"
        >
          {collapsed ? (
            <IconChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          ) : (
            <IconChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-white/10 dark:hover:bg-slate-700/50",
                isActive 
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30" 
                  : "text-slate-700 dark:text-slate-300",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn("w-5 h-5", !collapsed && "mr-3")} />
              {!collapsed && (
                <span>{item.name}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Role Badge */}
      {!collapsed && (
        <div className="p-4 border-t border-white/20 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-white uppercase">
                  {userRole === 'admin' ? 'A' : 'I'}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                  {userRole}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Active
                </div>
              </div>
            </div>
            
            <button className="p-1 rounded-lg hover:bg-white/10 dark:hover:bg-slate-700/50 transition-colors">
              <IconLogout className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
