import React, { useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NotificationCenter from './NotificationCenter'
import Avatar from '../../components/Avatar'
import { 
  Home, 
  BookOpen, 
  MessageSquare, 
  GraduationCap, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Users,
  Sparkles,
  CheckCircle,
  Crown,
  Award,
  Store,
  FileText,
  CreditCard,
  Newspaper,
  Briefcase,
  Bookmark,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Bug,
  LifeBuoy
} from 'lucide-react'

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(75, 85, 99, 0.2);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4f46e5;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6366f1;
  }
`

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isLinkActive = useCallback((path) => {
    const currentPath = location.pathname
    if (path === '/admin') return currentPath.startsWith('/admin')
    if (path === '/user/dashboard') return currentPath === '/user/dashboard'
    if (path.startsWith('/user/')) return currentPath === path || currentPath.startsWith(path + '/')
    return currentPath === path
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
      setShowLogoutModal(false)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Base flat navigation items matching standard user layout
  const renderNavItems = () => {
    if (isAdmin) {
      return (
        <Link
          to="/admin"
          onClick={() => setSidebarOpen(false)}
          className={`
            flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 
            text-sm font-medium group relative overflow-hidden
            ${isLinkActive('/admin')
              ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/30'
              : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-600/5 dark:hover:bg-indigo-600/10 hover:text-indigo-600 dark:hover:text-lime-400'
            }
          `}
        >
          <Shield className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
          <span>Go to Admin Panel</span>
        </Link>
      );
    }

    const navigationModel = [
      { path: '/user/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/user/courses', icon: BookOpen, label: 'Learn Hub' },
      { path: '/user/insights', icon: Newspaper, label: 'Insights' },
      { path: '/user/notifications', icon: Bell, label: 'Alerts' },
      { path: '/user/payments', icon: CreditCard, label: 'Invoices' },
      { path: '/user/reports', icon: Bug, label: 'Bugs & Reports' },
      { path: '/user/settings', icon: Settings, label: 'Settings' }
    ];

    return navigationModel.map((item, idx) => {
      const active = isLinkActive(item.path);
      const IconComponent = item.icon;
      return (
        <Link
          key={idx}
          to={item.path}
          onClick={() => setSidebarOpen(false)}
          className={`
            flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 
            text-sm font-semibold group relative overflow-hidden
            ${active
              ? 'bg-lime-400 text-black shadow-lg shadow-lime-400/25'
              : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-600/5 dark:hover:bg-indigo-600/10 hover:text-indigo-600 dark:hover:text-lime-400'
            }
          `}
        >
          <IconComponent className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
          <span className="truncate">{item.label}</span>
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-lime-400 dark:bg-black rounded-r-md"></span>
          )}
        </Link>
      );
    });
  }

  const safeUser = {
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@skillcame.com',
    role: user?.role || 'member',
    verified: user?.verified || false,
    avatar: user?.avatar || null
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="flex h-screen bg-[#fafafa] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 
            w-72 sm:w-80 md:w-72 lg:w-80 
            bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 
            transition-colors duration-300 ease-in-out 
            flex flex-col shadow-2xl lg:shadow-none
          `}
          aria-label="Main Sidebar"
        >
          {/* Brand/Logo Area */}
          <div className="p-5 md:p-6">
            <Link to={isAdmin ? '/admin' : '/user/dashboard'} className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-lime-400/10 border border-indigo-500/20 overflow-hidden flex-shrink-0 bg-neutral-900 transition-transform duration-200 group-hover:scale-105">
                <img 
                  src="/skillcame.webp" 
                  alt="SkillCame Logo" 
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-neutral-950">
                  <Sparkles className="w-5 h-5 text-lime-400" />
                </div>
              </div>
              <h1 className="text-2.5xl font-extrabold tracking-tight text-gray-900 dark:text-white transition-colors duration-200 group-hover:text-lime-500 dark:group-hover:text-lime-400 font-sans">
                SkillCame<span className="text-lime-500 dark:text-lime-400">.</span>
              </h1>
            </Link>
          </div>

          {/* Advanced User Profile Card - BLUE TICK REMOVED FROM AVATAR AND NAME */}
          <div className="p-4">
            <div className="bg-gradient-to-br from-indigo-500/10 to-lime-500/10 dark:from-indigo-600/10 dark:to-lime-500/5 rounded-xl p-4 border border-gray-200/50 dark:border-gray-800/20 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-3">
                  {/* Avatar with showVerified={false} - no blue tick on avatar */}
                  <Avatar 
                    user={safeUser} 
                    size="lg" 
                    showStatus={true} 
                    showVerified={false}
                    className="w-12 h-12 md:w-14 md:h-14 group-hover:scale-105 transition-transform"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <p className="text-gray-900 dark:text-white font-bold truncate text-sm md:text-base">
                        {safeUser.name}
                      </p>
                      {/* BLUE TICK REMOVED - no more <img src="/bluetick.svg"> */}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                      {safeUser.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    {safeUser.role === 'admin' ? (
                      <span className="px-2.5 py-1 bg-gradient-to-r from-red-600/20 to-red-500/10 text-red-500 dark:text-red-400 text-xs font-semibold rounded-lg flex items-center space-x-1">
                        <Crown className="w-3 h-3" />
                        <span>Admin</span>
                      </span>
                    ) : safeUser.verified ? (
                      <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg">
                        Member
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="relative">
                      <div className="w-2 h-2 bg-lime-500 dark:bg-lime-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-2 h-2 bg-lime-500 dark:bg-lime-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar" aria-label="Main Navigation">
            {renderNavItems()}
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all group"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {/* Top Bar */}
          <header className="bg-[#0e0e0e]/95 backdrop-blur-sm border-b border-gray-800/50 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-lime-400 hover:text-lime-300 transition-all p-2 -ml-2 rounded-lg hover:bg-indigo-600/10"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex-1"></div>
            
            <div className="flex items-center space-x-3">
              <NotificationCenter />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-black custom-scrollbar">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowLogoutModal(false)
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Logout Confirmation"
          >
            <div className="bg-[#1a1a1a] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 animate-in fade-in zoom-in">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Confirm Logout</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to logout? You'll need to login again to access your account.
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all font-semibold text-gray-200"
                    autoFocus
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default DashboardLayout
