import { useState, useEffect } from 'react'
import { getAppSettings, subscribeToAppSettings } from '../utils/settings'

interface Notification {
  _id: string
  type:
    | 'appointment_request'
    | 'appointment_approved'
    | 'appointment_rejected'
    | 'appointment_cancelled'
    | 'appointment_reminder_patient'
    | 'appointment_reminder_doctor'
    | 'prescription_added'
    | 'doctor_review_request'
    | 'doctor_review_result'
    | 'medication_reminder_set'
    | 'medication_reminder_due'
    | 'provider_order_update'
    | 'provider_payment_update'
    | 'provider_support_message'
  title: string
  message: string
  read: boolean
  createdAt: string
  appointmentId?: string
  reviewRequestId?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => getAppSettings().notificationsEnabled)

  const loadNotifications = async () => {
    if (!notificationsEnabled) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data)
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToAppSettings((next) => {
      setNotificationsEnabled(next.notificationsEnabled)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    loadNotifications()
    // Refresh notifications every 5 seconds for near real-time updates.
    const interval = setInterval(loadNotifications, 5000)

    const onFocus = () => {
      loadNotifications()
    }

    const onVisibility = () => {
      if (!document.hidden) {
        loadNotifications()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [notificationsEnabled])

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead
  }
}

