import { useState, useEffect } from 'react'
import AdminLayout from './components/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { 
  watchAllUsers, 
  updateUserRole, 
  deleteUser, 
  createUserByAdmin,
  updateUserProfile,
  suspendUser,
  updateUserStatus,
  trackUserActivity,
  updateUserVerification
} from '../services/admin/UserManagement'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../config/firebase'
import { 
  Users, 
  UserPlus, 
  Shield, 
  User, 
  Trash2, 
  Edit, 
  Mail, 
  Phone,
  Search,
  X,
  ArrowRight,
  Eye,
  Ban,
  CheckCircle,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Bell,
  CreditCard,
  Activity,
  FileText
} from 'lucide-react'
import UserDetailsModal from './components/UserDetailsModal'
import { toast } from '../components/Toast'

const UserManagement = () => {
  const { user: currentUser, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user'
  })
  const [errors, setErrors] = useState({})
  const [actionLoading, setActionLoading] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null)
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    const unsubscribe = watchAllUsers((usersData) => {
      setUsers(usersData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const toggleVerified = async (userId, verified) => {
    if (userId === currentUser?.uid && !verified) {
      toast.error('You cannot remove your own verified status.')
      return
    }
    setActionLoading(true)
    try {
      const result = await updateUserVerification(userId, verified)
      if (result.success) {
        toast.success(`User ${verified ? 'verified' : 'unverified'} successfully!`)
        setUsers(prev => prev.map(u => 
          u.uid === userId ? { ...u, verified } : u
        ))
      } else {
        toast.error(result.error || 'Failed to update verification')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getAvatarFallback = (user) => {
    if (user.name && user.name.length > 0) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user.email && user.email.length > 0) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const filteredUsers = users
    .filter(user => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower)
      )
      
      const matchesRole = filterRole === 'all' || user.role === filterRole
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.status === 'active' && !user.suspended) ||
        (filterStatus === 'suspended' && user.suspended === true) ||
        (filterStatus === 'inactive' && user.status !== 'active')
      
      return matchesSearch && matchesRole && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '')
          break
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '')
          break
        case 'role':
          comparison = (a.role || '').localeCompare(b.role || '')
          break
        case 'created':
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleCreateUser = async () => {
    setErrors({})
    
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }
    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required' })
      return
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Invalid email format' })
      return
    }
    if (!formData.password || formData.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' })
      return
    }

    setActionLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      const result = await createUserByAdmin({
        uid: userCredential.user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        createdBy: currentUser?.uid
      })

      if (result.success) {
        toast.success('User created successfully!')
        setShowCreateModal(false)
        setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
      } else {
        setErrors({ submit: result.error })
      }
    } catch (error) {
      setErrors({ submit: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    if (userId === currentUser?.uid) {
      toast.error('You cannot change your own role.')
      return
    }
    setActionLoading(true)
    try {
      const result = await updateUserRole(userId, newRole)
      if (result.success) {
        toast.success('User role updated successfully!')
      } else {
        toast.error('Failed to update role: ' + result.error)
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      toast.error('No user selected')
      return
    }

    if (!currentUser) {
      toast.error('You must be logged in to perform this action')
      return
    }

    setActionLoading(true)
    try {
      const result = await deleteUser(selectedUser.uid)
      if (result && result.success) {
        await trackUserActivity(currentUser.uid, 'user_deleted', { deletedUserId: selectedUser.uid })
        toast.success('User deleted successfully!')
        setShowDeleteModal(false)
        setSelectedUser(null)
      } else {
        toast.error('Failed to delete user: ' + (result?.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error('Error: ' + (error.message || 'Unknown error occurred'))
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (user) => {
    setSelectedUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'user'
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setErrors({})
    
    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }

    setActionLoading(true)
    try {
      if (formData.role !== selectedUser.role) {
        await updateUserRole(selectedUser.uid, formData.role)
        await trackUserActivity(currentUser.uid, 'user_role_changed', {
          targetUserId: selectedUser.uid,
          oldRole: selectedUser.role,
          newRole: formData.role
        })
      }

      await updateUserProfile(selectedUser.uid, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        updatedAt: new Date().toISOString()
      })

      await trackUserActivity(currentUser.uid, 'user_updated', {
        targetUserId: selectedUser.uid
      })

      toast.success('User updated successfully!')
      setShowEditModal(false)
      setSelectedUser(null)
      setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
    } catch (error) {
      setErrors({ submit: error.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendUser = async (userId, suspend = true, reason = '') => {
    if (userId === currentUser?.uid) {
      toast.error('You cannot suspend your own account.')
      return
    }
    if (!window.confirm(suspend ? 'Are you sure you want to suspend this user?' : 'Are you sure you want to unsuspend this user?')) {
      return
    }

    setActionLoading(true)
    try {
      const result = await suspendUser(userId, suspend, reason)
      if (result.success) {
        await trackUserActivity(currentUser.uid, suspend ? 'user_suspended' : 'user_unsuspended', {
          targetUserId: userId,
          reason: reason
        })
        toast.success(suspend ? 'User suspended successfully!' : 'User unsuspended successfully!')
        // If suspending the current admin? Already prevented.
      } else {
        toast.error('Failed to ' + (suspend ? 'suspend' : 'unsuspend') + ' user: ' + result.error)
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewUserDetails = (user) => {
    setSelectedUserForDetails(user)
    setShowUserDetails(true)
    trackUserActivity(currentUser?.uid, 'user_viewed', { targetUserId: user.uid })
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600/20 via-indigo-600/10 to-transparent border-2 border-indigo-600/30 rounded-2xl p-4 md:p-6 lg:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-indigo-600/5 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">User Management</h1>
              <p className="text-sm md:text-base lg:text-lg text-gray-300">Manage users, roles, permissions & verified badges</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-lime-500 text-black font-bold rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create New User</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-4 md:p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name, email, phone, or role..."
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 lg:py-4 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base placeholder-gray-500 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Filter by Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-600"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="created">Created Date</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Order</label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full px-3 py-2 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm hover:border-indigo-600 transition-all flex items-center justify-center space-x-2"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-black/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Created</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-600/20">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-black/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600/30"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 rounded-full bg-indigo-600/20 border-2 border-indigo-600/30 flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}>
                              <span className="text-indigo-300 font-medium text-sm">{getAvatarFallback(user)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-medium">{user.name || 'N/A'}</span>
                              {user.verified && (
                                <img 
                                  src="/bluetick.svg" 
                                  alt="Verified" 
                                  className="w-4 h-4 inline-block"
                                />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{user.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-300">{user.phone || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <select
                              value={user.role || 'user'}
                              onChange={(e) => handleChangeRole(user.uid, e.target.value)}
                              disabled={user.uid === currentUser?.uid || actionLoading}
                              className={`px-3 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${
                                user.role === 'admin'
                                  ? 'bg-indigo-600 text-black border-indigo-600'
                                  : user.role === 'moderator'
                                  ? 'bg-purple-600 text-white border-purple-600'
                                  : 'bg-black/50 text-white border-indigo-600/30'
                              } ${user.uid === currentUser?.uid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-600'}`}
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                            {user.suspended && (
                              <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg border border-red-600/30">
                                Suspended
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center space-x-2 flex-wrap gap-1">
                            <button
                              onClick={() => handleViewUserDetails(user)}
                              className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all duration-200 border border-blue-600/30 hover:border-blue-600"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-600 rounded-xl transition-all duration-200 border border-indigo-600/30 hover:border-indigo-600"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleVerified(user.uid, !user.verified)}
                              className={`p-2 rounded-xl transition-all duration-200 border ${
                                user.verified 
                                  ? 'bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30' 
                                  : 'bg-gray-600/20 text-gray-400 border-gray-600/30 hover:bg-gray-600/30'
                              }`}
                              title={user.verified ? 'Remove verified badge' : 'Make verified'}
                            >
                              <CheckCircle className={`w-4 h-4 ${user.verified ? 'fill-current' : ''}`} />
                            </button>
                            {user.uid !== currentUser?.uid && (
                              <>
                                {user.suspended ? (
                                  <button
                                    onClick={() => handleSuspendUser(user.uid, false)}
                                    className="p-2 bg-lime-600/20 hover:bg-lime-600/30 text-lime-400 rounded-xl transition-all duration-200 border border-lime-600/30 hover:border-lime-600"
                                    title="Unsuspend User"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSuspendUser(user.uid, true)}
                                    className="p-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-xl transition-all duration-200 border border-yellow-600/30 hover:border-yellow-600"
                                    title="Suspend User"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowDeleteModal(true)
                                  }}
                                  className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-200 border border-red-600/30 hover:border-red-600"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.uid} className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-600/30"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-full bg-indigo-600/20 border-2 border-indigo-600/30 flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}>
                        <span className="text-indigo-300 font-medium text-lg">{getAvatarFallback(user)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-white font-semibold truncate">{user.name || 'N/A'}</p>
                          {user.verified && (
                            <img 
                              src="/bluetick.svg" 
                              alt="Verified" 
                              className="w-4 h-4 inline-block flex-shrink-0"
                            />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm truncate">{user.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => handleViewUserDetails(user)}
                        className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-600 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleVerified(user.uid, !user.verified)}
                        className={`p-2 rounded-lg transition-all ${
                          user.verified 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-gray-600/20 text-gray-400'
                        }`}
                        title={user.verified ? 'Remove verified badge' : 'Make verified'}
                      >
                        <CheckCircle className={`w-4 h-4 ${user.verified ? 'fill-current' : ''}`} />
                      </button>
                      {user.uid !== currentUser?.uid && (
                        <>
                          {user.suspended ? (
                            <button
                              onClick={() => handleSuspendUser(user.uid, false)}
                              className="p-2 bg-lime-600/20 hover:bg-lime-600/30 text-lime-400 rounded-lg transition-all"
                              title="Unsuspend"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendUser(user.uid, true)}
                              className="p-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg transition-all"
                              title="Suspend"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDeleteModal(true)
                            }}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Phone:</span>
                      <span className="text-white">{user.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Role:</span>
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleChangeRole(user.uid, e.target.value)}
                          disabled={user.uid === currentUser?.uid || actionLoading}
                          className={`px-2 py-1 rounded-lg font-semibold text-xs border-2 transition-all ${
                            user.role === 'admin'
                              ? 'bg-indigo-600 text-black border-indigo-600'
                              : user.role === 'moderator'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-black/50 text-white border-indigo-600/30'
                          } ${user.uid === currentUser?.uid ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        {user.suspended && (
                          <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs font-semibold rounded-lg border border-red-600/30">
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-16 text-center">
            <Users className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-2">No users found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first user to get started'}
            </p>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 md:p-4">
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-4 md:p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create New User</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
                    setErrors({})
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  />
                  {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {errors.submit && (
                  <div className="bg-red-600/20 border-2 border-red-600/50 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
                      setErrors({})
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors font-semibold"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-lime-500 text-black font-bold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                  >
                    {actionLoading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 md:p-4">
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-4 md:p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit User</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                    setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
                    setErrors({})
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-black/50 border-2 border-indigo-600/20 rounded-xl text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/20 transition-all"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {errors.submit && (
                  <div className="bg-red-600/20 border-2 border-red-600/50 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedUser(null)
                      setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
                      setErrors({})
                    }}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors font-semibold"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-lime-500 text-black font-bold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-indigo-600/30"
                  >
                    {actionLoading ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 md:p-4">
            <div className="bg-[#1a1a1a] border-2 border-red-600/50 rounded-2xl p-4 md:p-6 lg:p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Delete User</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">{selectedUser.name}</span>? 
                This action cannot be undone. All user data, enrollments, badges, and history will be permanently deleted.
              </p>
              <div className="bg-red-600/20 border-2 border-red-600/50 rounded-xl p-4 mb-6">
                <p className="text-red-400 font-semibold mb-2">Warning:</p>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>User account will be deleted from the database</li>
                  <li>All enrollments, progress, badges, presence will be removed</li>
                  <li>Chat history will be deleted</li>
                  <li>Notifications will be removed</li>
                  <li>Admin notes will be removed</li>
                  <li><strong>Firebase Authentication account deletion is attempted</strong> – if it fails, admin must manually delete from Firebase Console.</li>
                </ul>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedUser(null)
                  }}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors font-semibold"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-red-600/30"
                >
                  {actionLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUserForDetails && (
          <UserDetailsModal
            user={selectedUserForDetails}
            onClose={() => {
              setShowUserDetails(false)
              setSelectedUserForDetails(null)
            }}
            currentAdminId={currentUser?.uid}
          />
        )}
      </div>
    </AdminLayout>
  )
}

export default UserManagement
