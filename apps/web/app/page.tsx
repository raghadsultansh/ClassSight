'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Eye, Users, BarChart3, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function HomePage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  useEffect(() => {
    if (isClient) {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [isDark, isClient]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleGetStarted = () => {
    router.push('/login');
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading ClassSight...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <header className="relative z-50">
        <nav className={`backdrop-blur-xl ${
          isDark 
            ? 'bg-black/10 border-white/10' 
            : 'bg-white/10 border-white/20'
        } border-b`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Logo size="sm" />

              {/* Right side buttons */}
              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-black/10 hover:bg-black/20 text-gray-800'
                  }`}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Sign In Button */}
                <button
                  onClick={handleSignIn}
                  className={`px-4 py-2 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20 text-white' 
                      : 'bg-black/10 hover:bg-black/20 text-gray-800'
                  }`}
                >
                  Sign In
                </button>

                {/* Sign Up Button */}
                <button
                  onClick={handleSignUp}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl ${
            isDark 
              ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
              : 'bg-gradient-to-r from-blue-300 to-purple-400'
          }`} />
          <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl ${
            isDark 
              ? 'bg-gradient-to-r from-purple-400 to-pink-500' 
              : 'bg-gradient-to-r from-purple-300 to-pink-400'
          }`} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo and Title */}
            <div className="flex justify-center mb-8">
              <div className="flex items-center justify-center backdrop-blur-xl shadow-2xl">
                <Logo size="lg" showText={false} className="scale-150" />
              </div>
            </div>

            <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Class<span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Sight</span>
            </h1>

            <p className={`text-xl sm:text-2xl mb-8 leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              AI-powered classroom management system that uses computer vision to monitor student attention and engagement in real-time
            </p>

            <p className={`text-lg mb-12 max-w-2xl mx-auto ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Transform your classroom with intelligent monitoring, detailed analytics, and actionable insights to enhance learning outcomes
            </p>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className={`p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                  : 'bg-white/20 border-white/30 hover:bg-white/30'
              }`}>
                <Eye className={`w-8 h-8 mb-4 mx-auto ${
                  isDark ? 'text-blue-400' : 'text-blue-500'
                }`} />
                <h3 className={`font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  AI Vision
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Advanced computer vision to track student attention and engagement
                </p>
              </div>

              <div className={`p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                  : 'bg-white/20 border-white/30 hover:bg-white/30'
              }`}>
                <BarChart3 className={`w-8 h-8 mb-4 mx-auto ${
                  isDark ? 'text-purple-400' : 'text-purple-500'
                }`} />
                <h3 className={`font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  Real-time Analytics
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Live dashboards with comprehensive attendance and attention metrics
                </p>
              </div>

              <div className={`p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                  : 'bg-white/20 border-white/30 hover:bg-white/30'
              }`}>
                <Users className={`w-8 h-8 mb-4 mx-auto ${
                  isDark ? 'text-pink-400' : 'text-pink-500'
                }`} />
                <h3 className={`font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-800'
                }`}>
                  Class Management
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Streamlined tools for instructors and administrators
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleGetStarted}
              className="group relative px-12 py-4 text-lg font-semibold text-white rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Get Started</span>
              </span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
