import { useState, useRef, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Loader } from 'lucide-react'
import { processUpload, isValidUrl, getFilePreview } from '../utils/uploadHelper'

/**
 * Universal Image Upload Component
 * Supports both file upload and URL input with drag & drop
 */
const ImageUpload = ({ 
  value = '', 
  onChange, 
  label = 'Image',
  storagePath = 'uploads',
  required = false,
  accept = 'image/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = ''
}) => {
  const [preview, setPreview] = useState(value || '')
  const [uploadMode, setUploadMode] = useState('url') // 'url' or 'upload'
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Update preview when value changes externally
  useEffect(() => {
    if (value && value !== preview) {
      setPreview(value)
    }
  }, [value])

  const handleFileSelect = async (file) => {
    if (!file) return

    setError('')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
      return
    }

    try {
      // Get preview
      const previewUrl = await getFilePreview(file)
      setPreview(previewUrl)

      // Upload file
      setUploading(true)
      const result = await processUpload(file, null, storagePath)
      
      if (result.success) {
        setPreview(result.url)
        if (onChange) onChange(result.url)
        setError('')
      } else {
        setError(result.error || 'Upload failed')
        setPreview('')
      }
    } catch (err) {
      setError(err.message || 'Error processing file')
      setPreview('')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleUrlChange = (e) => {
    const url = e.target.value
    setError('')
    
    if (url.trim()) {
      if (isValidUrl(url.trim())) {
        setPreview(url.trim())
        if (onChange) onChange(url.trim())
      } else {
        setError('Invalid URL format')
      }
    } else {
      setPreview('')
      if (onChange) onChange('')
    }
  }

  const handleRemove = () => {
    setPreview('')
    setError('')
    if (onChange) onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-semibold text-gray-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Mode Toggle */}
      <div className="flex items-center space-x-2 mb-2">
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex-1 px-3 py-2 rounded-lg transition-all text-sm font-semibold ${
            uploadMode === 'url'
              ? 'bg-indigo-600/20 text-indigo-400 border-2 border-indigo-600/30'
              : 'bg-black/50 text-gray-400 border-2 border-indigo-600/20 hover:border-indigo-600/40'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          URL Link
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('upload')}
          className={`flex-1 px-3 py-2 rounded-lg transition-all text-sm font-semibold ${
            uploadMode === 'upload'
              ? 'bg-indigo-600/20 text-indigo-400 border-2 border-indigo-600/30'
              : 'bg-black/50 text-gray-400 border-2 border-indigo-600/20 hover:border-indigo-600/40'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload File
        </button>
      </div>

      {/* URL Input Mode */}
      {uploadMode === 'url' && (
        <div>
          <input
            type="url"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 bg-black border-2 border-indigo-600/30 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFD700] focus:ring-4 focus:ring-[#FFD700]/20 transition-all"
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      )}

      {/* Upload Mode */}
      {uploadMode === 'upload' && (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-[#FFD700] bg-[#FFD700]/10'
                : 'border-indigo-600/30 hover:border-indigo-600/50 bg-black/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="space-y-2">
                <Loader className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-sm text-gray-400">Uploading...</p>
              </div>
            ) : preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-48 mx-auto rounded-lg mb-2"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
                <p className="text-sm text-gray-300">
                  Drag & drop image here or <span className="text-[#FFD700]">click to browse</span>
                </p>
                <p className="text-xs text-gray-500">Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      )}

      {/* Preview (if URL mode and has value) */}
      {uploadMode === 'url' && preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-48 object-contain rounded-lg border border-indigo-600/20"
            onError={() => {
              setError('Failed to load image from URL')
              setPreview('')
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageUpload

