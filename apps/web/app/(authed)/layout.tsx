"use client"

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Eye, 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  GraduationCap, 
  Users, 
  Settings,
  Bell,
  User,
  Moon,
  Sun,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Get user info from localStorage
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    
    setUser(JSON.parse(auth));
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, [router]);

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

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('x-user-id');
    localStorage.removeItem('x-user-role');
    router.push('/login');
  };

  if (!isClient || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'AI Assistant', href: '/assistant', icon: MessageSquare },
      { name: 'Reports', href: '/reports', icon: FileText },
      { name: 'Grades', href: '/grades', icon: GraduationCap },
    ];

    // Add role-specific items
    if (user.role === 'admin') {
      baseItems.push(
        { name: 'Manage Instructors', href: '/admin-instructors', icon: Users },
        { name: 'Admin Panel', href: '/admin-panel', icon: Settings }
      );
    }

    baseItems.push(
      { name: 'My Bootcamps', href: '/my-bootcamps', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings }
    );

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl ${
          isDark 
            ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
            : 'bg-gradient-to-r from-blue-300 to-purple-400'
        }`} />
        <div className={`absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl ${
          isDark 
            ? 'bg-gradient-to-r from-purple-400 to-pink-500' 
            : 'bg-gradient-to-r from-purple-300 to-pink-400'
        }`} />
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className={`h-full backdrop-blur-xl border-r ${
          isDark 
            ? 'bg-black/20 border-white/10' 
            : 'bg-white/20 border-white/30'
        }`}>
          {/* Logo */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              } flex items-center justify-center`}>
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-800'
              }`}>
                ClassSight
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? isDark 
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30' 
                        : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-gray-900 border border-blue-500/30'
                      : isDark
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-gray-600 hover:bg-white/20 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'text-gray-300 hover:bg-red-500/20 hover:text-red-300'
                  : 'text-gray-600 hover:bg-red-500/20 hover:text-red-600'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className={`backdrop-blur-xl border-b ${
          isDark 
            ? 'bg-black/20 border-white/10' 
            : 'bg-white/20 border-white/30'
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              <Menu className="w-6 h-6 text-gray-500" />
            </button>

            {/* Right side */}
            <div className="flex items-center space-x-4 ml-auto">
              {/* User Profile */}
              <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl ${
                isDark 
                  ? 'bg-white/10 border border-white/20' 
                  : 'bg-white/20 border border-white/30'
              }`}>
                <div className={`w-8 h-8 rounded-lg ${
                  isDark 
                    ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                } flex items-center justify-center`}>
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${
                    isDark ? 'text-white' : 'text-gray-800'
                  }`}>
                    {user.email}
                  </p>
                  <p className={`text-xs capitalize ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <button className={`p-3 rounded-xl backdrop-blur-md transition-all duration-200 hover:scale-105 ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-black/10 hover:bg-black/20 text-gray-800'
              }`}>
                <Bell className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
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
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 p-6">
          {children}
        </main>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}