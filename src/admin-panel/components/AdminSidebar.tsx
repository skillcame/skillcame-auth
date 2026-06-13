import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  Bell,
  CreditCard,
  BarChart3,
  Settings,
  X,
  Store,
  Database,
  TrendingUp,
  Tag,
  Shield,
  Award,
  Newspaper,
  Layout,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Bug
} from 'lucide-react'

const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation()
  const [openMenus, setOpenMenus] = useState({ opportunities: false })

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }))
  }

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin'
    return location.pathname.startsWith(path)
  }

  // Flat menu items (no submenu)
  const flatMenuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/dashboard-cards', icon: Layout, label: 'Dashboard Cards' },
    { path: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { path: '/admin/lessons', icon: FileText, label: 'Lessons' },
    { path: '/admin/course-analytics', icon: BarChart3, label: 'Course Analytics' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/insights', icon: Newspaper, label: 'Insights Manager' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/admin/reports', icon: Bug, label: 'Bugs & Reports' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' }
  ]

  // Build navigation items
  const renderNavItems = () => {
    return flatMenuItems.map(item => (
      <MenuItem key={item.path} item={item} mobile={false} isActive={isActive} onClose={onClose} />
    ))
  }

  // Reusable Menu Item component
  const MenuItem = ({ item, mobile = false, isActive, onClose }) => {
    const Icon = item.icon
    const active = isActive(item.path)

    return (
      <Link
        to={item.path}
        onClick={mobile ? onClose : undefined}
        className={`group flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-medium ${
          active
            ? 'bg-gradient-to-r from-indigo-500/15 dark:from-indigo-600/30 to-indigo-500/5 dark:to-violet-600/10 border border-indigo-500/30 text-indigo-600 dark:text-lime-400 shadow-lg shadow-indigo-600/5 dark:shadow-indigo-600/10'
            : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-indigo-600/10'
        }`}
      >
        <Icon
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
            active ? 'scale-110' : 'group-hover:scale-105'
          }`}
        />
        <span className="font-medium truncate">{item.label}</span>
      </Link>
    )
  }

  // Logo component (unchanged)
  const SidebarLogo = () => (
    <Link
      to="/admin"
      onClick={onClose}
      className="flex items-center space-x-3 group"
    >
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-2xl group-hover:bg-indigo-500/30 transition-all"></div>
        <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-indigo-500/30 dark:border-indigo-500/30 shadow-lg shadow-indigo-600/10 dark:shadow-indigo-600/30 bg-white dark:bg-black">
          <img
            src="/skillcame.webp"
            alt="SkillCame Logo"
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = '/skillcame-app-faveicon.webp'
            }}
          />
        </div>
      </div>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-lime-400 transition-colors duration-200">
          SkillCame<span className="text-indigo-600 dark:text-lime-400">.</span>
        </span>
        <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          Admin Panel
        </span>
      </div>
    </Link>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-indigo-600/20 z-40 overflow-y-auto custom-scrollbar flex-col transition-colors duration-300">
        <div className="p-6">
          <div className="mb-8">
            <SidebarLogo />
          </div>
          <nav className="space-y-2">
            {renderNavItems()}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-80 max-w-[90vw] bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-indigo-600/20 z-50 overflow-y-auto custom-scrollbar transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-8">
            <SidebarLogo />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-indigo-600/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-2">
            {renderNavItemsMobile()}
          </nav>
        </div>
      </aside>
    </>
  )

  // Mobile version: same as desktop but with onClose and mobile parameter for MenuItem
  function renderNavItemsMobile() {
    return flatMenuItems.map(item => (
      <MenuItem key={item.path} item={item} mobile={true} isActive={isActive} onClose={onClose} />
    ))
  }
}

export default AdminSidebar
