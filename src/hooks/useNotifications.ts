import { useState, useEffect } from 'react'

interface Notification {
  _id: string
  type: 'appointment_request' | 'appointment_approved' | 'appointment_rejected' | 'appointment_cancelled'
  title: string
  message: string
  read: boolean
  createdAt: string
  appointmentId?: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) return

      const response = await fetch(`http://localhost:5000/api/notifications?email=${encodeURIComponent(userEmail)}`)
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
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) return

      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
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
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) return

      const response = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
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
    loadNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead
  }
}

