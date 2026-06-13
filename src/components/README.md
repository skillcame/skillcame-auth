# New Components & Utilities

This document describes the new components and utilities added to enhance the YaRVerse application.

## Components

### EnhancedLoader
A beautiful, accessible loading component with multiple variants.

**Usage:**
```jsx
import EnhancedLoader from './components/EnhancedLoader'

<EnhancedLoader 
  size="md"           // 'sm' | 'md' | 'lg' | 'xl'
  text="Loading..."   // Loading text
  fullScreen={false}  // Full screen overlay
  variant="spinner"   // 'default' | 'spinner' | 'dots' | 'pulse'
/>
```

### SearchBar
A reusable search bar component with debouncing and keyboard navigation.

**Usage:**
```jsx
import SearchBar from './components/SearchBar'

<SearchBar
  placeholder="Search courses..."
  onSearch={(value) => handleSearch(value)}
  debounceMs={300}
  showClearButton={true}
  autoFocus={false}
/>
```

### KeyboardShortcuts
Displays keyboard shortcuts modal. Press `?` to show.

**Usage:**
```jsx
import KeyboardShortcuts from './components/KeyboardShortcuts'

<KeyboardShortcuts
  shortcuts={[
    { key: 'Ctrl+S', description: 'Save' },
    { key: 'Ctrl+N', description: 'New' }
  ]}
  showModal={showShortcuts}
  onClose={() => setShowShortcuts(false)}
/>
```

### BackToTop
A floating button that appears when scrolling down to quickly return to top.

**Usage:**
```jsx
import BackToTop from './components/BackToTop'

<BackToTop 
  threshold={300}  // Show after scrolling 300px
  smooth={true}    // Smooth scroll animation
/>
```

## Hooks

### useDebounce
Debounce a value to reduce unnecessary updates.

**Usage:**
```jsx
import { useDebounce } from './hooks/useDebounce'

const [searchTerm, setSearchTerm] = useState('')
const debouncedSearchTerm = useDebounce(searchTerm, 300)

useEffect(() => {
  // This will only run after 300ms of no changes
  performSearch(debouncedSearchTerm)
}, [debouncedSearchTerm])
```

### useLocalStorage
Sync state with localStorage automatically.

**Usage:**
```jsx
import { useLocalStorage } from './hooks/useLocalStorage'

const [theme, setTheme] = useLocalStorage('theme', 'dark')
```

### useClickOutside
Detect clicks outside a component (useful for modals/dropdowns).

**Usage:**
```jsx
import { useClickOutside } from './hooks/useClickOutside'

const MyComponent = () => {
  const ref = useClickOutside(() => {
    // Close modal/dropdown
  })
  
  return <div ref={ref}>Content</div>
}
```

## Utilities

### logger
A logging utility that only logs in development mode.

**Usage:**
```jsx
import { logger } from './utils/logger'

logger.log('Info message')
logger.warn('Warning message')
logger.error('Error message')
logger.debug('Debug message')
```

### performance
Performance monitoring and optimization utilities.

**Usage:**
```jsx
import { performanceMonitor, debounce, throttle } from './utils/performance'

// Measure function execution
const measuredFn = performanceMonitor.measureFunction('myFunction', myFunction)

// Debounce
const debouncedFn = debounce(myFunction, 300)

// Throttle
const throttledFn = throttle(myFunction, 1000)
```

## Accessibility Improvements

All new components include:
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Reduced motion support (via CSS)

## Styling Enhancements

Added to `index.css`:
- `.sr-only` - Screen reader only content
- `:focus-visible` - Better focus indicators
- `.skip-to-main` - Skip to main content link
- `@media (prefers-reduced-motion)` - Respects user motion preferences
- `@media (prefers-contrast: high)` - High contrast mode support
- Print styles

