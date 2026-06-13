import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const TOAST_TYPES = {
  success: { icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-400' },
  error: { icon: AlertCircle, color: 'bg-red-500', textColor: 'text-red-400' },
  info: { icon: Info, color: 'bg-blue-500', textColor: 'text-blue-400' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-500', textColor: 'text-yellow-400' }
}

let toastId = 0
const toastListeners = new Set()

export const toast = {
  show: (message, type = 'info', duration = 5000) => {
    const id = toastId++
    const toast = { id, message, type, duration }
    toastListeners.forEach(listener => listener(toast))
    return id
  },
  success: (message, duration) => toast.show(message, 'success', duration),
  error: (message, duration) => toast.show(message, 'error', duration),
  info: (message, duration) => toast.show(message, 'info', duration),
  warning: (message, duration) => toast.show(message, 'warning', duration)
}

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleToast = (newToast) => {
      setToasts(prev => [...prev, newToast])
      
      if (newToast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id))
        }, newToast.duration)
      }
    }

    toastListeners.add(handleToast)
    return () => {
      toastListeners.delete(handleToast)
    }
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md w-full md:w-auto">
      {toasts.map((toast) => {
        const toastConfig = TOAST_TYPES[toast.type] || TOAST_TYPES.info
        const Icon = toastConfig.icon

        return (
          <div
            key={toast.id}
            className="bg-[#1a1a1a] border-2 border-indigo-600/20 rounded-xl p-4 shadow-2xl flex items-start space-x-3 animate-fade-in-up min-w-[300px]"
          >
            <div className={`${toastConfig.textColor} flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base text-white break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer

