import React, { useEffect, useState } from 'react'
import { Keyboard } from 'lucide-react'

/**
 * Keyboard Shortcuts Component
 * Displays available keyboard shortcuts and handles keyboard navigation
 */
const KeyboardShortcuts = ({ shortcuts = [], showModal = false, onClose }) => {
  const [isVisible, setIsVisible] = useState(showModal)

  useEffect(() => {
    setIsVisible(showModal)
  }, [showModal])

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Show shortcuts with ? key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsVisible(true)
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false)
        if (onClose) onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, onClose])

  const defaultShortcuts = [
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'Esc', description: 'Close dialogs/modals' },
    { key: '/', description: 'Focus search bar' },
    { key: 'Ctrl+K', description: 'Quick search (if implemented)' },
  ]

  const allShortcuts = [...defaultShortcuts, ...shortcuts]

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => {
        setIsVisible(false)
        if (onClose) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div 
        className="bg-[#1a1a1a] border-2 border-lime-400/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Keyboard className="h-6 w-6 text-lime-400" />
            <h2 id="shortcuts-title" className="text-2xl font-bold text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              if (onClose) onClose()
            }}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-lime-400 rounded"
            aria-label="Close shortcuts"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-4">
          {allShortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-black/50 rounded-xl hover:bg-black/70 transition-colors"
            >
              <span className="text-gray-300">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded-lg text-lime-400 font-mono text-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-gray-400 text-center">
          Press <kbd className="px-2 py-1 bg-[#1a1a1a] border border-gray-700 rounded text-lime-400">Esc</kbd> to close
        </p>
      </div>
    </div>
  )
}

export default KeyboardShortcuts

