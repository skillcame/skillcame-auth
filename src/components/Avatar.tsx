import { useState } from 'react'
import { getInitials } from '../utils/colorGenerator'

/**
 * Unified Avatar Component
 * Handles avatar display consistently across the entire application
 * Supports both user and admin avatars with proper fallback
 * 
 * @param {Object} user - User object with avatar property
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl', '2xl' or custom className
 * @param {boolean} showStatus - Show online status indicator
 * @param {boolean} showVerified - Show verified badge
 * @param {string} className - Additional CSS classes
 * @param {string} fallbackText - Custom text for initials fallback
 */
const Avatar = ({ 
  user, 
  size = 'md', 
  showStatus = false, 
  showVerified = false,
  className = '',
  fallbackText = null
}) => {
  const [imageError, setImageError] = useState(false)

  // Get avatar URL - check both user.avatar and user.userProfile?.avatar
  const avatarUrl = user?.avatar || user?.userProfile?.avatar || null

  // Get display name for initials
  const displayName = user?.name || user?.userName || user?.email || fallbackText || 'User'
  const initials = getInitials(displayName, 2)

  // Size classes mapping
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-32 h-32 text-4xl'
  }

  // Determine if size is a predefined variant or custom className
  const sizeClass = sizeClasses[size] || size

  // Status indicator size based on avatar size
  const statusSize = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
    '3xl': 'w-6 h-6'
  }
  const statusIndicatorSize = statusSize[size] || 'w-2.5 h-2.5'

  // Verified badge size
  const verifiedSize = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
    '2xl': 'w-8 h-8',
    '3xl': 'w-10 h-10'
  }
  const verifiedBadgeSize = verifiedSize[size] || 'w-5 h-5'

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {/* Avatar Container */}
      <div className={`${sizeClass} rounded-full overflow-hidden border-2 border-indigo-600/50 shadow-lg shadow-indigo-600/30 flex items-center justify-center relative`}>
        {/* Show image if avatar URL exists and no error */}
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Fallback to gradient with initials */
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-lime-500 flex items-center justify-center relative overflow-hidden">
            <span className="text-white font-bold relative z-10">
              {initials}
            </span>
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-lime-400/20 to-indigo-400/20 animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Online Status Indicator */}
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${statusIndicatorSize} bg-lime-400 rounded-full border-2 border-black flex items-center justify-center shadow-lg`}>
          <div className={`${statusIndicatorSize} bg-lime-500 rounded-full animate-pulse`}></div>
        </div>
      )}

      {/* Verified Badge */}
      {showVerified && user?.verified && (
        <div className={`absolute -top-1 -left-1 ${verifiedBadgeSize} rounded-full flex items-center justify-center shadow-lg bg-transparent`}>
          <img src="/bluetick.svg" alt="Verified" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  )
}

export default Avatar

