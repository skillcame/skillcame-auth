import React, { useState, useCallback, useMemo } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Reusable Search Bar Component
 * Provides search functionality with debouncing and keyboard navigation
 */
const SearchBar = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  className = '',
  showClearButton = true,
  autoFocus = false,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debounceTimer, setDebounceTimer] = useState(null)

  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    setSearchTerm(value)

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(value)
      }
    }, debounceMs)

    setDebounceTimer(timer)
  }, [debounceMs, onSearch, debounceTimer])

  const handleClear = useCallback(() => {
    setSearchTerm('')
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    if (onSearch) {
      onSearch('')
    }
  }, [onSearch, debounceTimer])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }, [handleClear])

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search 
          className="absolute left-3 h-5 w-5 text-gray-400" 
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-3 bg-[#1a1a1a] border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={placeholder}
          aria-describedby="search-description"
        />
        {showClearButton && searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-lime-400 rounded"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <span id="search-description" className="sr-only">
        Search input with automatic filtering
      </span>
    </div>
  )
}

export default SearchBar

