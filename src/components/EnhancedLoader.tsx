import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Enhanced Loading Component
 * Provides beautiful loading states with accessibility support
 */
const EnhancedLoader = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false,
  variant = 'default' // 'default', 'spinner', 'dots', 'pulse'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  const containerClass = fullScreen 
    ? 'min-h-screen bg-black flex items-center justify-center p-4'
    : 'flex items-center justify-center p-4'

  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className={`${sizeClasses[size]} text-lime-400 animate-spin`} aria-hidden="true" />
            {text && (
              <p className={`${textSizeClasses[size]} text-gray-400 animate-pulse`}>
                {text}
              </p>
            )}
          </div>
        )
      
      case 'dots':
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex space-x-2">
              <div className="h-3 w-3 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} aria-hidden="true"></div>
              <div className="h-3 w-3 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} aria-hidden="true"></div>
              <div className="h-3 w-3 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} aria-hidden="true"></div>
            </div>
            {text && (
              <p className={`${textSizeClasses[size]} text-gray-400`}>
                {text}
              </p>
            )}
          </div>
        )
      
      case 'pulse':
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`${sizeClasses[size]} bg-lime-400 rounded-full animate-pulse`} aria-hidden="true"></div>
            {text && (
              <p className={`${textSizeClasses[size]} text-gray-400 animate-pulse`}>
                {text}
              </p>
            )}
          </div>
        )
      
      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className={`${sizeClasses[size]} border-4 border-gray-800 rounded-full`}></div>
              <div className={`${sizeClasses[size]} border-4 border-lime-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
            </div>
            {text && (
              <p className={`${textSizeClasses[size]} text-gray-400`}>
                {text}
              </p>
            )}
          </div>
        )
    }
  }

  return (
    <div 
      className={containerClass}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {renderLoader()}
      <span className="sr-only">{text}</span>
    </div>
  )
}

export default EnhancedLoader

