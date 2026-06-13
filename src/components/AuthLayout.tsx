import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Menu,
  X,
  User,
  ChevronDown
} from 'lucide-react'

const AuthLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const { user, logout } = useAuth()
  const location = useLocation()

  const dropdownRef = useRef(null)

  const navItems = []

  const isActive = (path) => location.pathname === path

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [mobileMenuOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu & dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  // Helper to get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User'
    return user.name || user.displayName || user.email?.split('@')[0] || 'User'
  }

  const handleLogout = async () => {
    try {
      await logout()
      setDropdownOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-b border-indigo-600/20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* LOGO */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-indigo-500/20 shadow-lg shadow-lime-400/10 bg-neutral-900 transition-transform duration-200 group-hover:scale-105 flex items-center justify-center">
                <img
                  src="/skillcame.webp"
                  alt="SkillCame Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl md:text-2xl font-extrabold tracking-tight text-white transition-colors duration-200 group-hover:text-lime-400 font-sans">
                  SkillCame<span className="text-lime-400">.</span>
                </span>
                <span className="text-[10px] tracking-widest text-gray-500 font-mono uppercase">
                  AI LEARNING PLATFORM
                </span>
              </div>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-gray-300 hover:text-white hover:bg-indigo-600/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* AUTH SECTION - DESKTOP */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-expanded={dropdownOpen}
                    aria-label="User menu"
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-xl transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium max-w-[120px] truncate">
                      {getUserDisplayName()}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-indigo-600/30 rounded-xl shadow-xl overflow-hidden z-50">
                      <Link
                        to="/user/dashboard"
                        className="block px-4 py-3 text-sm hover:bg-indigo-600/10 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-600/10 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* MOBILE MENU TOGGLE */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-indigo-600/20 bg-black/98 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 rounded-xl transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-indigo-600/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-indigo-600/20 space-y-2">
                {user ? (
                  <>
                    <Link
                      to="/user/dashboard"
                      className="block px-4 py-3 bg-indigo-600/20 text-indigo-400 rounded-xl text-center font-medium transition-colors hover:bg-indigo-600/30"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-3 text-red-400 rounded-xl text-center font-medium transition-colors hover:bg-red-600/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-gray-300 text-center hover:text-white transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-3 bg-indigo-600 text-white rounded-xl text-center font-bold hover:bg-indigo-500 transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 pt-20">
        {children}
      </main>
    </div>
  )
}

export default AuthLayout
