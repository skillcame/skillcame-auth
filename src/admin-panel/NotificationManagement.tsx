import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from './components/AdminLayout'
import { 
  Bell, 
  Plus, 
  Trash2, 
  Search,
  Users,
  User,
  Send,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Eye,
  EyeOff,
  CheckCheck
} from 'lucide-react'
import { watchAllUsers, watchAllNotifications, createNotificationForAll, createNotificationForUser, deleteNotification, deleteAllNotificationsForUser, deleteAllNotifications, markNotificationAsRead, markAllNotificationsAsRead, getAllUsers } from '../services/admin/NotificationManagement'
import { toast } from '../components/Toast'

const NotificationManagement = () => {
  const [activeTab, setActiveTab] = useState('send')
  const [allUsers, setAllUsers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
    role: 'user'
  })
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRead, setFilterRead] = useState('all') // all, read, unread
  const [expandedNotifications, setExpandedNotifications] = useState(new Set())

  useEffect(() => {
    const unsubscribeUsers = watchAllUsers((usersData) => {
      setAllUsers(usersData)
    })
    
    const unsubscribeNotifications = watchAllNotifications((notificationsData) => {
      setNotifications(notificationsData)
      setLoading(false)
    })
    
    return () => {
      unsubscribeUsers()
      unsubscribeNotifications()
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.message.trim()) newErrors.message = 'Message is required'
    if (formData.target === 'user' && !selectedUserId) newErrors.user = 'Please select a user'
    if (formData.target === 'multiple' && selectedUserIds.length === 0) newErrors.user = 'Please select at least one user'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const notificationData = {
        title: formData.title,
        message: formData.message,
        type: formData.type
      }

      if (formData.target === 'all') {
        await createNotificationForAll(notificationData)
        toast.success('Notification sent to all users!')
      } else if (formData.target === 'role') {
        const usersByRole = allUsers.filter(u => u.role === formData.role)
        for (const user of usersByRole) {
          await createNotificationForUser(user.uid, notificationData)
        }
        toast.success(`Notification sent to ${usersByRole.length} ${formData.role}(s)!`)
      } else if (formData.target === 'multiple') {
        for (const userId of selectedUserIds) {
          await createNotificationForUser(userId, notificationData)
        }
        toast.success(`Notification sent to ${selectedUserIds.length} user(s)!`)
      } else {
        await createNotificationForUser(selectedUserId, notificationData)
        toast.success('Notification sent successfully!')
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target: 'all',
      role: 'user'
    })
    setSelectedUserId('')
    setSelectedUserIds([])
    setSearchTerm('')
    setErrors({})
  }

  const handleMarkAsRead = async (userId, notificationId) => {
    try {
      await markNotificationAsRead(userId, notificationId)
      toast.success('Marked as read')
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleMarkAllAsRead = async (userId) => {
    try {
      await markAllNotificationsAsRead(userId)
      toast.success('All notifications marked as read for this user')
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleDeleteAllForUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ALL notifications for ${userName || userId}? This action cannot be undone.`)) {
      try {
        await deleteAllNotificationsForUser(userId)
        toast.success(`All notifications deleted for ${userName || userId}`)
      } catch (error) {
        toast.error('Error: ' + error.message)
      }
    }
  }

  const handleDeleteAllGlobal = async () => {
    if (window.confirm('Are you sure you want to delete ALL notifications for ALL users? This action cannot be undone.')) {
      try {
        await deleteAllNotifications()
        toast.success('All notifications deleted for all users')
      } catch (error) {
        toast.error('Error: ' + error.message)
      }
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-lime-400/20 text-lime-400 border-lime-400/30'
      case 'warning': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
      case 'error': return 'bg-red-400/20 text-red-400 border-red-400/30'
      default: return 'bg-indigo-600/20 text-indigo-400 border-indigo-600/30'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />
      default: return <Info className="w-5 h-5 text-indigo-400" />
    }
  }

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications]
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(term) ||
        n.message?.toLowerCase().includes(term) ||
        allUsers.find(u => u.uid === n.userId)?.name?.toLowerCase().includes(term) ||
        allUsers.find(u => u.uid === n.userId)?.email?.toLowerCase().includes(term)
      )
    }
    
    // Read status filter
    if (filterRead !== 'all') {
      filtered = filtered.filter(n => 
        filterRead === 'read' ? n.read === true : n.read !== true
      )
    }
    
    return filtered
  }, [notifications, searchTerm, filterRead, allUsers])

  const stats = useMemo(() => {
    const total = notifications.length
    const read = notifications.filter(n => n.read === true).length
    const unread = total - read
    return { total, read, unread }
  }, [notifications])

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Notifications</h1>
            <p className="text-sm md:text-base lg:text-lg text-gray-400">Send and manage notifications for users</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteAllGlobal}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 text-red-400 font-bold rounded-xl transition-all duration-200 flex items-center space-x-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All</span>
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-lime-400/30 hover:scale-105 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Send Notification</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-indigo-600/20">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === 'send'
                ? 'text-lime-400 border-b-2 border-lime-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === 'all'
                ? 'text-lime-400 border-b-2 border-lime-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Notifications
          </button>
        </div>

        {/* Send Tab Content */}
        {activeTab === 'send' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-4 md:p-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl md:text-3xl font-bold text-white">{allUsers.length}</p>
                    <p className="text-xs md:text-sm text-gray-400">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-4 md:p-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-lime-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 md:w-6 md:h-6 text-lime-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl md:text-3xl font-bold text-white">{stats.total}</p>
                    <p className="text-xs md:text-sm text-gray-400">Total Notifications</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-4 md:p-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    allUsers.length > 0 ? 'bg-lime-400/20' : 'bg-red-400/20'
                  }`}>
                    <CheckCircle className={`w-5 h-5 md:w-6 md:h-6 ${
                      allUsers.length > 0 ? 'text-lime-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-2xl md:text-3xl font-bold ${
                      allUsers.length > 0 ? 'text-lime-400' : 'text-red-400'
                    }`}>
                      {allUsers.length > 0 ? 'Ready' : 'Error'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-400">System Status</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-lime-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Notification Guidelines</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Use clear and concise titles</li>
                    <li>• Keep messages informative and actionable</li>
                    <li>• Choose appropriate notification types</li>
                    <li>• Test notifications before sending to all users</li>
                    <li>• Notifications are sent in real-time</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* All Notifications Tab */}
        {activeTab === 'all' && (
          <div className="space-y-4 md:space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-10 pr-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterRead('all')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                    filterRead === 'all' ? 'bg-indigo-600 text-white' : 'bg-black/50 text-gray-400 hover:bg-indigo-600/20'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  All
                </button>
                <button
                  onClick={() => setFilterRead('unread')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                    filterRead === 'unread' ? 'bg-yellow-600 text-white' : 'bg-black/50 text-gray-400 hover:bg-yellow-600/20'
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                  Unread
                </button>
                <button
                  onClick={() => setFilterRead('read')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                    filterRead === 'read' ? 'bg-green-600 text-white' : 'bg-black/50 text-gray-400 hover:bg-green-600/20'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Read
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-indigo-600/20 rounded-lg text-indigo-400">Total: {stats.total}</span>
              <span className="px-3 py-1 bg-yellow-600/20 rounded-lg text-yellow-400">Unread: {stats.unread}</span>
              <span className="px-3 py-1 bg-green-600/20 rounded-lg text-green-400">Read: {stats.read}</span>
            </div>

            {/* Notifications List */}
            {loading ? (
              <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-12 text-center">
                <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Notifications Found</h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search' : 'No notifications have been sent yet'}
                </p>
              </div>
            ) : (
              <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl overflow-hidden">
                <div className="divide-y divide-indigo-600/10 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {filteredNotifications.map((notification) => {
                    const user = allUsers.find(u => u.uid === notification.userId)
                    return (
                      <div
                        key={`${notification.userId}_${notification.id}`}
                        className={`p-4 md:p-6 hover:bg-black/30 transition-colors ${!notification.read ? 'bg-indigo-600/5' : ''}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 flex items-center justify-center ${getTypeColor(notification.type)}`}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                              <div className="flex-1">
                                <h4 className="text-lg font-bold text-white mb-1">{notification.title}</h4>
                                <p className="text-gray-300 mb-2">{notification.message}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.userId, notification.id)}
                                    className="p-2 hover:bg-green-600/10 rounded-lg transition-colors"
                                    title="Mark as read"
                                  >
                                    <CheckCheck className="w-4 h-4 text-green-400" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAllForUser(notification.userId, user?.name || notification.userId)}
                                  className="p-2 hover:bg-red-600/10 rounded-lg transition-colors"
                                  title="Delete all for this user"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Delete this notification?')) {
                                      deleteNotification(notification.userId, notification.id).then(() => {
                                        toast.success('Notification deleted')
                                      }).catch(() => toast.error('Error deleting'))
                                    }
                                  }}
                                  className="p-2 hover:bg-red-600/10 rounded-lg transition-colors"
                                  title="Delete single"
                                >
                                  <XCircle className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-lg border text-xs font-semibold ${getTypeColor(notification.type)}`}>
                                  {notification.type || 'info'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-400">
                                <User className="w-4 h-4" />
                                <span>{user?.name || user?.email || notification.data?.userName || 'Unknown User'}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {notification.createdAt 
                                    ? new Date(notification.createdAt).toLocaleString()
                                    : 'Unknown date'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {notification.read ? (
                                  <span className="text-green-400 text-xs">✓ Read</span>
                                ) : (
                                  <span className="text-yellow-400 text-xs">● Unread</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Payment Invoice Details */}
                            {notification.type === 'payment_request' && notification.data && (
                              <div className="mt-4 pt-4 border-t border-indigo-600/20">
                                <button
                                  onClick={() => {
                                    const notifId = `${notification.userId}_${notification.id}`
                                    setExpandedNotifications(prev => {
                                      const newSet = new Set(prev)
                                      if (newSet.has(notifId)) newSet.delete(notifId)
                                      else newSet.add(notifId)
                                      return newSet
                                    })
                                  }}
                                  className="w-full flex items-center justify-between p-3 bg-black/50 rounded-xl hover:bg-black/70 transition-colors"
                                >
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="w-5 h-5 text-lime-400" />
                                    <span className="text-white font-semibold">Payment Invoice Details</span>
                                  </div>
                                  {expandedNotifications.has(`${notification.userId}_${notification.id}`) ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                                
                                {expandedNotifications.has(`${notification.userId}_${notification.id}`) && (
                                  <div className="mt-3 p-4 bg-black/50 rounded-xl space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {notification.data.userName && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">User Name</p>
                                          <p className="text-white font-medium">{notification.data.userName}</p>
                                        </div>
                                      )}
                                      {notification.data.userEmail && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">Email</p>
                                          <p className="text-white font-medium">{notification.data.userEmail}</p>
                                        </div>
                                      )}
                                      {notification.data.courseTitle && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">Course</p>
                                          <p className="text-white font-medium">{notification.data.courseTitle}</p>
                                        </div>
                                      )}
                                      {notification.data.resourceName && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">Resource</p>
                                          <p className="text-white font-medium">{notification.data.resourceName}</p>
                                        </div>
                                      )}
                                      {notification.data.amount !== undefined && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">Amount</p>
                                          <p className="text-lime-400 font-bold">{notification.data.currency || 'PKR'} {notification.data.amount}</p>
                                        </div>
                                      )}
                                      {notification.data.transferId && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                                          <p className="text-white font-mono text-sm">{notification.data.transferId}</p>
                                        </div>
                                      )}
                                      {notification.data.requestId && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1">Request ID</p>
                                          <p className="text-white font-mono text-sm">{notification.data.requestId}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {notification.data.screenshotUrl && (
                                      <div className="mt-3">
                                        <p className="text-xs text-gray-400 mb-2">Payment Screenshot</p>
                                        <div className="relative border-2 border-indigo-600/30 rounded-xl overflow-hidden bg-black/50">
                                          <img
                                            src={notification.data.screenshotUrl}
                                            alt="Payment screenshot"
                                            className="w-full h-auto max-h-64 object-contain"
                                            onError={(e) => {
                                              e.target.style.display = 'none'
                                            }}
                                          />
                                          <a
                                            href={notification.data.screenshotUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute top-2 right-2 p-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-full text-white transition-colors"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {notification.data.notes && (
                                      <div className="mt-3">
                                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                                        <p className="text-white text-sm">{notification.data.notes}</p>
                                      </div>
                                    )}
                                    
                                    <div className="mt-3 pt-3 border-t border-indigo-600/20 flex items-center justify-between">
                                      <a
                                        href={`/admin/payments?requestId=${notification.data.requestId}`}
                                        className="px-4 py-2 bg-lime-400/20 hover:bg-lime-400/30 border border-lime-400/30 text-lime-400 rounded-xl transition-colors text-sm font-semibold flex items-center space-x-2"
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span>View in Payments</span>
                                      </a>
                                      <button
                                        onClick={() => handleMarkAllAsRead(notification.userId)}
                                        className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 text-indigo-400 rounded-xl transition-colors text-sm font-semibold flex items-center space-x-2"
                                      >
                                        <CheckCheck className="w-4 h-4" />
                                        <span>Mark All as Read</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Send Notification Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-4 md:p-6 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Send Notification</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Target *</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer p-3 bg-black/50 border-2 border-indigo-600/20 rounded-xl hover:border-lime-400/50 transition-all">
                      <input
                        type="radio"
                        name="target"
                        value="all"
                        checked={formData.target === 'all'}
                        onChange={handleChange}
                        className="w-4 h-4 text-lime-400 bg-black border-2 border-indigo-600/30 focus:ring-lime-400"
                      />
                      <span className="text-white">All Users</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-3 bg-black/50 border-2 border-indigo-600/20 rounded-xl hover:border-lime-400/50 transition-all">
                      <input
                        type="radio"
                        name="target"
                        value="user"
                        checked={formData.target === 'user'}
                        onChange={handleChange}
                        className="w-4 h-4 text-lime-400 bg-black border-2 border-indigo-600/30 focus:ring-lime-400"
                      />
                      <span className="text-white">Specific User</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-3 bg-black/50 border-2 border-indigo-600/20 rounded-xl hover:border-lime-400/50 transition-all">
                      <input
                        type="radio"
                        name="target"
                        value="role"
                        checked={formData.target === 'role'}
                        onChange={handleChange}
                        className="w-4 h-4 text-lime-400 bg-black border-2 border-indigo-600/30 focus:ring-lime-400"
                      />
                      <span className="text-white">By Role</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-3 bg-black/50 border-2 border-indigo-600/20 rounded-xl hover:border-lime-400/50 transition-all">
                      <input
                        type="radio"
                        name="target"
                        value="multiple"
                        checked={formData.target === 'multiple'}
                        onChange={handleChange}
                        className="w-4 h-4 text-lime-400 bg-black border-2 border-indigo-600/30 focus:ring-lime-400"
                      />
                      <span className="text-white">Multiple Users</span>
                    </label>
                  </div>
                </div>

                {formData.target === 'user' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Select User *</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-12 pr-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all mb-3"
                      />
                    </div>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className={`w-full px-4 py-3 bg-black border-2 ${
                        errors.user ? 'border-red-500' : 'border-indigo-600/30'
                      } rounded-xl text-white focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all`}
                    >
                      <option value="">Select a user...</option>
                      {allUsers
                        .filter(user => 
                          !searchTerm || 
                          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((user) => (
                          <option key={user.uid} value={user.uid}>
                            {user.name || user.email} ({user.role || 'user'})
                          </option>
                        ))}
                    </select>
                    {errors.user && <p className="mt-1 text-sm text-red-400">{errors.user}</p>}
                  </div>
                )}

                {formData.target === 'role' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Select Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all"
                    >
                      <option value="user">Regular Users</option>
                      <option value="admin">Admins</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-400">
                      This will send to {allUsers.filter(u => u.role === formData.role).length} {formData.role}(s)
                    </p>
                  </div>
                )}

                {formData.target === 'multiple' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Select Multiple Users *</label>
                    <div className="relative mb-3">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-12 pr-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all"
                      />
                    </div>
                    <div className="bg-black/50 border-2 border-indigo-600/20 rounded-xl p-4 max-h-64 overflow-y-auto">
                      {allUsers
                        .filter(user => 
                          !searchTerm || 
                          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((user) => (
                          <label key={user.uid} className="flex items-center space-x-3 p-2 hover:bg-indigo-600/10 rounded-lg cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user.uid)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, user.uid])
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter(id => id !== user.uid))
                                }
                              }}
                              className="w-4 h-4 text-lime-400 bg-black border-2 border-indigo-600/30 rounded focus:ring-lime-400"
                            />
                            <div className="flex-1">
                              <p className="text-white font-medium">{user.name || 'Unknown'}</p>
                              <p className="text-gray-400 text-sm">{user.email}</p>
                            </div>
                            <span className="text-xs text-lime-400">{user.role || 'user'}</span>
                          </label>
                        ))}
                    </div>
                    {selectedUserIds.length > 0 && (
                      <p className="mt-2 text-sm text-lime-400">
                        {selectedUserIds.length} user(s) selected
                      </p>
                    )}
                    {errors.user && <p className="mt-1 text-sm text-red-400">{errors.user}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-black border-2 ${
                      errors.title ? 'border-red-500' : 'border-indigo-600/30'
                    } rounded-xl text-white focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 transition-all`}
                    placeholder="Notification title"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={`w-full px-4 py-3 bg-black border-2 ${
                      errors.message ? 'border-red-500' : 'border-indigo-600/30'
                    } rounded-xl text-white focus:outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20 resize-none transition-all`}
                    placeholder="Notification message"
                  />
                  {errors.message && <p className="mt-1 text-sm text-red-400">{errors.message}</p>}
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-lime-400 hover:bg-lime-300 text-black font-bold rounded-xl transition-all duration-200 shadow-lg shadow-lime-400/30 flex items-center justify-center space-x-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Send Notification</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default NotificationManagement
