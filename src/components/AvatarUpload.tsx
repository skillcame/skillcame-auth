import { useState, useRef } from 'react'
import { User, Upload, X, Check } from 'lucide-react'

const AvatarUpload = ({ currentAvatar, onAvatarChange, size = 'large' }) => {
  const [preview, setPreview] = useState(currentAvatar || '')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
    xlarge: 'w-40 h-40'
  }

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        setPreview(result)
        onAvatarChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setPreview('')
    onAvatarChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          border-2 
          ${isDragging ? 'border-gold-600 bg-gold-600/20' : 'border-gold-600/30 border-dashed'} 
          flex 
          items-center 
          justify-center 
          cursor-pointer 
          transition-all 
          duration-300 
          hover:border-gold-600 
          hover:bg-gold-600/10 
          overflow-hidden 
          group
          relative
        `}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-6 h-6 text-gold-600" />
            </div>
            <button
              onClick={handleRemove}
              className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <User className="w-8 h-8 text-gold-600 mb-1" />
            <span className="text-xs text-gold-600 font-semibold">Upload</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      {preview && (
        <div className="absolute -bottom-2 right-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-dark-50">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  )
}

export default AvatarUpload

