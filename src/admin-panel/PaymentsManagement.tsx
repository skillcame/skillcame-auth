import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from './components/AdminLayout'
import Modal from './components/Modal'
import Table from './components/Table'
import { 
  watchAllPayments, 
  watchPaymentRequests, 
  updatePaymentStatus, 
  updatePaymentRequestStatus,
  deletePaymentRequest,
  updatePaymentRequest,
  getPaymentRequestById,
  bulkUpdatePaymentRequestStatus,
  revokeCourseAccess,
  getPaymentAccountDetails, 
  updatePaymentAccountDetails, 
  approveCourseAccess, 
  rejectCourseAccess, 
  createNotificationForUser 
} from '../services/admin/PaymentsManagement'
import { 
  CreditCard, Edit, CheckCircle, XCircle, Clock, DollarSign, Building2, 
  Unlock, Lock, Eye, X, FileText, User, Calendar, Trash2, Download, 
  Filter, Search, ChevronLeft, ChevronRight, Mail, Phone, Users, 
  UserCheck, AlertCircle, TrendingUp, Award, Zap, Shield, BookOpen
} from 'lucide-react'
import { toast } from '../components/Toast'

// ... rest of the component remains exactly the same as in the previous answer
const PaymentsManagement = () => {
  const [payments, setPayments] = useState([])
  const [paymentRequests, setPaymentRequests] = useState([])
  const [accountDetails, setAccountDetails] = useState(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState(null)
  const [editFormData, setEditFormData] = useState({
    transferId: '',
    amount: '',
    senderName: '',
    transferDate: '',
    notes: ''
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [accountForm, setAccountForm] = useState({
    bankName: '',
    accountTitle: '',
    iban: '',
    accountNumber: '',
    easypaisa: '',
    jazzcash: '',
    whatsapp: ''
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequests, setSelectedRequests] = useState(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const itemsPerPage = 10

  useEffect(() => {
    const unsubscribePayments = watchAllPayments((paymentsData) => {
      setPayments(paymentsData)
      setLoading(false)
    })
    
    const unsubscribeRequests = watchPaymentRequests((requestsData) => {
      setPaymentRequests(requestsData)
    })
    
    getPaymentAccountDetails().then(result => {
      if (result.success && result.data) {
        setAccountDetails(result.data)
        setAccountForm({ ...result.data, whatsapp: result.data.whatsapp || '' })
      }
    })

    return () => {
      unsubscribePayments()
      unsubscribeRequests()
    }
  }, [])

  const handleUpdateStatus = async (paymentId, status) => {
    try {
      await updatePaymentStatus(paymentId, status)
      toast.success('Payment status updated!')
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleApproveCourseAccess = async (payment) => {
    if (!payment.courseId || !payment.userId) {
      toast.error('Payment does not have course or user information')
      return
    }
    try {
      const result = await approveCourseAccess(payment.userId, payment.courseId, payment.id)
      if (result.success) {
        toast.success('Course access approved successfully!')
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleRevokeCourseAccess = async (userId, courseId, userName) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${userName || userId}?`)) return
    const reason = prompt('Enter reason for revocation (optional):')
    try {
      const result = await revokeCourseAccess(userId, courseId, reason || '')
      if (result.success) {
        toast.success('Course access revoked successfully!')
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleViewRequest = (request) => {
    setSelectedRequest(request)
    setShowRequestModal(true)
  }

  const handleEditRequest = async (requestId) => {
    try {
      const result = await getPaymentRequestById(requestId)
      if (result.success && result.data) {
        setEditingRequest(result.data)
        setEditFormData({
          transferId: result.data.transferId || '',
          amount: result.data.amount || '',
          senderName: result.data.senderName || '',
          transferDate: result.data.transferDate || '',
          notes: result.data.notes || ''
        })
        setShowEditModal(true)
      } else {
        toast.error('Failed to load request details')
      }
    } catch (error) {
      toast.error('Error loading request')
    }
  }

  const handleSaveEdit = async () => {
    if (!editingRequest) return
    try {
      const result = await updatePaymentRequest(editingRequest.id, {
        transferId: editFormData.transferId,
        amount: parseFloat(editFormData.amount),
        senderName: editFormData.senderName,
        transferDate: editFormData.transferDate,
        notes: editFormData.notes
      })
      if (result.success) {
        toast.success('Payment request updated successfully!')
        setShowEditModal(false)
        setEditingRequest(null)
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error) {
      toast.error('Error updating request')
    }
  }

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this payment request? This action cannot be undone.')) return
    try {
      const result = await deletePaymentRequest(requestId)
      if (result.success) {
        toast.success('Payment request deleted successfully!')
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error) {
      toast.error('Error deleting request')
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      const result = await updatePaymentRequestStatus(requestId, 'approved', '')
      if (result.success) {
        toast.success('Payment request approved! User now has access to the course.')
        setShowRequestModal(false)
        setSelectedRequest(null)
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleRejectRequest = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    try {
      const result = await updatePaymentRequestStatus(requestId, 'rejected', rejectionReason)
      if (result.success) {
        toast.success('Payment request rejected.')
        setShowRequestModal(false)
        setSelectedRequest(null)
        setRejectionReason('')
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleBulkAction = async (action) => {
    const ids = Array.from(selectedRequests)
    if (ids.length === 0) {
      toast.error('No requests selected')
      return
    }
    if (action === 'approve') {
      if (!window.confirm(`Approve ${ids.length} request(s)?`)) return
      try {
        const result = await bulkUpdatePaymentRequestStatus(ids, 'approved', '')
        if (result.success) {
          toast.success(`${ids.length} request(s) approved!`)
          setSelectedRequests(new Set())
        } else {
          toast.error('Some requests failed')
        }
      } catch (error) {
        toast.error('Error: ' + error.message)
      }
    } else if (action === 'reject') {
      const reason = prompt('Enter rejection reason for selected requests:')
      if (!reason) return
      if (!window.confirm(`Reject ${ids.length} request(s)?`)) return
      try {
        const result = await bulkUpdatePaymentRequestStatus(ids, 'rejected', reason)
        if (result.success) {
          toast.success(`${ids.length} request(s) rejected!`)
          setSelectedRequests(new Set())
        } else {
          toast.error('Some requests failed')
        }
      } catch (error) {
        toast.error('Error: ' + error.message)
      }
    }
  }

  const toggleSelectRequest = (id) => {
    const newSet = new Set(selectedRequests)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedRequests(newSet)
    setShowBulkActions(newSet.size > 0)
  }

  const toggleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedRequests(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedRequests(new Set(filteredRequests.map(r => r.id)))
      setShowBulkActions(true)
    }
  }

  const handleSaveAccountDetails = async (e) => {
    e.preventDefault()
    try {
      await updatePaymentAccountDetails(accountForm)
      setAccountDetails(accountForm)
      setShowAccountModal(false)
      toast.success('Account details saved successfully!')
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const filteredRequests = useMemo(() => {
    let filtered = [...paymentRequests]
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.userName?.toLowerCase().includes(term) ||
        r.userEmail?.toLowerCase().includes(term) ||
        r.courseName?.toLowerCase().includes(term) ||
        r.transferId?.toLowerCase().includes(term) ||
        r.invoiceId?.toLowerCase().includes(term) ||
        r.senderName?.toLowerCase().includes(term)
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }
    
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      filtered = filtered.filter(r => new Date(r.createdAt) >= cutoff)
    }
    
    return filtered
  }, [paymentRequests, searchTerm, statusFilter, dateFilter])

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRequests.slice(start, start + itemsPerPage)
  }, [filteredRequests, currentPage])

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

  const exportToCSV = () => {
    try {
      const rows = [
        ['ID', 'Invoice ID', 'User Name', 'User Email', 'Course', 'Amount', 'Transfer ID', 'Sender Name', 'Transfer Date', 'Status', 'Created', 'Processed By', 'Admin Notes']
      ]
      filteredRequests.forEach(r => {
        rows.push([
          r.id,
          r.invoiceId || '',
          r.userName || '',
          r.userEmail || '',
          r.courseName || '',
          r.amount || 0,
          r.transferId || '',
          r.senderName || '',
          r.transferDate || '',
          r.status,
          new Date(r.createdAt).toLocaleString(),
          r.processedBy || '',
          r.adminNotes || ''
        ])
      })
      const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payment-requests-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exported successfully')
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const stats = {
    total: paymentRequests.length,
    pending: paymentRequests.filter(r => r.status === 'pending').length,
    approved: paymentRequests.filter(r => r.status === 'approved').length,
    rejected: paymentRequests.filter(r => r.status === 'rejected').length,
    totalAmount: paymentRequests.reduce((sum, r) => sum + (r.amount || r.coursePrice || 0), 0)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading payments...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8 text-[#FFD700]" />
              Payments Management
            </h1>
            <p className="text-sm md:text-base text-gray-400">Manage payment requests, approvals, and account details</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-xl text-green-400 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit Account
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border border-indigo-600/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Total Requests</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-indigo-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border border-yellow-600/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border border-lime-600/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Approved</p>
                <p className="text-2xl font-bold text-lime-400">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-lime-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border border-red-600/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border border-lime-400/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Total Amount</p>
                <p className="text-xl font-bold text-lime-400">Rs. {stats.totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-lime-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#1a1a1a] border border-indigo-600/20 rounded-xl p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, course, transfer ID..."
                className="w-full pl-9 pr-4 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-sm focus:border-lime-400 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-sm focus:border-lime-400"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-sm focus:border-lime-400"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="bg-indigo-600/10 border border-indigo-600/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-white text-sm">{selectedRequests.size} request(s) selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1.5 bg-lime-600/20 hover:bg-lime-600/30 text-lime-400 rounded-lg text-sm transition-all"
              >
                Approve Selected
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-all"
              >
                Reject Selected
              </button>
              <button
                onClick={() => { setSelectedRequests(new Set()); setShowBulkActions(false) }}
                className="px-3 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-lg text-sm transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Payment Requests Table */}
        <div className="bg-[#1a1a1a] border border-indigo-600/20 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-black/50 border-b border-indigo-600/20">
                <tr>
                  <th className="px-3 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-indigo-600/30 bg-black text-lime-400 focus:ring-lime-400"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-white">User</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-white hidden md:table-cell">Course</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-white hidden lg:table-cell">Transfer ID</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-white">Amount</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-white hidden xl:table-cell">Date</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-600/10">
                {paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-black/30 transition-colors group">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(request.id)}
                        onChange={() => toggleSelectRequest(request.id)}
                        className="w-4 h-4 rounded border-indigo-600/30 bg-black text-lime-400"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{request.userName || 'Unknown User'}</p>
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {request.userEmail || request.userId?.substring(0, 15)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <p className="text-white text-sm">{request.courseName || request.courseTitle || 'N/A'}</p>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="text-gray-300 font-mono text-xs">{request.transferId || 'N/A'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-lime-400 font-bold text-sm">Rs. {(request.amount || request.coursePrice || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell text-gray-400 text-xs">
                      {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
                        request.status === 'approved'
                          ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30'
                          : request.status === 'rejected'
                          ? 'bg-red-400/20 text-red-400 border border-red-400/30'
                          : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                      }`}>
                        {request.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="p-1.5 bg-lime-400/20 hover:bg-lime-400/30 rounded-lg text-lime-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleEditRequest(request.id)}
                          className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg text-indigo-400 transition-colors"
                          title="Edit Request"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-1.5 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-indigo-600/20">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-black/50 rounded-lg disabled:opacity-50 hover:bg-indigo-600/20 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-black/50 rounded-lg disabled:opacity-50 hover:bg-indigo-600/20 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Account Details Modal */}
        <Modal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} title="Edit Payment Account Details">
          <form onSubmit={handleSaveAccountDetails} className="space-y-4">
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">Bank Name</label><input type="text" value={accountForm.bankName} onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">Account Title</label><input type="text" value={accountForm.accountTitle} onChange={(e) => setAccountForm({ ...accountForm, accountTitle: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">IBAN</label><input type="text" value={accountForm.iban} onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">Account Number</label><input type="text" value={accountForm.accountNumber} onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">EasyPaisa Number</label><input type="text" value={accountForm.easypaisa} onChange={(e) => setAccountForm({ ...accountForm, easypaisa: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">JazzCash Number</label><input type="text" value={accountForm.jazzcash} onChange={(e) => setAccountForm({ ...accountForm, jazzcash: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
            <div><label className="block text-sm font-semibold text-gray-300 mb-2">WhatsApp Number</label><input type="text" value={accountForm.whatsapp} onChange={(e) => setAccountForm({ ...accountForm, whatsapp: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAccountModal(false)} className="flex-1 px-4 py-3 bg-gray-700 rounded-xl">Cancel</button><button type="submit" className="flex-1 px-4 py-3 bg-lime-400 text-black font-bold rounded-xl">Save</button></div>
          </form>
        </Modal>

        {/* Payment Request Details Modal - Enhanced User Details */}
        <Modal isOpen={showRequestModal} onClose={() => { setShowRequestModal(false); setSelectedRequest(null); setRejectionReason('') }} title="Payment Request Details" size="large">
          {selectedRequest && (
            <div className="space-y-6">
              {/* User Information Card */}
              <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/10 rounded-xl p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{selectedRequest.userName || 'Unknown User'}</h3>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="flex items-center gap-1 text-gray-300"><Mail className="w-4 h-4" />{selectedRequest.userEmail || 'No email'}</span>
                      <span className="flex items-center gap-1 text-gray-300"><Calendar className="w-4 h-4" />Joined: {selectedRequest.userCreatedAt ? new Date(selectedRequest.userCreatedAt).toLocaleDateString() : 'N/A'}</span>
                      <span className="flex items-center gap-1 text-gray-300"><Shield className="w-4 h-4" />Role: {selectedRequest.userRole || 'user'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedRequest.status === 'approved' && (
                      <button
                        onClick={() => handleRevokeCourseAccess(selectedRequest.userId, selectedRequest.courseId, selectedRequest.userName)}
                        className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg text-sm flex items-center gap-1"
                      >
                        <Lock className="w-4 h-4" /> Revoke
                      </button>
                    )}
                    <button
                      onClick={() => handleEditRequest(selectedRequest.id)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(selectedRequest.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="bg-black/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-lime-400" />Course Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-gray-400 text-sm">Course Name</p><p className="text-white font-medium">{selectedRequest.courseName || selectedRequest.courseTitle || 'N/A'}</p></div>
                  <div><p className="text-gray-400 text-sm">Price</p><p className="text-lime-400 font-bold text-xl">{selectedRequest.currency || 'PKR'} {(selectedRequest.amount || selectedRequest.coursePrice || 0).toLocaleString()}</p></div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-black/50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5 text-yellow-400" />Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-gray-400 text-sm">Invoice ID</p><p className="text-white font-mono">{selectedRequest.invoiceId || 'N/A'}</p></div>
                  <div><p className="text-gray-400 text-sm">Transfer ID</p><p className="text-white font-mono">{selectedRequest.transferId || 'N/A'}</p></div>
                  <div><p className="text-gray-400 text-sm">Sender Name</p><p className="text-white">{selectedRequest.senderName || 'N/A'}</p></div>
                  <div><p className="text-gray-400 text-sm">Transfer Date</p><p className="text-white">{selectedRequest.transferDate ? new Date(selectedRequest.transferDate).toLocaleDateString() : 'N/A'}</p></div>
                  <div><p className="text-gray-400 text-sm">Request Created</p><p className="text-white">{new Date(selectedRequest.createdAt).toLocaleString()}</p></div>
                  {selectedRequest.processedAt && (
                    <div><p className="text-gray-400 text-sm">Processed At</p><p className="text-white">{new Date(selectedRequest.processedAt).toLocaleString()}</p></div>
                  )}
                  {selectedRequest.processedBy && (
                    <div><p className="text-gray-400 text-sm">Processed By</p><p className="text-white font-mono text-sm">{selectedRequest.processedBy.substring(0, 15)}...</p></div>
                  )}
                </div>
                {selectedRequest.notes && (
                  <div className="mt-3 pt-3 border-t border-indigo-600/20">
                    <p className="text-gray-400 text-sm">Additional Notes</p>
                    <p className="text-white mt-1">{selectedRequest.notes}</p>
                  </div>
                )}
                {selectedRequest.adminNotes && (
                  <div className="mt-3 pt-3 border-t border-indigo-600/20">
                    <p className="text-gray-400 text-sm">Admin Notes</p>
                    <p className="text-white mt-1">{selectedRequest.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-4 pt-4 border-t border-indigo-600/20">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Rejection Reason (if rejecting)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white focus:border-lime-400 resize-none"
                      placeholder="Enter reason for rejection (optional)"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleRejectRequest(selectedRequest.id)} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all">Reject Request</button>
                    <button onClick={() => handleApproveRequest(selectedRequest.id)} className="flex-1 px-4 py-3 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-xl transition-all">Approve & Grant Access</button>
                  </div>
                </div>
              )}

              {selectedRequest.status !== 'pending' && (
                <div className="pt-4 border-t border-indigo-600/20 text-center text-gray-400">
                  This request has been {selectedRequest.status}
                  {selectedRequest.processedBy && <span className="block text-xs mt-1">Processed by: {selectedRequest.processedBy?.substring(0, 15)}...</span>}
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Edit Request Modal */}
        <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingRequest(null) }} title="Edit Payment Request" size="medium">
          {editingRequest && (
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-300">Transfer ID</label><input type="text" value={editFormData.transferId} onChange={(e) => setEditFormData({ ...editFormData, transferId: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
              <div><label className="block text-sm font-semibold text-gray-300">Amount (Rs.)</label><input type="number" value={editFormData.amount} onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
              <div><label className="block text-sm font-semibold text-gray-300">Sender Name</label><input type="text" value={editFormData.senderName} onChange={(e) => setEditFormData({ ...editFormData, senderName: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
              <div><label className="block text-sm font-semibold text-gray-300">Transfer Date</label><input type="date" value={editFormData.transferDate} onChange={(e) => setEditFormData({ ...editFormData, transferDate: e.target.value })} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
              <div><label className="block text-sm font-semibold text-gray-300">Notes</label><textarea value={editFormData.notes} onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })} rows={3} className="w-full px-4 py-3 bg-black border border-indigo-600/30 rounded-xl text-white" /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowEditModal(false); setEditingRequest(null) }} className="flex-1 px-4 py-3 bg-gray-700 rounded-xl">Cancel</button>
                <button onClick={handleSaveEdit} className="flex-1 px-4 py-3 bg-lime-400 text-black font-bold rounded-xl">Save Changes</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  )
}

export default PaymentsManagement
