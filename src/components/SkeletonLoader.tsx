import React from 'react'

export const CourseCardSkeleton = () => (
  <div className="bg-gradient-to-br from-[#1a1a1a]/90 to-black/70 border-2 border-indigo-600/20 rounded-2xl overflow-hidden animate-pulse">
    <div className="relative h-48 bg-gray-800"></div>
    <div className="p-4 md:p-6 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-700 rounded-lg"></div>
        <div className="h-5 w-20 bg-gray-700 rounded-lg"></div>
      </div>
      <div className="h-6 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      <div className="h-10 bg-gray-700 rounded-xl"></div>
    </div>
  </div>
)

export const LessonListSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-black/30 border-2 border-indigo-600/20 rounded-xl p-4 animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const LessonContentSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
    <div className="aspect-video bg-gray-800 rounded-xl"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-700 rounded w-5/6"></div>
    </div>
  </div>
)

export const PaymentHistorySkeleton = () => (
  <div className="bg-gradient-to-br from-black/70 to-[#1a1a1a]/90 border-2 border-indigo-600/20 rounded-xl p-4 md:p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-700 rounded"></div>
          <div className="h-4 w-32 bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-3 w-12 bg-gray-700 rounded"></div>
      <div className="h-5 w-20 bg-gray-700 rounded"></div>
    </div>
    <div className="h-3 w-24 bg-gray-700 rounded mb-3"></div>
    <div className="h-8 w-20 bg-gray-700 rounded mt-4"></div>
  </div>
)

export const CourseHeaderSkeleton = () => (
  <div className="relative bg-gradient-to-r from-indigo-600/20 via-indigo-600/10 to-transparent border-2 border-indigo-600/30 rounded-xl md:rounded-2xl p-3 md:p-4 lg:p-6 xl:p-8 overflow-hidden animate-pulse">
    <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
  </div>
)

// Video Skeleton Loader - For video lessons
export const VideoSkeleton = () => (
  <div className="relative w-full bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border-2 border-indigo-600/20 animate-pulse">
    <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
      <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Loading video...</p>
        </div>
      </div>
    </div>
  </div>
)

