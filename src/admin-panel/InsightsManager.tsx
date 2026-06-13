import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from './components/AdminLayout'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { ref, get, remove } from 'firebase/database'
import { database } from '../config/firebase'
import {
  watchAllInsights,
  createInsight,
  updateInsight,
  deleteInsight,
  getSponsoredSettingsPost,
  updateSponsoredSettingsPost
} from '../services/admin/InsightsManager'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Image as ImageIcon,
  Save,
  X,
  Clock,
  TrendingUp,
  Heart,
  MessageSquare,
  Share2,
  Search,
  Filter,
  Download,
  MoreVertical,
  User,
  Settings,
  BarChart3,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'
import { toast } from '../components/Toast'
import Avatar from '../components/Avatar'

const InsightsManager = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sponsoredInterval, setSponsoredInterval] = useState(3)
  const [showSponsoredModal, setShowSponsoredModal] = useState(false)

  const [activeTabSection, setActiveTabSection] = useState<'posts' | 'comments'>('posts')
  const [commentsSearchQuery, setCommentsSearchQuery] = useState('')

  const allComments = useMemo(() => {
    const list: any[] = []
    posts.forEach((post) => {
      if (post.comments) {
        Object.entries(post.comments).forEach(([commentId, comment]: [string, any]) => {
          list.push({
            id: commentId,
            postId: post.id,
            postTitle: post.title,
            ...comment
          })
        })
      }
    })
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    return list
  }, [posts])

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await remove(ref(database, `aiInsights/${postId}/comments/${commentId}`))
        toast.success("Comment deleted successfully!")
      } catch (err: any) {
        toast.error("Failed to delete comment: " + err.message)
      }
    }
  }

  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [selectedPostForTracking, setSelectedPostForTracking] = useState<any>(null)
  const [trackingLogs, setTrackingLogs] = useState<any[]>([])
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [trackingSearchTerm, setTrackingSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    visibility: 'public',
    scheduledAt: '',
    sponsored: false,
    sponsoredUrl: '',
    sponsoredCTA: '',
    category: 'AI Updates',
    initialLikeCount: 0,
    initialCommentCount: 0,
    initialShareCount: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string>('')

  const handleOpenTrackingLogs = async (post: any) => {
    setSelectedPostForTracking(post)
    setShowTrackingModal(true)
    setLoadingTracking(true)
    setTrackingLogs([])
    try {
      const viewsRef = ref(database, `aiInsights/${post.id}/views`)
      const viewsSnap = await get(viewsRef)
      if (viewsSnap.exists()) {
        const viewsData = viewsSnap.val()
        const uidsList = Object.keys(viewsData)
        
        const usersSnap = await get(ref(database, 'users'))
        const allUsers = usersSnap.val() || {}
        
        const logs = uidsList.map((uid) => {
          const userObj = allUsers[uid] || {}
          const profile = userObj.profile || {}
          return {
            uid,
            userName: profile.name || userObj.displayName || 'Anonymous Learner',
            userEmail: profile.email || userObj.email || 'no-email@skillcame.com',
            userAvatar: profile.avatar || userObj.photoURL || '',
            timestamp: viewsData[uid]?.timestamp || new Date().toISOString()
          }
        })
        
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setTrackingLogs(logs)
      }
    } catch (err: any) {
      toast.error('Failed to load tracking logs: ' + err.message)
    } finally {
      setLoadingTracking(false)
    }
  }

  // Watch all insights in real-time
  useEffect(() => {
    const unsubscribe = watchAllInsights((postsData) => {
      setPosts(postsData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Fetch sponsored interval
  useEffect(() => {
    getSponsoredSettingsPost().then(result => {
      if (result.success && result.data) {
        setSponsoredInterval(result.data.adInterval || 3)
      }
    })
  }, [])

  // Handle image URL change
  useEffect(() => {
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl)
    } else {
      setImagePreview('')
    }
  }, [formData.imageUrl])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (formData.imageUrl && !isValidImageUrl(formData.imageUrl)) newErrors.imageUrl = 'Please enter a valid image URL'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidImageUrl = (url: string) => {
    if (!url) return true
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setFormData((prev) => ({ ...prev, imageUrl: base64String }))
      setImagePreview(base64String)
    }
    reader.onerror = () => toast.error('Failed to read image file')
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      const postData = {
        ...formData,
        scheduledAt: formData.scheduledAt || null,
        initialLikeCount: parseInt(formData.initialLikeCount.toString()) || 0,
        initialCommentCount: parseInt(formData.initialCommentCount.toString()) || 0,
        initialShareCount: parseInt(formData.initialShareCount.toString()) || 0,
        createdBy: user?.uid || 'admin'
      }
      if (editingPost) {
        const result = await updateInsight(editingPost.id, postData)
        if (result.success) {
          toast.success('Insight updated successfully!')
          handleCloseModal()
        } else {
          toast.error(result.error || 'Failed to update insight')
        }
      } else {
        const result = await createInsight(postData)
        if (result.success) {
          toast.success('Insight created successfully!')
          handleCloseModal()
        } else {
          toast.error(result.error || 'Failed to create insight')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    }
  }

  const handleEdit = (post: any) => {
    setEditingPost(post)
    setFormData({
      title: post.title || '',
      description: post.description || '',
      imageUrl: post.imageUrl || '',
      visibility: post.visibility || 'public',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      sponsored: post.sponsored || false,
      sponsoredUrl: post.sponsoredUrl || '',
      sponsoredCTA: post.sponsoredCTA || '',
      category: post.category || 'AI Updates',
      initialLikeCount: post.likeCount || 0,
      initialCommentCount: post.commentCount || 0,
      initialShareCount: post.shareCount || 0
    })
    setImagePreview(post.imageUrl || '')
    setShowModal(true)
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this insight? This action cannot be undone.')) return
    try {
      const result = await deleteInsight(postId)
      if (result.success) {
        toast.success('Insight deleted successfully!')
      } else {
        toast.error(result.error || 'Failed to delete insight')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    }
  }

  const handleToggleVisibility = async (post: any) => {
    try {
      const newVisibility = post.visibility === 'public' ? 'hidden' : 'public'
      const result = await updateInsight(post.id, { visibility: newVisibility })
      if (result.success) {
        toast.success(`Insight ${newVisibility === 'public' ? 'published' : 'hidden'} successfully!`)
      } else {
        toast.error(result.error || 'Failed to update visibility')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPost(null)
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      visibility: 'public',
      scheduledAt: '',
      sponsored: false,
      sponsoredUrl: '',
      sponsoredCTA: '',
      category: 'AI Updates',
      initialLikeCount: 0,
      initialCommentCount: 0,
      initialShareCount: 0
    })
    setImagePreview('')
    setErrors({})
  }

  const handleUpdateSponsoredInterval = async () => {
    try {
      const result = await updateSponsoredSettingsPost({ adsEnabled: true, adInterval: sponsoredInterval })
      if (result.success) {
        toast.success('Sponsored interval updated!')
        setShowSponsoredModal(false)
      } else {
        toast.error(result.error || 'Failed to update interval')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getPostStatus = (post: any) => {
    const now = Date.now()
    if (post.visibility === 'hidden') return { text: 'Hidden', color: 'text-red-400', bg: 'bg-red-500/20' }
    if (post.scheduledAt && new Date(post.scheduledAt).getTime() > now) return { text: 'Scheduled', color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
    return { text: 'Live', color: 'text-lime-400', bg: 'bg-lime-500/20' }
  }

  const filteredPosts = useMemo(() => {
    let filtered = [...posts]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => p.title?.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query))
    }
    if (filterStatus !== 'all') {
      const now = Date.now()
      filtered = filtered.filter(p => {
        if (filterStatus === 'hidden') return p.visibility === 'hidden'
        if (filterStatus === 'scheduled') return p.scheduledAt && new Date(p.scheduledAt).getTime() > now
        if (filterStatus === 'live') return p.visibility === 'public' && (!p.scheduledAt || new Date(p.scheduledAt).getTime() <= now)
        return true
      })
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'likes': return (b.likesCount || 0) - (a.likesCount || 0)
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    return filtered
  }, [posts, searchQuery, filterStatus, sortBy])

  const stats = useMemo(() => {
    const now = Date.now()
    return {
      total: posts.length,
      live: posts.filter(p => p.visibility === 'public' && (!p.scheduledAt || new Date(p.scheduledAt).getTime() <= now)).length,
      hidden: posts.filter(p => p.visibility === 'hidden').length,
      scheduled: posts.filter(p => p.scheduledAt && new Date(p.scheduledAt).getTime() > now).length,
      totalLikes: posts.reduce((sum, p) => sum + (p.likesCount || 0), 0),
      totalComments: posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0),
      totalShares: posts.reduce((sum, p) => sum + (p.sharesCount || 0), 0)
    }
  }, [posts])

  return (
    <AdminLayout>
      <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center space-x-2 sm:space-x-3">
              <span className="bg-gradient-to-r from-indigo-600 to-lime-500 bg-clip-text text-transparent">Insights Manager</span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-1">Create, edit, and manage learning insights & updates</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSponsoredModal(true)}
              className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded-lg text-purple-400 text-sm flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Sponsor Interval: {sponsoredInterval}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-indigo-600 hover:bg-lime-500 text-white font-semibold rounded-lg md:rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-indigo-600/30 hover:scale-105 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Create Insight</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-lg p-2 sm:p-3 md:p-4"><p className="text-gray-400 text-xs sm:text-sm mb-1">Total</p><p className="text-white font-bold text-lg sm:text-xl md:text-2xl">{stats.total}</p></div>
          <div className="bg-[#1a1a1a] border-2 border-lime-500/20 rounded-lg p-2 sm:p-3 md:p-4"><p className="text-gray-400 text-xs sm:text-sm mb-1">Live</p><p className="text-lime-400 font-bold text-lg sm:text-xl md:text-2xl">{stats.live}</p></div>
          <div className="bg-[#1a1a1a] border-2 border-red-500/20 rounded-lg p-2 sm:p-3 md:p-4"><p className="text-gray-400 text-xs sm:text-sm mb-1">Hidden</p><p className="text-red-400 font-bold text-lg sm:text-xl md:text-2xl">{stats.hidden}</p></div>
          <div className="bg-[#1a1a1a] border-2 border-yellow-500/20 rounded-lg p-2 sm:p-3 md:p-4"><p className="text-gray-400 text-xs sm:text-sm mb-1">Scheduled</p><p className="text-yellow-400 font-bold text-lg sm:text-xl md:text-2xl">{stats.scheduled}</p></div>
          <div className="bg-[#1a1a1a] border-2 border-red-500/20 rounded-lg p-2 sm:p-3 md:p-4"><p className="text-gray-400 text-xs sm:text-sm mb-1">Likes</p><p className="text-white font-bold text-lg sm:text-xl md:text-2xl">{stats.totalLikes}</p></div>
          <div className="bg-[#1a1a1a] border-2 border-indigo-500/20 rounded-lg p-2 sm:p-3 md:p-4"><p className="text-gray-400 text-xs sm:text-sm mb-1">Comments</p><p className="text-white font-bold text-lg sm:text-xl md:text-2xl">{stats.totalComments}</p></div>
          <div className="bg-[#1a1a1a] border-2 border-purple-500/20 rounded-lg p-2 sm:p-3 md:p-4"><p className="text-gray-400 text-xs sm:text-sm mb-1">Shares</p><p className="text-white font-bold text-lg sm:text-xl md:text-2xl">{stats.totalShares}</p></div>
        </div>

        {/* Switch Sub-Tabs Section */}
        <div className="flex border-b border-indigo-600/20 max-w-full overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTabSection('posts')}
            className={`px-5 py-3 font-semibold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTabSection === 'posts'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-600/10'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Insights Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTabSection('comments')}
            className={`px-5 py-3 font-semibold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTabSection === 'comments'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-600/10'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Comments Moderation & Feedback ({allComments.length})
          </button>
        </div>

        {activeTabSection === 'posts' ? (
          <>
            {/* Searching + Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-black/40 border border-indigo-600/20 rounded-xl p-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-indigo-600/30 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-lime-500"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black border border-indigo-600/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="all">All Status</option>
              <option value="live">Live</option>
              <option value="hidden">Hidden</option>
              <option value="scheduled">Scheduled</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black border border-indigo-600/30 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>

        {/* Grid List View */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-black/30 border border-indigo-600/10 rounded-2xl">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No learning insights found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const status = getPostStatus(post)
              return (
                <div key={post.id} className="bg-[#111] border-2 border-indigo-600/15 p-4 rounded-xl flex flex-col justify-between hover:border-indigo-600/30 transition-all">
                  <div>
                    {post.imageUrl && (
                      <img src={post.imageUrl} alt={post.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20">
                        {post.category || 'AI Updates'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{post.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">{post.description}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 py-2 border-t border-indigo-600/10 mb-3">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-400" /> {post.likesCount || 0}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> {post.commentsCount || 0}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5 text-purple-400" /> {post.sharesCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-500">
                        Edited {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenTrackingLogs(post)}
                          className="p-1.5 bg-[#FFD700]/10 hover:bg-[#FFD700]/25 rounded text-[#FFD700] border border-[#FFD700]/20"
                          title="View student activity tracking log"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(post)}
                          className="p-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 rounded text-indigo-400 border border-indigo-600/20"
                          title="Toggle visibility"
                        >
                          {post.visibility === 'public' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-1.5 bg-lime-400/10 hover:bg-lime-400/20 rounded text-lime-400 border border-lime-400/20"
                          title="Edit insight"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 bg-red-400/10 hover:bg-red-400/20 rounded text-red-400 border border-red-400/20"
                          title="Delete insight"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
          </>
        ) : (
          /* COMMENTS MODERATION TAB SECTION VIEW */
          <div className="space-y-4">
            {/* Search Bar for comments */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search comments by student name, email, or content..."
                value={commentsSearchQuery}
                onChange={(e) => setCommentsSearchQuery(e.target.value)}
                className="w-full bg-black border border-indigo-600/30 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Comments List */}
            <div className="bg-black/30 border border-indigo-600/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-indigo-600/10 border-b border-indigo-600/15 text-left">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-lime-400" />
                  <span>Discussion Stream Activity</span>
                </h3>
              </div>

              {(() => {
                const filteredComments = allComments.filter(comment => 
                  comment.userName?.toLowerCase().includes(commentsSearchQuery.toLowerCase()) ||
                  comment.body?.toLowerCase().includes(commentsSearchQuery.toLowerCase()) ||
                  comment.postTitle?.toLowerCase().includes(commentsSearchQuery.toLowerCase())
                );

                if (filteredComments.length === 0) {
                  return (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center justify-center">
                      <MessageSquare className="w-12 h-12 mb-3 text-gray-600 opacity-40" />
                      <p className="text-sm font-semibold">No comments match your moderation filter</p>
                      <p className="text-xs text-gray-500 mt-1">Ready to manage real-time user-generated student feedback.</p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-indigo-600/10">
                    {filteredComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 hover:bg-indigo-600/5 transition-all gap-4"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar
                            src={comment.userAvatar}
                            name={comment.userName}
                            className="w-10 h-10 border border-indigo-500/20 flex-shrink-0"
                          />
                          <div className="space-y-1 text-left min-w-0">
                            <div className="flex items-center flex-wrap gap-x-2">
                              <span className="text-xs font-extrabold text-white">{comment.userName}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 bg-black/40 border border-indigo-600/10 rounded-lg p-2.5 mt-1 block">
                              {comment.body}
                            </p>
                            <div className="text-[10px] text-gray-500 max-w-full truncate">
                              Posted on: <span className="text-indigo-400 font-semibold italic">"{comment.postTitle}"</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleDeleteComment(comment.postId, comment.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/25 rounded-lg text-xs font-extrabold transition-all duration-200"
                            title="Delete this comment from discussion stream"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#161616] border-2 border-indigo-600/30 rounded-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-indigo-600/10">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-lime-400" />
                  <span>{editingPost ? 'Edit Insight Post' : 'Create Live Insight Post'}</span>
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white p-1 hover:bg-neutral-800 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-indigo-600/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500"
                    placeholder="Enter insight title..."
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-indigo-600/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 font-semibold"
                  >
                    <option value="AI Updates">AI Updates</option>
                    <option value="Deep Learning">Deep Learning</option>
                    <option value="Industry News">Industry News</option>
                    <option value="Skill Expansion">Skill Expansion</option>
                    <option value="Tutorial Tips">Tutorial Tips</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Description / Body Content</label>
                  <textarea
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-indigo-600/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 resize-none"
                    placeholder="Enter full body content..."
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1 font-semibold">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Banner Image URL (Base64 or Link)</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full bg-black border border-indigo-600/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500"
                    placeholder="https://images.unsplash.com/your-image"
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500">Or host/upload file:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-indigo-400 file:bg-indigo-600/10 file:border-indigo-600/20 file:text-indigo-400 file:rounded file:px-2 file:py-1 file:mr-2"
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-indigo-600/20">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full text-red-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">Visibility</label>
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-indigo-600/30 rounded-xl px-4 py-3 text-white focus:outline-none"
                    >
                      <option value="public">Live (Public)</option>
                      <option value="hidden">Draft (Hidden)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">Scheduled Publish (Optional)</label>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleInputChange}
                      className="w-full bg-black border border-indigo-600/30 rounded-xl px-4 py-3 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="py-2.5 border-t border-indigo-600/10 flex flex-col gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.sponsored}
                      onChange={(e) => setFormData(prev => ({ ...prev, sponsored: e.target.checked }))}
                      className="rounded border-indigo-600/30 bg-black text-indigo-600 focus:ring-lime-500 w-4 h-4"
                    />
                    <span>Mark as Sponsored Content</span>
                  </label>

                  {formData.sponsored && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-indigo-950/20 rounded-xl border border-indigo-600/10 mt-1">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">Sponsored CTA Target URL</label>
                        <input
                          type="text"
                          name="sponsoredUrl"
                          value={formData.sponsoredUrl || ''}
                          onChange={handleInputChange}
                          placeholder="https://example.com/payment-or-course"
                          className="w-full bg-black border border-indigo-600/30 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-indigo-400 mb-1">Sponsored CTA Label</label>
                        <input
                          type="text"
                          name="sponsoredCTA"
                          value={formData.sponsoredCTA || ''}
                          onChange={handleInputChange}
                          placeholder="e.g. Enroll Now - 20% Off"
                          className="w-full bg-black border border-indigo-600/30 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-indigo-600/10">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-neutral-900 border border-indigo-600/20 text-gray-300 hover:text-white rounded-lg text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-lime-500 font-bold text-white rounded-lg text-sm shadow-md"
                  >
                    Save changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sponsored Modal Setup */}
        {showSponsoredModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="bg-[#161616] border-2 border-indigo-600/30 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Sponsorship Settings</h3>
                <button onClick={() => setShowSponsoredModal(false)} className="text-gray-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Sponsored Post Block Interval</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={sponsoredInterval}
                    onChange={(e) => setSponsoredInterval(parseInt(e.target.value) || 3)}
                    className="w-full bg-black border border-indigo-600/30 rounded-xl px-4 py-3 text-white focus:outline-none"
                    placeholder="e.g. 5 (shows an ad every 5 insights)"
                  />
                  <p className="text-xs text-gray-500 mt-2">Determines how many organic posts separate sponsored suggestions in the learning feed.</p>
                </div>
                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setShowSponsoredModal(false)}
                    className="px-3 py-1.5 bg-neutral-950 text-gray-400 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateSponsoredInterval}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-lime-500 text-white rounded-lg text-xs font-bold"
                  >
                    Update Interval
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Tracking Logs Modal */}
        {showTrackingModal && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#161616] border-2 border-indigo-600/30 rounded-2xl w-full max-w-xl p-6 relative overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-600/10">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#FFD700]" />
                    <span>Learning Activity Tracking</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Post: <span className="text-[#FFD700] font-semibold">"{selectedPostForTracking?.title}"</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="text-gray-400 hover:text-white p-1.5 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Viewer Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search student name or email..."
                  value={trackingSearchTerm}
                  onChange={(e) => setTrackingSearchTerm(e.target.value)}
                  className="w-full bg-black border border-indigo-600/30 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Viewers List */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[250px] pr-1">
                {loadingTracking ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
                    <span className="text-[11px] text-gray-450 font-mono tracking-wider">LOADING TELEMETRY LOGS...</span>
                  </div>
                ) : trackingLogs.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center">
                    <User className="w-10 h-10 mb-2 opacity-30 text-gray-400" />
                    <p className="text-xs">No view events recorded for this insight yet.</p>
                  </div>
                ) : (() => {
                  const filteredLogs = trackingLogs.filter(log => 
                    log.userName.toLowerCase().includes(trackingSearchTerm.toLowerCase()) ||
                    log.userEmail.toLowerCase().includes(trackingSearchTerm.toLowerCase())
                  );

                  if (filteredLogs.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <p className="text-xs">No student matches your search filter.</p>
                      </div>
                    );
                  }

                  return filteredLogs.map((log) => (
                    <div
                      key={log.uid}
                      className="flex items-center justify-between p-3 bg-black/40 border border-indigo-600/10 rounded-xl hover:border-indigo-600/25 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={log.userAvatar}
                          name={log.userName}
                          className="w-9 h-9 border border-indigo-500/20"
                        />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{log.userName}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/15 font-semibold">
                              Student
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400">{log.userEmail}</div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-1 items-end">
                        <span className="text-[9px] font-semibold text-lime-450 bg-lime-400/5 px-1.5 py-0.5 rounded border border-lime-400/10 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5 text-lime-450 inline" /> Viewed
                        </span>
                        <span className="text-[9px] font-mono text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-600/10 flex justify-end">
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="px-4 py-2 bg-neutral-900 border border-indigo-600/20 text-gray-400 hover:text-white rounded-lg text-xs font-semibold"
                >
                  Close Tracker
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default InsightsManager
