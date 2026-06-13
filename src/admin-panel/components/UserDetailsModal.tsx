import { useState, useEffect } from 'react'
import { 
  X, 
  Mail, 
  Bell, 
  CreditCard, 
  BookOpen, 
  Activity, 
  FileText,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Phone,
  Shield,
  TrendingUp,
  Award,
  Smartphone,
  Monitor,
  Trash
} from 'lucide-react'
import { 
  watchUserEnrollments, 
  watchAllPayments, 
  watchUserActivity,
  createNotificationForUser,
  createPaymentRequest,
  watchCourses,
  deleteUserActivity
} from '../../services/admin/components/UserDetailsModal'

const UserDetailsModal = ({ user, onClose, currentAdminId }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [enrollments, setEnrollments] = useState([])
  const [payments, setPayments] = useState([])
  const [activities, setActivities] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', type: 'info' })
  const [invoiceForm, setInvoiceForm] = useState({ courseId: '', amount: '', description: '' })
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Real‑time data subscriptions
  useEffect(() => {
    if (!user?.uid) return

    const unsubscribeEnrollments = watchUserEnrollments(user.uid, (enrollmentsData) => {
      setEnrollments(enrollmentsData || [])
    })

    const unsubscribePayments = watchAllPayments((paymentsData) => {
      const userPayments = paymentsData.filter(p => p.userId === user.uid)
      setPayments(userPayments)
    })

    const unsubscribeActivities = watchUserActivity(user.uid, (activitiesData) => {
      setActivities(activitiesData || [])
    })

    const unsubscribeCourses = watchCourses((coursesData) => {
      setCourses(coursesData || [])
    })

    setLoading(false)

    return () => {
      unsubscribeEnrollments()
      unsubscribePayments()
      unsubscribeActivities()
      unsubscribeCourses()
    }
  }, [user])

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      alert('Please fill all required fields')
      return
    }

    try {
      const result = await createNotificationForUser(user.uid, {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type
      })

      if (result.success) {
        alert('Notification sent successfully!')
        setShowNotificationModal(false)
        setNotificationForm({ title: '', message: '', type: 'info' })
      } else {
        alert('Failed to send notification: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleSendInvoice = async () => {
    if (!invoiceForm.courseId || !invoiceForm.amount) {
      alert('Please fill all required fields')
      return
    }

    try {
      const selectedCourse = courses.find(c => c.id === invoiceForm.courseId)
      const paymentData = {
        userId: user.uid,
        userName: user.name || user.email,
        userEmail: user.email,
        courseId: invoiceForm.courseId,
        courseName: selectedCourse?.title || 'Course',
        coursePrice: parseFloat(invoiceForm.amount),
        description: invoiceForm.description || '',
        type: 'invoice',
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      const result = await createPaymentRequest(paymentData)

      if (result.success) {
        await createNotificationForUser(user.uid, {
          title: 'Payment Invoice',
          message: `You have a new payment invoice for ${paymentData.courseName}. Amount: Rs. ${invoiceForm.amount}`,
          type: 'payment'
        })
        alert('Invoice sent successfully!')
        setShowInvoiceModal(false)
        setInvoiceForm({ courseId: '', amount: '', description: '' })
      } else {
        alert('Failed to send invoice: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  // Calculate statistics
  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || p.coursePrice || 0), 0)
  const completedCourses = enrollments.filter(e => e.progress === 100).length
  const paidCourses = enrollments.filter(e => {
    const course = courses.find(c => c.id === e.courseId)
    return course && (course.price > 0 || e.paymentRequestId)
  }).length

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'courses', label: 'Enrolled Courses', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'activity', label: 'Activity', icon: Activity }
  ]

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-3 md:p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-4 md:p-6 lg:p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar my-4">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-indigo-600/20 to-transparent -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-4 mb-4 rounded-t-2xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600/20 border-2 border-indigo-600/30 flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1">
                  {user.name || user.email}
                </h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    user.role === 'admin' 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                      : 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30'
                  }`}>
                    {user.role || 'user'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    user.status === 'active' 
                      ? 'bg-lime-600/20 text-lime-400 border border-lime-600/30'
                      : user.status === 'suspended'
                      ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                      : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNotificationModal(true)}
                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-xl text-indigo-400 transition-all flex items-center gap-2 text-sm"
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notify</span>
              </button>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="px-4 py-2 bg-lime-600/20 hover:bg-lime-600/30 border border-lime-600/30 rounded-xl text-lime-400 transition-all flex items-center gap-2 text-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Invoice</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs - Scrollable on mobile */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 custom-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-black/50 text-gray-400 hover:bg-indigo-600/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Info Card */}
                <div className="bg-black/50 border-2 border-indigo-600/20 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-400" />
                    User Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Name</span>
                      <span className="text-white font-medium">{user.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Email</span>
                      <span className="text-white">{user.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Phone</span>
                      <span className="text-white">{user.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Address</span>
                      <span className="text-white text-sm max-w-[250px] text-right truncate" title={user.address || ''}>{user.address || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Hobbies & Interests</span>
                      <span className="text-white text-sm max-w-[250px] text-right truncate" title={user.hobbies || ''}>{user.hobbies || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Academic Degree</span>
                      <span className="text-white font-medium text-sm text-right max-w-[250px] truncate" title={user.degree || ''}>{user.degree || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Skills</span>
                      <span className="text-white text-sm max-w-[250px] text-right truncate" title={user.skills || ''}>{user.skills || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">LinkedIn</span>
                      {user.linkedin ? (
                        <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline text-sm truncate max-w-[200px]" title={user.linkedin}>
                          {user.linkedin}
                        </a>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">GitHub</span>
                      {user.github ? (
                        <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-[#FFD700] hover:text-yellow-400 hover:underline text-sm truncate max-w-[200px]" title={user.github}>
                          {user.github}
                        </a>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </div>
                    <div className="flex justify-between items-start py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Biography / Bio</span>
                      <p className="text-white text-xs max-w-[250px] text-right line-clamp-3 overflow-y-auto" title={user.bio || ''}>{user.bio || 'N/A'}</p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Role</span>
                      <span className="text-white capitalize">{user.role || 'user'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-indigo-600/20">
                      <span className="text-gray-400 text-sm">Status</span>
                      <span className={`font-semibold ${
                        user.status === 'active' ? 'text-lime-400' : 
                        user.status === 'suspended' ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-sm">Joined</span>
                      <span className="text-white text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Card */}
                <div className="bg-black/50 border-2 border-indigo-600/20 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lime-400" />
                    Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <BookOpen className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{enrollments.length}</p>
                      <p className="text-xs text-gray-400">Enrolled</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <Award className="w-6 h-6 text-lime-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{completedCourses}</p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <CreditCard className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{paidCourses}</p>
                      <p className="text-xs text-gray-400">Paid Courses</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-green-400">Rs. {totalSpent.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">Total Spent</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enrolled Courses Tab */}
            {activeTab === 'courses' && (
              <div className="space-y-3">
                {enrollments.length === 0 ? (
                  <div className="text-center py-12 bg-black/50 border-2 border-indigo-600/20 rounded-xl">
                    <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No enrolled courses</p>
                  </div>
                ) : (
                  enrollments.map((enrollment, idx) => {
                    const course = courses.find(c => c.id === enrollment.courseId)
                    return (
                      <div key={idx} className="bg-black/50 border-2 border-indigo-600/20 rounded-xl p-4 hover:border-indigo-600/40 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-white font-bold mb-2">{course?.title || 'Unknown Course'}</h4>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span className="text-gray-400">
                                Progress: <span className="text-lime-400 font-semibold">{enrollment.progress || 0}%</span>
                              </span>
                              <span className="text-gray-400">
                                Status: <span className={`font-semibold ${
                                  enrollment.status === 'approved' ? 'text-lime-400' : 
                                  enrollment.status === 'pending' ? 'text-yellow-400' : 
                                  'text-red-400'
                                }`}>{enrollment.status || 'active'}</span>
                              </span>
                              <span className="text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="w-full sm:w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="bg-lime-400 h-full rounded-full transition-all" style={{ width: `${enrollment.progress || 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-3">
                {payments.length === 0 ? (
                  <div className="text-center py-12 bg-black/50 border-2 border-indigo-600/20 rounded-xl">
                    <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No payments found</p>
                  </div>
                ) : (
                  payments.map((payment, idx) => (
                    <div key={idx} className="bg-black/50 border-2 border-indigo-600/20 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-white font-bold">{payment.courseName || payment.courseTitle || 'Payment'}</h4>
                          <div className="flex flex-wrap gap-3 text-sm mt-1">
                            <span className="text-gray-400">
                              Amount: <span className="text-lime-400 font-semibold">Rs. {payment.amount || payment.coursePrice || 0}</span>
                            </span>
                            <span className="text-gray-400">
                              Status: <span className={`font-semibold ${
                                payment.status === 'approved' || payment.status === 'completed' ? 'text-lime-400' : 
                                payment.status === 'pending' ? 'text-yellow-400' : 
                                'text-red-400'
                              }`}>{payment.status || 'pending'}</span>
                            </span>
                            <span className="text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        {payment.status === 'pending' && (
                          <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs font-semibold whitespace-nowrap">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-black/40 p-4 border border-indigo-600/20 rounded-xl flex-wrap gap-3">
                  <div>
                    <h3 className="text-white font-bold text-base flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-lime-400" />
                      <span>User Activity Database Engine</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Real-time trace of authentication, profiles and lessons</p>
                  </div>
                  {activities.length > 0 && (
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to permanently delete all logs for this user? This action will remove data from the database.")) {
                          const res = await deleteUserActivity(user.uid);
                          if (res.success) {
                            alert("User activity logs cleared successfully!");
                          } else {
                            alert("Error: " + res.error);
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span>Clear Activity Log</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {activities.length === 0 ? (
                    <div className="text-center py-12 bg-black/50 border border-indigo-600/10 rounded-xl">
                      <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm font-semibold">No activity found</p>
                      <p className="text-gray-500 text-xs">This user hasn't performed any tracked actions yet.</p>
                    </div>
                  ) : (
                    activities.slice(0, 50).map((activity: any, idx) => {
                      const { os, browser } = (() => {
                        const ua = activity.userAgent || '';
                        let parsedOs = activity.os || 'Unknown OS';
                        let parsedBrowser = activity.browser || 'Unknown Browser';
                        if (ua && (parsedOs === 'Unknown OS' || parsedBrowser === 'Unknown Browser')) {
                          const lower = ua.toLowerCase();
                          if (lower.includes('windows')) parsedOs = 'Windows';
                          else if (lower.includes('macintosh') || lower.includes('mac os')) parsedOs = 'macOS';
                          else if (lower.includes('iphone') || lower.includes('ipad')) parsedOs = 'iOS';
                          else if (lower.includes('android')) parsedOs = 'Android';
                          else if (lower.includes('linux')) parsedOs = 'Linux';
                          
                          if (lower.includes('chrome') || lower.includes('crios')) parsedBrowser = 'Chrome';
                          else if (lower.includes('firefox') || lower.includes('fxios')) parsedBrowser = 'Firefox';
                          else if (lower.includes('safari') && !lower.includes('chrome') && !lower.includes('android')) parsedBrowser = 'Safari';
                          else if (lower.includes('edge') || lower.includes('edg')) parsedBrowser = 'Edge';
                          else if (lower.includes('opera') || lower.includes('opr')) parsedBrowser = 'Opera';
                        }
                        return { os: parsedOs, browser: parsedBrowser };
                      })();

                      let typeColorAndLabel = {
                        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                        label: 'Login'
                      };
                      if (activity.type === 'logout') {
                        typeColorAndLabel = {
                          bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
                          label: 'Logout'
                        };
                      } else if (activity.type === 'register') {
                        typeColorAndLabel = {
                          bg: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
                          label: 'Sign Up'
                        };
                      } else if (activity.type === 'profile_update') {
                        typeColorAndLabel = {
                          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
                          label: 'Profile Edit'
                        };
                      } else if (activity.type === 'course_access' || activity.type === 'course_view') {
                        typeColorAndLabel = {
                          bg: 'bg-lime-500/10 border-lime-500/30 text-lime-400',
                          label: 'Course Opened'
                        };
                      } else if (activity.type === 'lesson_complete') {
                        typeColorAndLabel = {
                          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                          label: 'Lesson Completed'
                        };
                      } else if (activity.type === 'comment_add') {
                        typeColorAndLabel = {
                          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                          label: 'Comment Shared'
                        };
                      }

                      return (
                        <div key={idx} className="bg-black/30 border border-indigo-600/15 rounded-xl p-4 hover:bg-indigo-600/5 transition-all">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${typeColorAndLabel.bg}`}>
                                {typeColorAndLabel.label}
                              </span>
                              <div>
                                <p className="text-white text-sm font-semibold">
                                  {activity.method ? `Signed in via ${activity.method}` : ''}
                                  {activity.courseName ? `Entered: ${activity.courseName}` : ''}
                                  {activity.lessonTitle ? `Finished: ${activity.lessonTitle}` : ''}
                                  {activity.fields ? `Updated: ${activity.fields.join(', ')}` : ''}
                                  {activity.message ? activity.message : ''}
                                  {!activity.method && !activity.courseName && !activity.lessonTitle && !activity.fields && !activity.message ? 'Logged standard application event' : ''}
                                </p>
                                <p className="text-gray-400 text-xs mt-0.5">{activity.email || ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1.5">
                                {os === 'iOS' || os === 'Android' ? (
                                  <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                                ) : (
                                  <Monitor className="w-3.5 h-3.5 text-gray-500" />
                                )}
                                <span className="font-medium text-gray-300">{os}</span>
                              </span>
                              <span className="font-semibold px-2 py-0.5 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded">
                                {browser}
                              </span>
                              <span className="text-gray-500">
                                {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Send Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowNotificationModal(false)}>
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-400" />
                  Send Notification
                </h3>
                <button onClick={() => setShowNotificationModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:border-lime-400 transition-all"
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Message *</label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white resize-none focus:border-lime-400 transition-all"
                    placeholder="Notification message"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
                  <select
                    value={notificationForm.type}
                    onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:border-lime-400 transition-all"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowNotificationModal(false)} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">Cancel</button>
                  <button onClick={handleSendNotification} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-lime-500 text-white font-bold rounded-xl">Send</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Invoice Modal */}
        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowInvoiceModal(false)}>
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-lime-400" />
                  Send Invoice
                </h3>
                <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Course *</label>
                  <select
                    value={invoiceForm.courseId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, courseId: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:border-lime-400 transition-all"
                  >
                    <option value="">Select Course</option>
                    {courses.filter(c => c.price > 0).map(course => (
                      <option key={course.id} value={course.id}>{course.title} - Rs. {course.price}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Amount (Rs.) *</label>
                  <input
                    type="number"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:border-lime-400 transition-all"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white resize-none focus:border-lime-400 transition-all"
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowInvoiceModal(false)} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">Cancel</button>
                  <button onClick={handleSendInvoice} className="flex-1 px-4 py-3 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl">Send Invoice</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDetailsModal
