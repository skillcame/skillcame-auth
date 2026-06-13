import { X } from 'lucide-react'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3 md:p-4">
      <div className={`bg-[#1a1a1a] border-2 border-indigo-600/30 rounded-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto custom-scrollbar`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-indigo-600/20">
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-indigo-600/20 rounded-lg"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal

