'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Mail, Lock, UserCheck, Moon, Sun, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'instructor'>('instructor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark))
  }, [])

  useEffect(() => {
    if (isClient) {
      if (isDark) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    }
  }, [isDark, isClient])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // For now, simulate login - in production this would call your auth API
      // TODO: Replace with actual authentication API call
      const mockUserId = '550e8400-e29b-41d4-a716-446655440000' // Mock UUID
      
      // Store auth info (in production, use secure storage/cookies)
      localStorage.setItem('auth', JSON.stringify({
        userId: mockUserId,
        role: role,
        email: email
      }))

      // Set headers for API calls
      localStorage.setItem('x-user-id', mockUserId)
      localStorage.setItem('x-user-role', role)

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl ${
          isDark 
            ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
            : 'bg-gradient-to-r from-blue-300 to-purple-400'
        }`} />
        <div className={`absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl ${
          isDark 
            ? 'bg-gradient-to-r from-purple-400 to-pink-500' 
            : 'bg-gradient-to-r from-purple-300 to-pink-400'
        }`} />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 ${
            isDark 
              ? 'bg-white/10 hover:bg-white/20 text-white' 
              : 'bg-black/10 hover:bg-black/20 text-gray-800'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 rounded-2xl ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              } flex items-center justify-center backdrop-blur-xl shadow-lg`}>
                <Eye className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className={`text-3xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome back
            </h2>
            <p className={`mt-2 text-lg ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Sign in to ClassSight
            </p>
          </div>

          {/* Form */}
          <div className={`backdrop-blur-xl rounded-2xl border p-8 shadow-2xl ${
            isDark 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/20 border-white/30'
          }`}>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className={`p-4 rounded-xl border ${
                  isDark 
                    ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className={`w-5 h-5 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:bg-white/10' 
                          : 'bg-white/30 border-white/20 text-gray-900 placeholder-gray-500 focus:bg-white/40'
                      }`}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                {/* Password Field */}
                <div>
                  <label htmlFor="password" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`w-5 h-5 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:bg-white/10' 
                          : 'bg-white/30 border-white/20 text-gray-900 placeholder-gray-500 focus:bg-white/40'
                      }`}
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
                
                {/* Role Selection */}
                <div>
                  <label htmlFor="role" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCheck className={`w-5 h-5 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'instructor')}
                      className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white focus:bg-white/10' 
                          : 'bg-white/30 border-white/20 text-gray-900 focus:bg-white/40'
                      }`}
                    >
                      <option value="instructor">Instructor</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center space-x-2 py-3 px-4 text-white font-semibold rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
              
              <div className="text-center">
                <span className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Register here
                  </button>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
