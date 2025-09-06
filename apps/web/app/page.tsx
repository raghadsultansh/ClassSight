import Link from 'next/link'
import { IconCamera, IconBrain, IconUsers, IconChartBar } from '@tabler/icons-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative z-10">
        <div className="glass border-b border-white/20 dark:border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <IconCamera className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ClassSight
                </span>
              </div>

              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white mb-6">
              <span className="block">AI-Powered</span>
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Classroom Analytics
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Transform your classroom with intelligent monitoring that tracks student attention and engagement in real-time. 
              Our advanced AI camera system helps teachers understand classroom dynamics like never before.
            </p>

            {/* CTA Button */}
            <div className="mb-16">
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                <IconBrain className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Get Started Now
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
              </Link>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <IconCamera className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Real-time Monitoring
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Advanced camera system tracks student attention and engagement levels continuously
                </p>
              </div>

              <div className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <IconChartBar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Smart Analytics
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Comprehensive dashboards with insights on attendance, attention, and behavioral patterns
                </p>
              </div>

              <div className="glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <IconUsers className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Classroom Management
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Complete system for managing bootcamps, grades, and generating detailed reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-white/20 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              © 2025 ClassSight. Revolutionizing education through AI-powered insights.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
