import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  DollarSign,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  BookOpen,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Unlock,
  Lock,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Mail,
  Phone,
  Award,
  PlayCircle
} from 'lucide-react'
import {
  watchNewCourses,
  watchAllEnrollments,
  getCourseAnalytics,
  getEnrolledUsersDetails,
  grantCourseAccess,
  revokeCourseAccess
} from '../services/admin/CourseAnalytics'
import { toast } from '../components/Toast'

const CourseAnalytics = () => {
  const [searchParams] = useSearchParams()
  const courseIdParam = searchParams.get('courseId')
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdParam || '')
  const [analytics, setAnalytics] = useState(null)
  const [enrolledUsers, setEnrolledUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [dateRange, setDateRange] = useState('30')
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchUserTerm, setSearchUserTerm] = useState('')
  const [filterAccess, setFilterAccess] = useState('all')
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    users: true,
    lessons: false
  })

  // Load courses real-time
  useEffect(() => {
    const unsubscribeCourses = watchNewCourses((coursesData) => {
      setCourses(coursesData || [])
      if (courseIdParam && !selectedCourseId) {
        setSelectedCourseId(courseIdParam)
      }
    })
    return () => unsubscribeCourses()
  }, [courseIdParam, selectedCourseId])

  // Load analytics when course changes
  useEffect(() => {
    if (selectedCourseId) {
      loadAnalytics()
      loadEnrolledUsers()
    }
  }, [selectedCourseId, dateRange])

  const loadAnalytics = async () => {
    if (!selectedCourseId) return
    try {
      setLoading(true)
      setError(null)
      let startDate = null
      let endDate = null
      if (dateRange !== 'all') {
        const days = parseInt(dateRange)
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - days)
        startDate = start.toISOString().split('T')[0]
        endDate = end.toISOString().split('T')[0]
      }
      const result = await getCourseAnalytics(selectedCourseId, startDate, endDate)
      if (result.success) {
        setAnalytics(result.data)
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError(error.message)
      toast.error('Failed to load analytics: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadEnrolledUsers = async () => {
    if (!selectedCourseId) return
    try {
      setUsersLoading(true)
      const result = await getEnrolledUsersDetails(selectedCourseId)
      if (result.success) {
        setEnrolledUsers(result.data)
      }
    } catch (error) {
      console.error('Error loading enrolled users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleGrantAccess = async (userId) => {
    try {
      const result = await grantCourseAccess(userId, selectedCourseId)
      if (result.success) {
        toast.success('Course access granted')
        loadEnrolledUsers()
        loadAnalytics()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleRevokeAccess = async (userId) => {
    if (!window.confirm('Are you sure you want to revoke access for this user?')) return
    try {
      const result = await revokeCourseAccess(userId, selectedCourseId)
      if (result.success) {
        toast.success('Course access revoked')
        loadEnrolledUsers()
        loadAnalytics()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const getSelectedCourse = () => {
    return courses.find(c => c.id === selectedCourseId)
  }

  const filteredUsers = useMemo(() => {
    let filtered = [...enrolledUsers]
    if (searchUserTerm) {
      const term = searchUserTerm.toLowerCase()
      filtered = filtered.filter(u =>
        u.user?.name?.toLowerCase().includes(term) ||
        u.user?.email?.toLowerCase().includes(term) ||
        u.userId?.toLowerCase().includes(term)
      )
    }
    if (filterAccess !== 'all') {
      filtered = filtered.filter(u => {
        if (filterAccess === 'approved') return u.isApproved === true
        if (filterAccess === 'pending') return u.isApproved === false && u.enrollment?.status !== 'revoked'
        if (filterAccess === 'revoked') return u.enrollment?.status === 'revoked'
        return true
      })
    }
    return filtered
  }, [enrolledUsers, searchUserTerm, filterAccess])

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const exportToCSV = () => {
    try {
      if (!analytics) return
      const rows = [
        ['Metric', 'Value'],
        ['Course Title', getSelectedCourse()?.title || 'N/A'],
        ['Total Views', analytics.totalViews],
        ['Total Lesson Views', analytics.totalLessonViews],
        ['Total Enrollments', analytics.totalEnrollments],
        ['Paid Enrollments', analytics.paidEnrollments],
        ['Free Enrollments', analytics.freeEnrollments],
        ['Completion Rate', `${analytics.completionRate}%`],
        ['Total Revenue', `${getSelectedCourse()?.currency || 'PKR'} ${analytics.totalRevenue}`],
        ['Avg Watch Time', `${Math.floor(analytics.avgWatchTime / 60)} min ${analytics.avgWatchTime % 60} sec`],
        ['Total Watch Time', `${Math.floor(analytics.totalWatchTime / 60)} min`],
        ['Lesson Completions', analytics.totalCompletions],
        ['Date Range', dateRange === 'all' ? 'All Time' : `Last ${dateRange} days`]
      ]
      const csv = rows.map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course-analytics-${selectedCourseId}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully')
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  const exportUsersToCSV = () => {
    try {
      const rows = [
        ['User Name', 'Email', 'Enrolled Date', 'Progress', 'Status', 'Payment Status', 'Completed At']
      ]
      filteredUsers.forEach(u => {
        rows.push([
          u.user?.name || 'Unknown',
          u.user?.email || '',
          u.enrolledAt ? new Date(u.enrolledAt).toLocaleDateString() : 'N/A',
          `${u.progress}%`,
          u.isApproved ? 'Approved' : (u.enrollment?.status === 'revoked' ? 'Revoked' : 'Pending'),
          u.isPaid ? 'Paid' : 'Free',
          u.completedAt ? new Date(u.completedAt).toLocaleDateString() : 'N/A'
        ])
      })
      const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course-users-${selectedCourseId}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Users CSV exported successfully')
    } catch (error) {
      toast.error('Export failed: ' + error.message)
    }
  }

  if (!selectedCourseId) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Course Analytics</h1>
              <p className="text-gray-400">Select a course to view analytics</p>
            </div>
          </div>
          <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">Choose a course...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const course = getSelectedCourse()
  const isFree = course?.price === 0 || course?.isFree === true

  return (
    <AdminLayout>
      <div className="p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-[#FFD700]" />
              <span>Course Analytics</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {course?.title} • {isFree ? 'Free Course' : `Paid Course - ${course?.currency || 'PKR'} ${course?.price}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm focus:border-[#FFD700]"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
              <option value="all">All Time</option>
            </select>
            <button
              onClick={loadAnalytics}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl flex items-center gap-2 text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Course Selector (small) */}
        <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-xl p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-400">Switch Course:</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-sm"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-600/20 border-2 border-red-600/50 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Analytics</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
            >
              Try Again
            </button>
          </div>
        ) : analytics ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border-2 border-indigo-600/20 rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Total Views</p>
                    <p className="text-3xl font-bold text-white">{analytics.totalViews}</p>
                  </div>
                  <Eye className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="mt-2 text-xs text-gray-500">Course page views</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border-2 border-lime-600/20 rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Enrollments</p>
                    <p className="text-3xl font-bold text-white">{analytics.totalEnrollments}</p>
                  </div>
                  <Users className="w-8 h-8 text-lime-400" />
                </div>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-400">Free: {analytics.freeEnrollments}</span>
                  <span className="text-yellow-400">Paid: {analytics.paidEnrollments}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border-2 border-[#FFD700]/20 rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Completion Rate</p>
                    <p className="text-3xl font-bold text-[#FFD700]">{analytics.completionRate}%</p>
                  </div>
                  <Award className="w-8 h-8 text-[#FFD700]" />
                </div>
                <div className="mt-2 text-xs text-gray-500">{analytics.totalCompletions} lessons completed</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border-2 border-green-600/20 rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">Revenue</p>
                    <p className="text-2xl font-bold text-green-400">{course?.currency || 'PKR'} {analytics.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] border border-indigo-600/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Lesson Views</p>
                    <p className="text-xl font-bold text-white">{analytics.totalLessonViews}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-indigo-600/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Avg. Watch Time</p>
                    <p className="text-xl font-bold text-white">
                      {Math.floor(analytics.avgWatchTime / 60)}m {analytics.avgWatchTime % 60}s
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-indigo-600/20 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Engagement Score</p>
                    <p className="text-xl font-bold text-white">
                      {analytics.totalEnrollments > 0 ? Math.round((analytics.totalLessonViews / analytics.totalEnrollments) * 10) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrolled Users Section */}
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleSection('users')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-lime-400" />
                  <h2 className="text-lg font-bold text-white">Enrolled Users ({enrolledUsers.length})</h2>
                </div>
                {expandedSections.users ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {expandedSections.users && (
                <div className="p-6 pt-0 border-t border-indigo-600/20">
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchUserTerm}
                        onChange={(e) => setSearchUserTerm(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-sm"
                      />
                    </div>
                    <select
                      value={filterAccess}
                      onChange={(e) => setFilterAccess(e.target.value)}
                      className="px-3 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-sm"
                    >
                      <option value="all">All Access</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="revoked">Revoked</option>
                    </select>
                    <button
                      onClick={exportUsersToCSV}
                      className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg flex items-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export Users
                    </button>
                  </div>

                  {usersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No enrolled users found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-black/50 border-b border-indigo-600/20">
                          <tr>
                            <th className="px-4 py-3 text-left text-white">User</th>
                            <th className="px-4 py-3 text-left text-white hidden md:table-cell">Email</th>
                            <th className="px-4 py-3 text-left text-white">Enrolled</th>
                            <th className="px-4 py-3 text-left text-white">Progress</th>
                            <th className="px-4 py-3 text-left text-white">Access</th>
                            <th className="px-4 py-3 text-center text-white">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-600/10">
                          {filteredUsers.map((user) => (
                            <tr key={user.userId} className="hover:bg-black/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center">
                                    <UserCheck className="w-4 h-4 text-indigo-400" />
                                  </div>
                                  <span className="font-medium text-white">{user.user?.name || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell text-gray-300">{user.user?.email || '-'}</td>
                              <td className="px-4 py-3 text-gray-300 text-xs">
                                {user.enrolledAt ? new Date(user.enrolledAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div className="bg-lime-400 h-full rounded-full" style={{ width: `${user.progress}%` }}></div>
                                  </div>
                                  <span className="text-xs text-lime-400">{user.progress}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {user.isApproved ? (
                                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-lg text-xs">Approved</span>
                                ) : user.enrollment?.status === 'revoked' ? (
                                  <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded-lg text-xs">Revoked</span>
                                ) : (
                                  <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs">Pending</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {!user.isApproved && user.enrollment?.status !== 'revoked' ? (
                                    <button
                                      onClick={() => handleGrantAccess(user.userId)}
                                      className="p-1.5 bg-lime-600/20 hover:bg-lime-600/30 rounded-lg text-lime-400"
                                      title="Grant Access"
                                    >
                                      <Unlock className="w-4 h-4" />
                                    </button>
                                  ) : user.isApproved && (
                                    <button
                                      onClick={() => handleRevokeAccess(user.userId)}
                                      className="p-1.5 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400"
                                      title="Revoke Access"
                                    >
                                      <Lock className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setShowUserDetails(true)
                                    }}
                                    className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg text-indigo-400"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Insights */}
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Insights & Recommendations</h2>
              <div className="space-y-3">
                {analytics.completionRate < 50 && (
                  <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-400">Low Completion Rate</p>
                      <p className="text-sm text-gray-300">Only {analytics.completionRate}% of enrolled users completed the course. Consider adding more engaging content or quizzes.</p>
                    </div>
                  </div>
                )}
                {analytics.totalViews > 100 && analytics.totalEnrollments === 0 && (
                  <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-400">High Views, No Enrollments</p>
                      <p className="text-sm text-gray-300">Many people view but don't enroll. Consider adjusting price or improving course description.</p>
                    </div>
                  </div>
                )}
                {analytics.paidEnrollments > 0 && (
                  <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-400">Revenue Generated</p>
                      <p className="text-sm text-gray-300">Total revenue: {course?.currency || 'PKR'} {analytics.totalRevenue.toLocaleString()} from {analytics.paidEnrollments} paid enrollments.</p>
                    </div>
                  </div>
                )}
                {analytics.avgWatchTime < 300 && analytics.totalEnrollments > 0 && (
                  <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-purple-400">Low Engagement</p>
                      <p className="text-sm text-gray-300">Average watch time is low. Review video lengths and content quality.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl">
            <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No analytics data available for this course</p>
            <button
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
            >
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowUserDetails(false)}>
          <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button onClick={() => setShowUserDetails(false)} className="text-gray-400 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              <div><p className="text-gray-400 text-sm">Name</p><p className="text-white font-medium">{selectedUser.user?.name || 'Unknown'}</p></div>
              <div><p className="text-gray-400 text-sm">Email</p><p className="text-white">{selectedUser.user?.email || 'N/A'}</p></div>
              <div><p className="text-gray-400 text-sm">User ID</p><p className="text-white text-xs font-mono">{selectedUser.userId}</p></div>
              <div><p className="text-gray-400 text-sm">Enrolled At</p><p className="text-white">{selectedUser.enrolledAt ? new Date(selectedUser.enrolledAt).toLocaleString() : 'N/A'}</p></div>
              <div><p className="text-gray-400 text-sm">Progress</p><div className="flex items-center gap-2 mt-1"><div className="flex-1 bg-gray-700 rounded-full h-2"><div className="bg-lime-400 h-2 rounded-full" style={{ width: `${selectedUser.progress}%` }}></div></div><span className="text-lime-400 text-sm">{selectedUser.progress}%</span></div></div>
              <div><p className="text-gray-400 text-sm">Access Status</p><span className={`inline-block px-3 py-1 rounded-lg text-sm ${selectedUser.isApproved ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{selectedUser.isApproved ? 'Approved' : 'Pending'}</span></div>
              <div><p className="text-gray-400 text-sm">Payment Status</p><span className={`inline-block px-3 py-1 rounded-lg text-sm ${selectedUser.isPaid ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>{selectedUser.isPaid ? 'Paid' : 'Free'}</span></div>
              {selectedUser.completedAt && (<div><p className="text-gray-400 text-sm">Completed At</p><p className="text-white">{new Date(selectedUser.completedAt).toLocaleString()}</p></div>)}
            </div>
            <div className="flex gap-3 mt-6">
              {!selectedUser.isApproved && selectedUser.enrollment?.status !== 'revoked' ? (
                <button onClick={() => { handleGrantAccess(selectedUser.userId); setShowUserDetails(false) }} className="flex-1 px-4 py-2 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl">Grant Access</button>
              ) : selectedUser.isApproved && (
                <button onClick={() => { handleRevokeAccess(selectedUser.userId); setShowUserDetails(false) }} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">Revoke Access</button>
              )}
              <button onClick={() => setShowUserDetails(false)} className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl">Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default CourseAnalytics
