import React, { useState, useEffect, useMemo, useCallback } from 'react'
import AdminLayout from './components/AdminLayout'
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Filter,
  Settings,
  BarChart3,
  Copy,
  FileText,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  DollarSign,
  Clock,
  User,
  Tag,
  TrendingUp,
  GripVertical,
  Zap,
  Award,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import {
  createNewCourse,
  updateNewCourse,
  deleteNewCourse,
  watchNewCourses,
  watchCourseCategories,
  toggleCourseLock,
  toggleCourseVisibility,
  duplicateCourse,
  trackUserActivity
} from '../services/admin/CourseManager'
import { useAuth } from '../context/AuthContext'
import ImageUpload from '../components/ImageUpload'
import { generateAvatarDataURL } from '../utils/avatarGenerator'
import { generateSlug } from '../utils/slugify'
import { toast } from '../components/Toast'

const CourseManager = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    thumbnail: '',
    isFree: true,
    price: 0,
    currency: 'PKR',
    duration: '',
    instructor: '',
    category: '',
    difficulty: 'beginner',
    tags: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoOgImage: '',
    status: 'draft'
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const unsubscribeCourses = watchNewCourses((coursesData) => {
      setCourses(coursesData || [])
      setLoading(false)
    })
    
    const unsubscribeCategories = watchCourseCategories((categoriesData) => {
      setCategories(categoriesData || [])
    })

    return () => {
      unsubscribeCourses()
      unsubscribeCategories()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    
    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' })
      return
    }
    if (!formData.shortDescription.trim()) {
      setErrors({ shortDescription: 'Short description is required' })
      return
    }
    if (!formData.isFree && (!formData.price || formData.price <= 0)) {
      setErrors({ price: 'Price is required for paid courses' })
      return
    }

    try {
      const courseData = {
        ...formData,
        price: formData.isFree ? 0 : parseFloat(formData.price),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }

      if (!editingCourse) {
        const existingSlugs = courses.map(c => c.slug).filter(Boolean)
        courseData.slug = generateSlug(formData.title, existingSlugs)
      } else if (editingCourse.title !== formData.title) {
        const otherSlugs = courses.filter(c => c.id !== editingCourse.id).map(c => c.slug).filter(Boolean)
        courseData.slug = generateSlug(formData.title, otherSlugs)
      }

      if (editingCourse) {
        const result = await updateNewCourse(editingCourse.id, courseData)
        if (result.success) {
          toast.success('Course updated successfully!')
          setShowModal(false)
          resetForm()
          await trackUserActivity(user?.uid, 'update_course', { courseId: editingCourse.id })
        } else {
          setErrors({ submit: result.error || 'Error updating course' })
        }
      } else {
        const result = await createNewCourse(courseData)
        if (result.success) {
          toast.success('Course created successfully!')
          setShowModal(false)
          resetForm()
          await trackUserActivity(user?.uid, 'create_course', { courseId: result.id })
        } else {
          setErrors({ submit: result.error || 'Error creating course' })
        }
      }
    } catch (error) {
      setErrors({ submit: error.message })
    }
  }

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all lessons. This action cannot be undone.')) return
    try {
      const result = await deleteNewCourse(courseId)
      if (result.success) {
        toast.success('Course deleted successfully!')
        await trackUserActivity(user?.uid, 'delete_course', { courseId })
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleLock = async (courseId, currentLocked) => {
    try {
      await toggleCourseLock(courseId, !currentLocked)
      toast.success(currentLocked ? 'Course unlocked' : 'Course locked')
      await trackUserActivity(user?.uid, currentLocked ? 'unlock_course' : 'lock_course', { courseId })
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleVisibility = async (courseId, currentHidden) => {
    try {
      await toggleCourseVisibility(courseId, !currentHidden)
      toast.success(currentHidden ? 'Course is now visible' : 'Course hidden')
      await trackUserActivity(user?.uid, currentHidden ? 'show_course' : 'hide_course', { courseId })
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const handleDuplicate = async (courseId) => {
    try {
      const result = await duplicateCourse(courseId)
      if (result.success) {
        toast.success('Course duplicated successfully!')
        await trackUserActivity(user?.uid, 'duplicate_course', { courseId, newCourseId: result.id })
      } else {
        toast.error('Error: ' + result.error)
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    }
  }

  const openEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title || '',
      shortDescription: course.shortDescription || '',
      fullDescription: course.fullDescription || '',
      thumbnail: course.thumbnail || '',
      isFree: course.price === 0 || course.isFree === true,
      price: course.price || 0,
      currency: course.currency || 'PKR',
      duration: course.duration || '',
      instructor: course.instructor || '',
      category: course.category || '',
      difficulty: course.difficulty || 'beginner',
      tags: course.tags ? course.tags.join(', ') : '',
      seoTitle: course.seoTitle || '',
      seoDescription: course.seoDescription || '',
      seoKeywords: course.seoKeywords || '',
      seoOgImage: course.seoOgImage || '',
      status: course.status || 'draft'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      shortDescription: '',
      fullDescription: '',
      thumbnail: '',
      isFree: true,
      price: 0,
      currency: 'PKR',
      duration: '',
      instructor: '',
      category: '',
      difficulty: 'beginner',
      tags: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      seoOgImage: '',
      status: 'draft'
    })
    setEditingCourse(null)
    setErrors({})
  }

  const handleManageLessons = (course) => {
    window.location.href = `/admin/lessons?courseId=${course.id}`
  }

  const filteredCourses = useMemo(() => {
    let filtered = courses
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(course => 
        course.title?.toLowerCase().includes(term) ||
        course.shortDescription?.toLowerCase().includes(term) ||
        course.instructor?.toLowerCase().includes(term)
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => {
        if (statusFilter === 'locked') return course.locked === true
        if (statusFilter === 'published') return course.status === 'published' && !course.hidden
        if (statusFilter === 'hidden') return course.hidden === true
        if (statusFilter === 'draft') return course.status === 'draft'
        return true
      })
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter)
    }
    return filtered
  }, [courses, searchTerm, statusFilter, categoryFilter])

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || 'Uncategorized'
  }

  const getStatusBadge = (course) => {
    if (course.locked) {
      return { bg: 'bg-yellow-600/20', text: 'text-yellow-400', border: 'border-yellow-600/30', label: 'Locked', icon: Lock }
    }
    if (course.hidden) {
      return { bg: 'bg-red-600/20', text: 'text-red-400', border: 'border-red-600/30', label: 'Hidden', icon: EyeOff }
    }
    if (course.status === 'published') {
      return { bg: 'bg-lime-600/20', text: 'text-lime-400', border: 'border-lime-600/30', label: 'Published', icon: CheckCircle }
    }
    return { bg: 'bg-gray-600/20', text: 'text-gray-400', border: 'border-gray-600/30', label: 'Draft', icon: FileText }
  }

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  return (
    <AdminLayout>
      <div className="p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-[#FFD700]" />
              <span>Course Manager</span>
            </h1>
            <p className="text-sm md:text-base text-gray-400">Create and manage courses (SEO slugs auto-generated)</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true) }}
            className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-[#FFD700] hover:bg-[#FFED4E] text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/30 hover:scale-105"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>Create Course</span>
          </button>
        </div>

        <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base placeholder-gray-500 focus:outline-none focus:border-[#FFD700] transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700] transition-all"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="hidden">Hidden</option>
              <option value="locked">Locked</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 md:px-4 py-2 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700] transition-all"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c.active !== false).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all') }}
              className="px-3 md:px-4 py-2 md:py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-xl text-indigo-400 flex items-center justify-center gap-2 text-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading courses...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
            {filteredCourses.map((course) => {
              const statusBadge = getStatusBadge(course)
              const StatusIcon = statusBadge.icon
              const categoryName = getCategoryName(course.category)
              const isFree = course.price === 0 || course.isFree === true
              const courseThumbnail = course.thumbnail || generateAvatarDataURL(course.title || 'Course', 400)
              
              return (
                <div
                  key={course.id}
                  className="group bg-gradient-to-br from-[#1a1a1a] to-black/50 border-2 border-indigo-600/20 rounded-2xl overflow-hidden hover:border-[#FFD700]/50 transition-all duration-300 backdrop-blur-sm relative"
                >
                  <div className="relative h-36 md:h-44 overflow-hidden bg-black/50">
                    <img
                      src={courseThumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.src = generateAvatarDataURL(course.title || 'Course', 400) }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border} backdrop-blur-sm`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusBadge.label}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-black/70 backdrop-blur-sm border border-indigo-600/30">
                      {isFree ? (
                        <span className="flex items-center gap-1 text-green-400"><Sparkles className="w-3 h-3" />Free</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#FFD700]"><DollarSign className="w-3 h-3" />{course.currency || 'PKR'} {course.price}</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {course.difficulty && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-600/20 text-purple-400 border border-purple-600/30 capitalize flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" />
                          {course.difficulty}
                        </span>
                      )}
                      {categoryName && categoryName !== 'Uncategorized' && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {categoryName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-white mb-1 line-clamp-2 group-hover:text-[#FFD700] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400 line-clamp-2 mb-3">
                      {course.shortDescription}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-black/40 rounded-xl">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">Views</p>
                        <p className="text-sm md:text-base font-bold text-indigo-400">{formatNumber(course.views || 0)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">Enrollments</p>
                        <p className="text-sm md:text-base font-bold text-lime-400">{formatNumber(course.enrollments || 0)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-indigo-600/20">
                      <button
                        onClick={() => openEdit(course)}
                        className="flex-1 min-w-[60px] px-2 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-lg text-indigo-400 transition-all text-xs flex items-center justify-center gap-1"
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleManageLessons(course)}
                        className="px-2 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded-lg text-purple-400 transition-all"
                        title="Manage Lessons"
                      >
                        <FileText className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => window.location.href = `/admin/course-analytics?courseId=${course.id}`}
                        className="px-2 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-400 transition-all"
                        title="Analytics"
                      >
                        <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => handleLock(course.id, course.locked)}
                        className="px-2 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/30 rounded-lg text-yellow-400 transition-all"
                        title={course.locked ? 'Unlock' : 'Lock'}
                      >
                        {course.locked ? <Unlock className="w-3 h-3 md:w-4 md:h-4" /> : <Lock className="w-3 h-3 md:w-4 md:h-4" />}
                      </button>
                      <button
                        onClick={() => handleVisibility(course.id, course.hidden)}
                        className="px-2 py-1.5 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/30 rounded-lg text-gray-400 transition-all"
                        title={course.hidden ? 'Show' : 'Hide'}
                      >
                        {course.hidden ? <Eye className="w-3 h-3 md:w-4 md:h-4" /> : <EyeOff className="w-3 h-3 md:w-4 md:h-4" />}
                      </button>
                      <button
                        onClick={() => handleDuplicate(course.id)}
                        className="px-2 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-lg text-green-400 transition-all"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="px-2 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-red-400 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                    {course.slug && process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 text-[9px] text-gray-600 font-mono truncate">/{course.slug}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-12 md:p-16 text-center">
            <BookOpen className="w-16 h-16 md:w-20 md:h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">No courses found</h3>
            <p className="text-sm md:text-base text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first course to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
              <button
                onClick={() => { resetForm(); setShowModal(true) }}
                className="px-4 py-2 md:px-6 md:py-3 bg-[#FFD700] hover:bg-[#FFED4E] text-black font-bold rounded-xl transition-all"
              >
                Create Course
              </button>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 md:p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm() } }}>
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-4 md:p-6 lg:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar my-4">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">{editingCourse ? 'Edit Course' : 'Create Course'}</h2>
                <button onClick={() => { setShowModal(false); resetForm() }} className="text-gray-400 hover:text-white"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1">Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:border-[#FFD700]" placeholder="Course Title" maxLength={100} />{errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}</div>
                  <div className="md:col-span-2"><label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1">Short Description *</label><textarea value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:border-[#FFD700]" rows="2" placeholder="Brief description" maxLength={200} />{errors.shortDescription && <p className="mt-1 text-sm text-red-400">{errors.shortDescription}</p>}</div>
                  <div className="md:col-span-2"><label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1">Full Description</label><textarea value={formData.fullDescription} onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white focus:border-[#FFD700]" rows="4" placeholder="Detailed description" /></div>
                  <div className="md:col-span-2"><ImageUpload value={formData.thumbnail} onChange={(url) => setFormData({ ...formData, thumbnail: url })} label="Thumbnail Image" storagePath="courses/thumbnails" required={false} /></div>
                </div>
                <div className="border-t border-indigo-600/20 pt-4"><h3 className="text-base font-bold text-white mb-3">Pricing</h3><div className="space-y-3"><label className="flex items-center gap-2"><input type="radio" checked={formData.isFree} onChange={() => setFormData({ ...formData, isFree: true, price: 0 })} className="w-4 h-4 text-[#FFD700]" /><span className="text-gray-300">Free Course</span></label><label className="flex items-center gap-2"><input type="radio" checked={!formData.isFree} onChange={() => setFormData({ ...formData, isFree: false })} className="w-4 h-4 text-[#FFD700]" /><span className="text-gray-300">Paid Course</span></label>{!formData.isFree && (<div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-semibold text-gray-300">Price *</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" placeholder="0.00" min="0" step="0.01" />{errors.price && <p className="text-red-400 text-sm">{errors.price}</p>}</div><div><label className="block text-sm font-semibold text-gray-300">Currency</label><select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white"><option value="PKR">PKR</option><option value="USD">USD</option><option value="EUR">EUR</option></select></div></div>)}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-indigo-600/20 pt-4"><div><label className="block text-sm font-semibold text-gray-300">Duration Estimate</label><input type="text" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" placeholder="e.g., 6 hours" /></div><div><label className="block text-sm font-semibold text-gray-300">Instructor</label><input type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" placeholder="Instructor name" /></div><div><label className="block text-sm font-semibold text-gray-300">Difficulty</label><select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div><div><label className="block text-sm font-semibold text-gray-300">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white"><option value="draft">Draft</option><option value="published">Published</option><option value="hidden">Hidden</option></select></div><div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-300">Tags (comma-separated)</label><input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" placeholder="web, development, react" /></div></div>
                <div className="border-t border-indigo-600/20 pt-4"><h3 className="text-base font-bold text-white mb-3">SEO Settings</h3><div className="space-y-3"><div><label className="block text-sm font-semibold text-gray-300">SEO Title</label><input type="text" value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" maxLength={60} /></div><div><label className="block text-sm font-semibold text-gray-300">SEO Description</label><textarea value={formData.seoDescription} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" rows="2" maxLength={160} /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-semibold text-gray-300">SEO Keywords</label><input type="text" value={formData.seoKeywords} onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" /></div><div><label className="block text-sm font-semibold text-gray-300">OG Image URL</label><input type="url" value={formData.seoOgImage} onChange={(e) => setFormData({ ...formData, seoOgImage: e.target.value })} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-xl text-white" /></div></div></div></div>
                {errors.submit && <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400" /><p className="text-red-400 text-sm">{errors.submit}</p></div>}
                <div className="flex flex-col sm:flex-row gap-3 pt-4"><button type="button" onClick={() => { setShowModal(false); resetForm() }} className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold">Cancel</button><button type="submit" className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-[#FFD700] hover:bg-[#FFED4E] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FFD700]/30"><Save className="w-4 h-4 md:w-5 md:h-5" /><span>{editingCourse ? 'Update' : 'Create'} Course</span></button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default CourseManager
