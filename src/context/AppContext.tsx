import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
  watchCourses,
  watchNewCourses,
  watchUserEnrollments,
  enrollInCourse as firebaseEnrollInCourse,
  updateCourseProgress as firebaseUpdateCourseProgress,
  watchUserNotifications,
  markNotificationAsRead as firebaseMarkNotificationAsRead,
  watchAIUsage,
  updateAIUsage as firebaseUpdateAIUsage,
  watchUserChatHistory,
  saveChatMessage as firebaseSaveChatMessage
} from '../services/context/AppContext'

// Default context value to prevent crashes
const defaultContext = {
  notifications: [],
  courses: [],
  enrollments: [],
  aiUsage: { used: 0, limit: 1000 },
  chatHistory: [],
  markNotificationAsRead: async () => {},
  enrollInCourse: async () => ({ success: false, error: 'Not initialized' }),
  updateCourseProgress: async () => ({ success: false, error: 'Not initialized' }),
  incrementAiUsage: async () => {},
  addChatMessage: async () => ({ success: false, error: 'Not initialized' })
}

const AppContext = createContext(defaultContext)

export const useApp = () => {
  const context = useContext(AppContext)
  // Return context or default to prevent crashes
  return context || defaultContext
}

export const AppProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [aiUsage, setAiUsage] = useState({ used: 0, limit: 1000 })
  const [chatHistory, setChatHistory] = useState([])

  // Watch courses in real-time - INSTANT LOADING
  useEffect(() => {
    let mounted = true
    try {
      // Try new course system first, fallback to old if needed
      // Real-time listener provides instant updates
      const unsubscribe = watchNewCourses ? watchNewCourses((coursesData) => {
        if (mounted) {
          setCourses(coursesData || [])
        }
      }) : watchCourses((coursesData) => {
        if (mounted) {
          setCourses(coursesData || [])
        }
      })
      return () => {
        mounted = false
        try {
          unsubscribe()
        } catch (err) {
          console.error('Error unsubscribing courses:', err)
        }
      }
    } catch (error) {
      console.error('Error setting up courses watch:', error)
      setCourses([])
      return () => {}
    }
  }, [])

  // Watch user-specific data when user is logged in
  useEffect(() => {
    if (!user) {
      setEnrollments([])
      setNotifications([])
      setAiUsage({ used: 0, limit: 1000 })
      setChatHistory([])
      return
    }

    let mounted = true
    const unsubscribers = []

    try {
      // Watch enrollments
      const unsubscribeEnrollments = watchUserEnrollments(user.uid, (enrollmentsData) => {
        if (mounted) {
          setEnrollments(enrollmentsData || [])
        }
      })
      unsubscribers.push(() => {
        try {
          unsubscribeEnrollments()
        } catch (err) {
          console.error('Error unsubscribing enrollments:', err)
        }
      })
    } catch (error) {
      console.error('Error setting up enrollments watch:', error)
    }

    try {
      // Watch notifications
      const unsubscribeNotifications = watchUserNotifications(user.uid, (notificationsData) => {
        if (mounted) {
          setNotifications((notificationsData || []).map(n => ({
            ...n,
            timestamp: n.createdAt ? new Date(n.createdAt) : new Date()
          })))
        }
      })
      unsubscribers.push(() => {
        try {
          unsubscribeNotifications()
        } catch (err) {
          console.error('Error unsubscribing notifications:', err)
        }
      })
    } catch (error) {
      console.error('Error setting up notifications watch:', error)
    }

    try {
      // Watch AI usage
      const unsubscribeAIUsage = watchAIUsage(user.uid, (usageData) => {
        if (mounted) {
          setAiUsage(usageData || { used: 0, limit: 1000 })
        }
      })
      unsubscribers.push(() => {
        try {
          unsubscribeAIUsage()
        } catch (err) {
          console.error('Error unsubscribing AI usage:', err)
        }
      })
    } catch (error) {
      console.error('Error setting up AI usage watch:', error)
    }

    try {
      // Watch chat history
      const unsubscribeChat = watchUserChatHistory(user.uid, (chatData) => {
        if (mounted) {
          setChatHistory((chatData || []).map(msg => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          })))
        }
      })
      unsubscribers.push(() => {
        try {
          unsubscribeChat()
        } catch (err) {
          console.error('Error unsubscribing chat:', err)
        }
      })
    } catch (error) {
      console.error('Error setting up chat watch:', error)
    }

    return () => {
      mounted = false
      unsubscribers.forEach(unsub => unsub())
    }
  }, [user])

  const markNotificationAsRead = async (notificationId) => {
    if (!user) return
    try {
      await firebaseMarkNotificationAsRead(user.uid, notificationId)
      // State will update automatically via real-time listener
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const enrollInCourse = async (courseId, paymentData = null) => {
    if (!user) return { success: false, error: 'User not logged in' }
    try {
      const result = await firebaseEnrollInCourse(user.uid, courseId, paymentData)
      if (result.success) {
        // State will update automatically via real-time listener
        return { success: true }
      }
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const updateCourseProgress = async (courseId, progress) => {
    if (!user) return { success: false, error: 'User not logged in' }
    try {
      const result = await firebaseUpdateCourseProgress(user.uid, courseId, progress)
      if (result.success) {
        // State will update automatically via real-time listener
        return { success: true }
      }
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const incrementAiUsage = async () => {
    if (!user) return
    try {
      const newUsage = { ...aiUsage, used: aiUsage.used + 1 }
      await firebaseUpdateAIUsage(user.uid, newUsage)
      // State will update automatically via real-time listener
    } catch (error) {
      console.error('Error updating AI usage:', error)
    }
  }

  const addChatMessage = async (message) => {
    if (!user) return { success: false, error: 'User not logged in' }
    try {
      const result = await firebaseSaveChatMessage(user.uid, message)
      if (result.success) {
        // State will update automatically via real-time listener
        return { success: true, id: result.id }
      }
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    notifications,
    courses,
    enrollments,
    aiUsage,
    chatHistory,
    markNotificationAsRead,
    enrollInCourse,
    updateCourseProgress,
    incrementAiUsage,
    addChatMessage
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
