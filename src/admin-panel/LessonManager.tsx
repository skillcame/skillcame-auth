import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminLayout from './components/AdminLayout'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Video,
  Image as ImageIcon,
  File,
  Link as LinkIcon,
  Eye,
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Search,
  BookOpen,
  AlertCircle,
  Upload,
  XCircle,
  CheckCircle
} from 'lucide-react'
import {
  watchNewCourses,
  watchLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  duplicateLesson,
  trackUserActivity
} from '../services/admin/LessonManager'
import { useAuth } from '../context/AuthContext'
import ImageUpload from '../components/ImageUpload'
import RichTextEditor from './components/RichTextEditor'
import { processUpload } from '../utils/uploadHelper'
import { generateSlug } from '../utils/slugify'

const LessonManager = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || '')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    contentType: 'video',
    videoLink: '',
    videoUpload: '',
    thumbnail: '',
    transcript: '',
    images: [],
    articleContent: '',
    fileLink: '',
    fileUpload: '',
    attachments: [],
    published: false,
    order: 0
  })
  const [errors, setErrors] = useState({})
  const [autoSaveTimer, setAutoSaveTimer] = useState(null)

  // Load courses
  useEffect(() => {
    const unsubscribeCourses = watchNewCourses((coursesData) => {
      setCourses(coursesData || [])
      setLoading(false)
      if (searchParams.get('courseId') && !selectedCourseId) {
        setSelectedCourseId(searchParams.get('courseId'))
      }
    })
    return () => unsubscribeCourses()
  }, [searchParams, selectedCourseId])

  // Load lessons for selected course
  useEffect(() => {
    if (selectedCourseId) {
      const unsubscribeLessons = watchLessons(selectedCourseId, (lessonsData) => {
        if (!Array.isArray(lessonsData)) {
          setLessons([])
          return
        }
        const sortedLessons = [...(lessonsData || [])].sort((a, b) => {
          const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999999
          const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999999
          if (orderA !== orderB) return orderA - orderB
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateA - dateB
        })
        setLessons(sortedLessons)
      })
      return () => unsubscribeLessons()
    } else {
      setLessons([])
    }
  }, [selectedCourseId])

  // Auto-save draft
  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    if (editingLesson && formData.title) {
      const timer = setTimeout(() => handleAutoSave(), 3000)
      setAutoSaveTimer(timer)
    }
    return () => { if (autoSaveTimer) clearTimeout(autoSaveTimer) }
  }, [formData, editingLesson])

  const handleAutoSave = async () => {
    if (!editingLesson || !selectedCourseId) return
    try {
      await updateLesson(selectedCourseId, editingLesson.id, {
        ...formData,
        autoSaved: true,
        autoSavedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' })
      return
    }
    if (!selectedCourseId) {
      setErrors({ course: 'Please select a course' })
      return
    }

    // Content type specific validation
    if (formData.contentType === 'video' && !formData.videoLink && !formData.videoUpload) {
      setErrors({ videoLink: 'Video link or upload is required' })
      return
    }
    if (formData.contentType === 'imageGallery' && formData.images.length === 0) {
      setErrors({ images: 'At least one image is required' })
      return
    }
    if (formData.contentType === 'article' && !formData.articleContent.trim()) {
      setErrors({ articleContent: 'Article content is required' })
      return
    }
    if (formData.contentType === 'file' && !formData.fileLink && !formData.fileUpload) {
      setErrors({ fileLink: 'File link or upload is required' })
      return
    }

    try {
      const lessonData = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : 0,
        order: editingLesson ? editingLesson.order : lessons.length,
        published: formData.published !== undefined ? formData.published : false,
        courseId: selectedCourseId
      }

      // Generate slug for new lessons, or update if title changed
      const existingLessonsInCourse = lessons.filter(l => !editingLesson || l.id !== editingLesson.id)
      const existingSlugs = existingLessonsInCourse.map(l => l.slug).filter(Boolean)
      
      if (!editingLesson) {
        lessonData.slug = generateSlug(formData.title, existingSlugs)
      } else if (editingLesson.title !== formData.title) {
        lessonData.slug = generateSlug(formData.title, existingSlugs)
      } else {
        lessonData.slug = editingLesson.slug // keep existing slug
      }

      if (editingLesson) {
        const result = await updateLesson(selectedCourseId, editingLesson.id, lessonData)
        if (result.success) {
          alert('Lesson updated successfully!')
          setShowModal(false)
          resetForm()
          await trackUserActivity(user?.uid, 'update_lesson', { courseId: selectedCourseId, lessonId: editingLesson.id })
        } else {
          setErrors({ submit: result.error || 'Error updating lesson' })
        }
      } else {
        const result = await createLesson(selectedCourseId, lessonData)
        if (result.success) {
          alert('Lesson created successfully!')
          setShowModal(false)
          resetForm()
          await trackUserActivity(user?.uid, 'create_lesson', { courseId: selectedCourseId, lessonId: result.id })
        } else {
          setErrors({ submit: result.error || 'Error creating lesson' })
        }
      }
    } catch (error) {
      setErrors({ submit: error.message })
    }
  }

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return
    try {
      const result = await deleteLesson(selectedCourseId, lessonId)
      if (result.success) {
        alert('Lesson deleted successfully!')
        await trackUserActivity(user?.uid, 'delete_lesson', { courseId: selectedCourseId, lessonId })
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleDuplicate = async (lessonId) => {
    try {
      const result = await duplicateLesson(selectedCourseId, lessonId)
      if (result.success) {
        alert('Lesson duplicated successfully!')
        await trackUserActivity(user?.uid, 'duplicate_lesson', { courseId: selectedCourseId, lessonId })
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleMove = async (lessonId, direction) => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId)
    if (currentIndex === -1) return
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= lessons.length) return
    const reordered = [...lessons]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(newIndex, 0, moved)
    const orders = reordered.map((lesson, index) => ({ lessonId: lesson.id, order: index }))
    try {
      await reorderLessons(selectedCourseId, orders)
      await trackUserActivity(user?.uid, 'reorder_lesson', { courseId: selectedCourseId, lessonId, direction })
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const openEdit = (lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      duration: lesson.duration || '',
      contentType: lesson.contentType || 'video',
      videoLink: lesson.videoLink || '',
      videoUpload: lesson.videoUpload || '',
      thumbnail: lesson.thumbnail || '',
      transcript: lesson.transcript || '',
      images: lesson.images || [],
      articleContent: lesson.articleContent || '',
      fileLink: lesson.fileLink || '',
      fileUpload: lesson.fileUpload || '',
      attachments: lesson.attachments || [],
      published: lesson.published !== undefined ? lesson.published : false,
      order: lesson.order || 0
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration: '',
      contentType: 'video',
      videoLink: '',
      videoUpload: '',
      thumbnail: '',
      transcript: '',
      images: [],
      articleContent: '',
      fileLink: '',
      fileUpload: '',
      attachments: [],
      published: false,
      order: 0
    })
    setEditingLesson(null)
    setErrors({})
  }

  const addImage = () => {
    setFormData({ ...formData, images: [...formData.images, { url: '', title: '', description: '' }] })
  }
  const updateImage = (index, field, value) => {
    const updated = [...formData.images]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, images: updated })
  }
  const removeImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })
  }
  const addAttachment = () => {
    setFormData({ ...formData, attachments: [...formData.attachments, { name: '', url: '' }] })
  }
  const updateAttachment = (index, field, value) => {
    const updated = [...formData.attachments]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, attachments: updated })
  }
  const removeAttachment = (index) => {
    setFormData({ ...formData, attachments: formData.attachments.filter((_, i) => i !== index) })
  }

  const getSelectedCourse = () => courses.find(c => c.id === selectedCourseId)

  return (
    <AdminLayout>
      <div className="p-3 md:p-4 lg:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center space-x-3">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-[#FFD700]" />
              <span>Lesson Manager</span>
            </h1>
            <p className="text-sm md:text-base text-gray-400">Manage course lessons (SEO slugs auto-generated)</p>
          </div>
          {selectedCourseId && (
            <button
              onClick={() => { resetForm(); setShowModal(true) }}
              className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-[#FFD700] hover:bg-[#FFED4E] text-black font-bold rounded-xl flex items-center justify-center space-x-2 text-sm md:text-base"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span>Add Lesson</span>
            </button>
          )}
        </div>

        {/* Course Selector */}
        <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-3 md:p-4">
          <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-2">Select Course *</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            <select
              value={selectedCourseId}
              onChange={(e) => { setSelectedCourseId(e.target.value); setSearchParams({ courseId: e.target.value }) }}
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          {errors.course && <p className="mt-1 text-xs md:text-sm text-red-400">{errors.course}</p>}
          {selectedCourseId && getSelectedCourse() && (
            <div className="mt-3 p-3 bg-black/50 rounded-xl">
              <p className="text-xs md:text-sm text-gray-400">Selected Course:</p>
              <p className="text-sm md:text-base font-semibold text-white">{getSelectedCourse().title}</p>
            </div>
          )}
        </div>

        {/* Lessons List */}
        {selectedCourseId ? (
          loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto mb-4"></div><p className="text-gray-400">Loading lessons...</p></div>
          ) : lessons.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {lessons.map((lesson, index) => {
                const contentTypeIcons = { video: Video, imageGallery: ImageIcon, article: FileText, file: File }
                const Icon = contentTypeIcons[lesson.contentType] || FileText
                return (
                  <div key={lesson.id} className="bg-gradient-to-br from-[#1a1a1a] to-black/50 border-2 border-indigo-600/20 rounded-2xl p-4 md:p-6 hover:border-[#FFD700]/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 md:space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0"><div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center"><Icon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /></div></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <h3 className="text-base md:text-lg font-bold text-white truncate">{lesson.title}</h3>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg ${lesson.published ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'}`}>
                              {lesson.published ? 'Published' : 'Draft'}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 capitalize">{lesson.contentType}</span>
                          </div>
                          {lesson.description && <p className="text-xs md:text-sm text-gray-400 line-clamp-2 mb-2">{lesson.description}</p>}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {lesson.duration && <span>Duration: {lesson.duration} min</span>}
                            <span>Order: {lesson.order + 1}</span>
                            {lesson.views > 0 && <span>Views: {lesson.views}</span>}
                            {lesson.slug && <span className="font-mono text-[10px]">Slug: {lesson.slug}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 ml-2">
                        <button onClick={() => handleMove(lesson.id, 'up')} disabled={index === 0} className="p-1.5 md:p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-400 disabled:opacity-50"><ArrowUp className="w-3 h-3 md:w-4 md:h-4" /></button>
                        <button onClick={() => handleMove(lesson.id, 'down')} disabled={index === lessons.length-1} className="p-1.5 md:p-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 rounded-lg text-blue-400 disabled:opacity-50"><ArrowDown className="w-3 h-3 md:w-4 md:h-4" /></button>
                        <button onClick={() => {
                          const courseSlug = getSelectedCourse()?.slug || selectedCourseId
                          const lessonSlug = lesson.slug || lesson.id
                          window.open(`/course/${courseSlug}/lesson/${lessonSlug}`, '_blank')
                        }} className="p-1.5 md:p-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-lg text-green-400"><Eye className="w-3 h-3 md:w-4 md:h-4" /></button>
                        <button onClick={() => openEdit(lesson)} className="p-1.5 md:p-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-lg text-indigo-400"><Edit className="w-3 h-3 md:w-4 md:h-4" /></button>
                        <button onClick={() => handleDuplicate(lesson.id)} className="p-1.5 md:p-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded-lg text-purple-400"><Copy className="w-3 h-3 md:w-4 md:h-4" /></button>
                        <button onClick={() => handleDelete(lesson.id)} className="p-1.5 md:p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-red-400"><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-8 md:p-12 text-center">
              <FileText className="w-16 h-16 md:w-20 md:h-20 text-gray-600 mx-auto mb-4 md:mb-6" />
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">No lessons found</h3>
              <p className="text-sm md:text-base text-gray-400 mb-4">Create your first lesson for this course</p>
              <button onClick={() => { resetForm(); setShowModal(true) }} className="px-4 py-2 md:px-6 md:py-3 bg-[#FFD700] hover:bg-[#FFED4E] text-black font-bold rounded-xl">Add Lesson</button>
            </div>
          )
        ) : (
          <div className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-2xl p-8 md:p-12 text-center">
            <BookOpen className="w-16 h-16 md:w-20 md:h-20 text-gray-600 mx-auto mb-4 md:mb-6" />
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Select a Course</h3>
            <p className="text-sm md:text-base text-gray-400">Please select a course from the dropdown above to manage its lessons</p>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && selectedCourseId && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 md:p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm() } }}>
            <div className="bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl p-4 md:p-6 lg:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar my-4">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">{editingLesson ? 'Edit Lesson' : 'Create Lesson'}</h2>
                <button onClick={() => { setShowModal(false); resetForm() }} className="text-gray-400 hover:text-white p-1"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]" placeholder="Lesson Title" maxLength={100} />
                  {errors.title && <p className="mt-1 text-xs md:text-sm text-red-400">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Short Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]" rows="2" placeholder="Brief description" maxLength={200} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Duration (minutes)</label><input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]" placeholder="30" min="0" /></div>
                  <div><label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Content Type *</label><select value={formData.contentType} onChange={(e) => setFormData({ ...formData, contentType: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]"><option value="video">Video</option><option value="imageGallery">Image Gallery</option><option value="article">Article</option><option value="file">File / Link</option></select></div>
                </div>

                {/* Video Content */}
                {formData.contentType === 'video' && (
                  <div className="space-y-3 border-t border-indigo-600/20 pt-4">
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center space-x-2">
                      <Video className="w-5 h-5 text-indigo-400" />
                      <span>Video Content</span>
                    </h3>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Video Link (YouTube / Vimeo / MP4 URL) *</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input type="url" value={formData.videoLink} onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })} className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]" placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4" />
                        <label className="px-3 py-2 md:px-4 md:py-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/30 rounded-xl text-indigo-400 cursor-pointer transition-all text-xs md:text-sm font-semibold flex items-center justify-center space-x-1">
                          <Upload className="w-4 h-4" /><span>Upload</span>
                          <input type="file" accept="video/*" onChange={async (e) => {
                            const file = e.target.files[0]
                            if (file) {
                              setErrors({ ...errors, videoLink: '' })
                              const result = await processUpload(file, null, 'lessons/videos')
                              if (result.success) setFormData({ ...formData, videoLink: result.url })
                              else setErrors({ ...errors, videoLink: result.error })
                            }
                          }} className="hidden" />
                        </label>
                      </div>
                      {errors.videoLink && <p className="mt-1 text-xs md:text-sm text-red-400">{errors.videoLink}</p>}
                    </div>
                    <ImageUpload value={formData.thumbnail} onChange={(url) => setFormData({ ...formData, thumbnail: url })} label="Thumbnail Image (Optional)" storagePath="lessons/thumbnails" required={false} />
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Transcript (Optional)</label>
                      <textarea value={formData.transcript} onChange={(e) => setFormData({ ...formData, transcript: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]" rows="4" placeholder="Video transcript text..." />
                    </div>
                  </div>
                )}

                {/* Image Gallery Content */}
                {formData.contentType === 'imageGallery' && (
                  <div className="space-y-3 border-t border-indigo-600/20 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base md:text-lg font-bold text-white">Image Gallery</h3>
                      <button type="button" onClick={addImage} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all text-xs md:text-sm flex items-center space-x-1"><Plus className="w-3 h-3 md:w-4 md:h-4" /><span>Add Image</span></button>
                    </div>
                    {formData.images.length === 0 && <p className="text-xs md:text-sm text-gray-400">No images added yet. Click "Add Image" to get started.</p>}
                    {errors.images && <p className="text-xs md:text-sm text-red-400">{errors.images}</p>}
                    <div className="space-y-3">
                      {formData.images.map((image, index) => (
                        <div key={index} className="bg-black/50 border border-indigo-600/20 rounded-xl p-3 md:p-4">
                          <div className="flex items-start justify-between mb-2"><span className="text-xs md:text-sm font-semibold text-gray-400">Image {index + 1}</span><button type="button" onClick={() => removeImage(index)} className="p-1 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400"><XCircle className="w-4 h-4" /></button></div>
                          <div className="space-y-2">
                            <ImageUpload value={image.url} onChange={(url) => updateImage(index, 'url', url)} label={`Image ${index + 1} URL`} storagePath="lessons/images" required={false} className="mb-2" />
                            <input type="text" value={image.title} onChange={(e) => updateImage(index, 'title', e.target.value)} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-xs md:text-sm focus:outline-none focus:border-[#FFD700]" placeholder="Image Title" />
                            <textarea value={image.description} onChange={(e) => updateImage(index, 'description', e.target.value)} className="w-full px-3 py-2 bg-black border border-indigo-600/30 rounded-lg text-white text-xs md:text-sm focus:outline-none focus:border-[#FFD700]" rows="2" placeholder="Image Description" />
                            {image.url && <div className="mt-2"><img src={image.url} alt={image.title || `Image ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-indigo-600/30" onError={(e) => e.target.style.display = 'none'} /></div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Article Content */}
                {formData.contentType === 'article' && (
                  <div className="space-y-3 border-t border-indigo-600/20 pt-4">
                    <h3 className="text-base md:text-lg font-bold text-white flex items-center space-x-2"><FileText className="w-5 h-5 text-indigo-400" /><span>Article Content</span></h3>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Article Content *</label>
                      <RichTextEditor value={formData.articleContent} onChange={(content) => setFormData({ ...formData, articleContent: content })} placeholder="Start writing your article..." />
                      {errors.articleContent && <p className="mt-1 text-xs md:text-sm text-red-400">{errors.articleContent}</p>}
                    </div>
                  </div>
                )}

                {/* File/Link Content */}
                {formData.contentType === 'file' && (
                  <div className="space-y-3 border-t border-indigo-600/20 pt-4">
                    <h3 className="text-base md:text-lg font-bold text-white">File / Link Content</h3>
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">File Link (PDF, ZIP, DOC, etc.) or External URL *</label>
                      <input type="url" value={formData.fileLink} onChange={(e) => setFormData({ ...formData, fileLink: e.target.value })} className="w-full px-3 py-2 md:px-4 md:py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm md:text-base focus:outline-none focus:border-[#FFD700]" placeholder="https://example.com/file.pdf or https://drive.google.com/..." />
                      {errors.fileLink && <p className="mt-1 text-xs md:text-sm text-red-400">{errors.fileLink}</p>}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div className="border-t border-indigo-600/20 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base md:text-lg font-bold text-white">Attachments (Optional)</h3>
                    <button type="button" onClick={addAttachment} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all text-xs md:text-sm flex items-center space-x-1"><Plus className="w-3 h-3 md:w-4 md:h-4" /><span>Add Attachment</span></button>
                  </div>
                  <div className="space-y-2">
                    {formData.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-black/50 border border-indigo-600/20 rounded-lg p-2">
                        <input type="text" value={attachment.name} onChange={(e) => updateAttachment(index, 'name', e.target.value)} className="flex-1 px-2 py-1 bg-black border border-indigo-600/30 rounded text-white text-xs focus:outline-none focus:border-[#FFD700]" placeholder="Attachment name" />
                        <input type="url" value={attachment.url} onChange={(e) => updateAttachment(index, 'url', e.target.value)} className="flex-1 px-2 py-1 bg-black border border-indigo-600/30 rounded text-white text-xs focus:outline-none focus:border-[#FFD700]" placeholder="URL" />
                        <button type="button" onClick={() => removeAttachment(index)} className="p-1 bg-red-600/20 hover:bg-red-600/30 rounded text-red-400"><XCircle className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Publish Toggle */}
                <div className="border-t border-indigo-600/20 pt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="w-4 h-4 md:w-5 md:h-5 rounded border-2 border-indigo-600/30 bg-black text-[#FFD700] focus:ring-2 focus:ring-[#FFD700]/50" />
                    <span className="text-xs md:text-sm text-gray-300">Published (Visible to users)</span>
                  </label>
                </div>

                {errors.submit && <div className="bg-red-600/20 border border-red-600/30 rounded-xl p-3 flex items-center space-x-2"><AlertCircle className="w-4 h-4 text-red-400" /><p className="text-sm text-red-400">{errors.submit}</p></div>}
                {editingLesson && formData.autoSaved && <div className="bg-green-600/20 border border-green-600/30 rounded-xl p-3 flex items-center space-x-2"><CheckCircle className="w-4 h-4 text-green-400" /><p className="text-sm text-green-400">Draft auto-saved</p></div>}

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4">
                  <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-sm md:text-base">Cancel</button>
                  <button type="submit" className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-[#FFD700] hover:bg-[#FFED4E] text-black font-bold rounded-xl flex items-center justify-center space-x-2"><Save className="w-4 h-4 md:w-5 md:h-5" /><span>{editingLesson ? 'Update Lesson' : 'Create Lesson'}</span></button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default LessonManager
