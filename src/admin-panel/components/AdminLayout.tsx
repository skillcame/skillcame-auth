import React, { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminNavbar from './AdminNavbar'
import { Menu, X } from 'lucide-react'

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black text-gray-950 dark:text-white transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="lg:ml-64 xl:ml-72 pt-16 lg:pt-20">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-indigo-600/30 rounded-xl text-gray-800 dark:text-white hover:bg-slate-50 dark:hover:bg-indigo-600/20 transition-all touch-manipulation shadow-sm"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
        </button>

        <AdminNavbar />
        <main className="p-3 md:p-4 lg:p-6 xl:p-8 min-h-screen overflow-x-hidden">
          <div className="max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
