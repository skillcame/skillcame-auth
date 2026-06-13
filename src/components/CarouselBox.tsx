import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { generateColorFromText, getInitials } from '../utils/colorGenerator'

const CarouselBox = ({ boxes = [], autoSlideInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (boxes.length === 0 || isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % boxes.length)
    }, autoSlideInterval)

    return () => clearInterval(interval)
  }, [boxes.length, autoSlideInterval, isPaused])

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + boxes.length) % boxes.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % boxes.length)
  }

  if (boxes.length === 0) {
    return (
      <div className="bg-gradient-to-r from-indigo-600/20 via-indigo-600/10 to-transparent border-2 border-indigo-600/30 rounded-2xl p-12 text-center">
        <p className="text-gray-400">No carousel content available</p>
      </div>
    )
  }

  const currentBox = boxes[currentIndex]

  return (
    <div
      className="relative bg-gradient-to-r from-indigo-600/20 via-indigo-600/10 to-transparent border-2 border-indigo-600/30 rounded-2xl p-8 md:p-12 overflow-hidden min-h-[300px] md:min-h-[400px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-lime-500/10 animate-pulse"></div>
      
      {/* Navigation Arrows */}
      {boxes.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 border-2 border-indigo-600/30 rounded-full text-white transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 border-2 border-indigo-600/30 rounded-full text-white transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        {currentBox.thumbnail ? (
          <div className="mb-6">
            <img
              src={currentBox.thumbnail}
              alt={currentBox.title}
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-indigo-600/30 shadow-lg mx-auto"
              onError={(e) => {
                e.target.style.display = 'none'
                const fallback = e.target.nextElementSibling
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          </div>
        ) : null}
        {!currentBox.thumbnail && (
          <div className={`mb-6 w-32 h-32 md:w-40 md:h-40 rounded-2xl flex items-center justify-center border-4 ${generateColorFromText(currentBox.title).border} shadow-lg mx-auto bg-gradient-to-br ${generateColorFromText(currentBox.title).bg} to-black`}>
            <span className={`text-4xl md:text-5xl font-bold ${generateColorFromText(currentBox.title).text}`}>
              {getInitials(currentBox.title, 2)}
            </span>
          </div>
        )}
        
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
          {currentBox.title}
        </h2>
        
        {currentBox.description && (
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {currentBox.description}
          </p>
        )}

        {currentBox.buttonText && currentBox.buttonLink && (
          <a
            href={currentBox.buttonLink}
            className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <span>{currentBox.buttonText}</span>
          </a>
        )}
      </div>

      {/* Dots Indicator */}
      {boxes.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2">
          {boxes.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-lime-400 w-8 scale-110'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CarouselBox

