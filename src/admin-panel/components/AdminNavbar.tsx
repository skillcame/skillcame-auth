import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { User, LogOut, Bell, Search, ArrowRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { watchUserNotifications, markNotificationAsRead } from '../../services/admin/components/AdminNavbar'
import Avatar from '../../components/Avatar'

const AdminNavbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const notificationRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Watch admin notifications - Optimized
  useEffect(() => {
    if (!user?.uid) return
    
    let mounted = true
    const unsubscribe = watchUserNotifications(user.uid, (notificationsData) => {
      if (!mounted) return
      // Sort by createdAt (newest first) and limit for performance
      const sorted = [...(notificationsData || [])].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      })
      setNotifications(sorted.slice(0, 50)) // Limit to 50 for performance
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [user?.uid])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    if (!notification.read && user?.uid) {
      await markNotificationAsRead(user.uid, notification.id)
    }
    if (notification.type === 'chat' && notification.link) {
      // Navigate to chat and select the specific user
      navigate(notification.link)
      if (notification.chatId) {
        // Store chatId to select it when chat page loads
        sessionStorage.setItem('selectedChatId', notification.chatId)
      }
      setShowNotifications(false)
    } else if (notification.link) {
      navigate(notification.link)
      setShowNotifications(false)
    } else if (notification.paymentRequestId) {
      navigate(`/admin/payments`)
      setShowNotifications(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-14 md:h-16 lg:h-20 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-200 dark:border-indigo-600/20 z-30 flex items-center justify-between px-2 sm:px-4 lg:px-8 transition-colors duration-300">
      {/* Search - Hidden on mobile */}
      <div className="hidden md:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-1.5 md:py-2 bg-slate-50 dark:bg-black/50 border-2 border-gray-200 dark:border-indigo-600/30 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-lime-400 focus:ring-4 focus:ring-lime-450/10 transition-all text-xs md:text-sm"
          />
        </div>
      </div>

      {/* Right Side - Fully Responsive */}
      <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 ml-auto">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 md:p-2 lg:p-3 bg-slate-100 dark:bg-indigo-600/20 hover:bg-slate-200 dark:hover:bg-indigo-600/30 border-2 border-gray-200 dark:border-indigo-600/30 rounded-xl transition-all"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-indigo-600 dark:text-lime-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white border-2 border-white dark:border-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-indigo-600/30 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-gray-200 dark:border-indigo-600/20">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-red-500/20 text-red-500 dark:text-red-400 px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
              <div className="p-2">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 mb-2 rounded-xl border-2 cursor-pointer transition-all ${
                        notification.read
                          ? 'bg-slate-50 dark:bg-black/30 border-gray-100 dark:border-indigo-600/10'
                          : 'bg-indigo-50/50 dark:bg-indigo-600/10 border-indigo-100 dark:border-indigo-600/30'
                      } hover:border-indigo-400 dark:hover:border-lime-400/50 ${notification.type === 'chat' ? 'border-l-4 border-indigo-500 dark:border-l-4 dark:border-lime-400' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-1 flex items-center space-x-2">
                            <span>{notification.title}</span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-indigo-600 dark:bg-lime-400 rounded-full"></span>
                            )}
                          </h4>
                          <p className="text-gray-400 text-xs line-clamp-2">{notification.message}</p>
                          <p className="text-gray-500 text-xs mt-2">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8 text-sm">No notifications</p>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-4 border-t border-indigo-600/20">
                  <Link
                    to="/admin/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-lime-400 hover:text-lime-300 font-semibold text-sm flex items-center justify-center space-x-1 transition-colors"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu - Fully Responsive */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 px-1.5 sm:px-2 lg:px-4 py-1.5 sm:py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-xl transition-all"
          >
            <Avatar 
              user={user} 
              size="sm" 
              fallbackText="Admin"
              className="sm:w-8 sm:h-8"
            />
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[100px] md:max-w-none">{user?.name || 'Admin'}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden md:block">Administrator</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-44 sm:w-48 md:w-56 bg-[#1a1a1a] border border-indigo-600/30 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-indigo-600/20">
                <p className="text-sm font-semibold text-white">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-600/10 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showDropdown || showNotifications) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowDropdown(false)
            setShowNotifications(false)
          }}
        />
      )}
    </header>
  )
}

export default AdminNavbar

