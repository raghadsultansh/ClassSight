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
import { Logo } from '@/components/ui/logo'

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
        <Link href="/" className={cn("flex items-center", collapsed && "justify-center")}>
          {collapsed ? (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-1.5 flex items-center justify-center">
              <svg viewBox="0 0 500 500" className="w-full h-full text-white">
                <g fill="currentColor">
                  <path d="m 315.2,288.2 c -8.5,-2.7 -15.3,-10.8 -16.8,-20 -1.4,-9.1 6.3,-21.3 15.2,-24 11.2,-3.3 21,0.3 27.5,10.2 2.9,4.4 3.3,5.9 3.3,11.6 0.1,16.1 -14.1,26.9 -29.2,22.2 z" />
                  <path d="M 221.80999,355.93112 C 170.15093,348.03118 121.80101,309.47191 99.924038,259.06274 80.436998,213.7321 83.010767,153.91823 106.17461,111.78519 c 13.23648,-23.887927 37.13568,-49.844892 57.17425,-61.882899 27.39216,-16.740359 53.68129,-23.887923 86.03713,-23.699825 46.14385,0.376182 81.80882,15.235596 113.98082,47.775852 13.97185,14.107042 27.02449,33.292622 34.74577,51.349632 5.88289,13.54276 12.13345,36.67831 10.47889,38.37117 -1.28689,1.50475 -15.44257,-1.69286 -32.72353,-7.33567 -14.89104,-4.70235 -23.53153,-11.84991 -37.68721,-31.0355 -16.91328,-23.13555 -36.95185,-36.866407 -64.52785,-44.013977 -21.50928,-5.642815 -39.52561,-4.326157 -62.87329,4.138071 -15.07489,5.642815 -25.36993,12.414203 -38.23873,25.016486 -19.67089,19.18559 -29.59825,39.68782 -33.82657,69.78285 -3.6768,26.89744 4.596,55.8639 23.71536,81.82087 10.11121,13.91894 22.42849,23.69983 40.8125,32.72834 17.83247,8.65232 30.14976,11.09754 51.47521,10.15707 15.07488,-0.75237 20.40624,-1.88094 36.03264,-8.27613 15.44256,-6.2071 20.40625,-7.33566 31.2528,-7.14757 14.52337,0 46.87922,9.0285 46.87922,13.16658 0,1.12856 -5.69904,7.71185 -12.68497,14.29514 -33.45888,31.59978 -84.93409,46.64729 -134.38706,38.93544 z" />
                  <path d="m 229.1636,266.5865 c -27.75985,-7.71185 -47.24689,-29.34266 -54.41666,-60.37816 -11.39808,-49.84489 37.31953,-101.00644 86.22097,-90.84936 31.06898,6.58328 51.47521,25.20459 60.48338,55.11151 16.72944,56.61628 -36.03265,111.53971 -92.28769,96.11601 z" />
                </g>
              </svg>
            </div>
          ) : (
            <Logo size="sm" />
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
