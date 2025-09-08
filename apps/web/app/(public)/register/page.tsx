'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, User, Mail, Lock, Check, Moon, Sun, UserPlus, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    // Check for saved theme preference
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!formData.termsAccepted) {
      setError('Please accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: 'instructor' // Only instructors can register, admins are created by other admins
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
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
              ? 'bg-gradient-to-r from-green-400 to-blue-500' 
              : 'bg-gradient-to-r from-green-300 to-blue-400'
          }`} />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className={`w-full max-w-md backdrop-blur-xl rounded-2xl border p-8 shadow-2xl ${
            isDark 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/20 border-white/30'
          }`}>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center backdrop-blur-xl shadow-lg">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className={`text-2xl font-bold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Registration Successful!
              </h1>
              <p className={`mb-4 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Your account has been created and is pending admin approval.
              </p>
              <p className={`text-sm mb-6 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                You will receive an email notification once your account is approved.
              </p>
              <button 
                onClick={() => router.push('/login')} 
                className="group w-full flex justify-center items-center space-x-2 py-3 px-4 text-white font-semibold rounded-xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <span>Return to Login</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
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

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className={`w-16 h-16 rounded-2xl ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              } flex items-center justify-center backdrop-blur-xl shadow-lg`}>
                <Eye className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create Account
            </h1>
            <p className={`text-lg ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Register as an instructor to join ClassSight
            </p>
          </div>

          {/* Form */}
          <div className={`backdrop-blur-xl rounded-2xl border p-8 shadow-2xl ${
            isDark 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/20 border-white/30'
          }`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className={`w-4 h-4 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:bg-white/10' 
                          : 'bg-white/30 border-white/20 text-gray-900 placeholder-gray-500 focus:bg-white/40'
                      }`}
                      placeholder="First name"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className={`w-4 h-4 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                    </div>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:bg-white/10' 
                          : 'bg-white/30 border-white/20 text-gray-900 placeholder-gray-500 focus:bg-white/40'
                      }`}
                      placeholder="Last name"
                    />
                  </div>
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:bg-white/10' 
                        : 'bg-white/30 border-white/20 text-gray-900 placeholder-gray-500 focus:bg-white/40'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

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
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:bg-white/10' 
                        : 'bg-white/30 border-white/20 text-gray-900 placeholder-gray-500 focus:bg-white/40'
                    }`}
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`w-5 h-5 ${
                      isDark ? 'text-gray-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl backdrop-blur-md border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-400 focus:bg-white/10' 
                        : 'bg-white/30 border-white/20 text-gray-900 placeholder-gray-500 focus:bg-white/40'
                    }`}
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="terms" className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  I agree to the Terms and Conditions
                </label>
              </div>

              {error && (
                <div className={`p-4 rounded-xl border ${
                  isDark 
                    ? 'bg-red-500/10 border-red-500/20 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center items-center space-x-2 py-3 px-4 text-white font-semibold rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5" />
                <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="text-center">
                <span className={`text-sm ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="font-medium text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Sign in here
                  </button>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
