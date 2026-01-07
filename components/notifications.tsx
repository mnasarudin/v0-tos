"use client"

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/auth'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  metadata?: any
}

interface NotificationsProps {
  variant?: 'admin' | 'intern'
}

export function Notifications({ variant = 'admin' }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, maxHeight: 600 })
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    getCurrentUser().then(setCurrentUser)
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [currentUser])

  const fetchNotifications = async () => {
    if (!currentUser?.id) return
    
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`)
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.isRead).length || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!currentUser?.id) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, userId: currentUser.id })
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_intern':
        return '👤'
      case 'clock_in':
        return '🕐'
      case 'clock_out':
        return '🕕'
      case 'leave_application':
        return '📝'
      case 'leave_approved':
        return '✅'
      case 'leave_rejected':
        return '❌'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_intern':
        return 'bg-blue-100 text-blue-700'
      case 'clock_in':
        return 'bg-green-100 text-green-700'
      case 'clock_out':
        return 'bg-purple-100 text-purple-700'
      case 'leave_application':
        return 'bg-amber-100 text-amber-700'
      case 'leave_approved':
        return 'bg-green-100 text-green-700'
      case 'leave_rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  const handleToggle = () => {
    if (!isOpen && buttonRef.current && typeof window !== 'undefined') {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 384 // w-96 = 384px
      const dropdownHeight = 600 // max-h-[600px]
      const padding = 16 // padding from edges
      
      // Calculate position
      let top = rect.bottom + 8
      let right = window.innerWidth - rect.right
      let maxHeight = dropdownHeight
      
      // Check if dropdown would go off bottom of screen
      if (top + dropdownHeight > window.innerHeight - padding) {
        // Position above button instead
        top = rect.top - dropdownHeight - 8
        // Ensure it doesn't go off top
        if (top < padding) {
          top = padding
          // Adjust max height to fit available space
          maxHeight = window.innerHeight - top - padding
        } else {
          // Adjust max height to fit available space
          maxHeight = Math.min(dropdownHeight, window.innerHeight - top - padding)
        }
      } else {
        // Adjust max height to fit available space below
        maxHeight = Math.min(dropdownHeight, window.innerHeight - top - padding)
      }
      
      // Check if dropdown would go off right edge
      if (right + dropdownWidth > window.innerWidth - padding) {
        right = padding
      }
      
      // Check if dropdown would go off left edge
      if (right < padding) {
        right = padding
      }
      
      setDropdownPosition({
        top: Math.max(padding, top),
        right: Math.max(padding, right),
        maxHeight: Math.max(200, maxHeight) // Minimum height of 200px
      })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="relative z-10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && mounted && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0" 
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 99999,
              position: 'fixed'
            }}
            onClick={() => setIsOpen(false)}
          />
          <Card 
            className="fixed w-96 overflow-hidden shadow-2xl border-[#00A0A0]/30"
            style={{ 
              backgroundColor: '#ffffff',
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              maxHeight: `${dropdownPosition.maxHeight}px`,
              position: 'fixed',
              zIndex: 100000,
              isolation: 'isolate'
            }}
          >
            <CardHeader 
              className="pb-3 border-b"
              style={{ backgroundColor: '#ffffff' }}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs h-7"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent 
              className="p-0"
              style={{ backgroundColor: '#ffffff' }}
            >
              <div 
                className="max-h-[500px] overflow-y-auto"
                style={{ backgroundColor: '#ffffff' }}
              >
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 transition-colors cursor-pointer ${
                          !notification.isRead 
                            ? 'bg-gray-200 hover:bg-gray-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-2xl ${getNotificationColor(notification.type)} rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={`font-semibold text-sm ${
                                  !notification.isRead 
                                    ? 'text-gray-900 font-bold' 
                                    : 'text-gray-600'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className={`text-sm mt-1 ${
                                  !notification.isRead 
                                    ? 'text-gray-700' 
                                    : 'text-gray-500'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className={`text-xs mt-2 ${
                                  !notification.isRead 
                                    ? 'text-gray-600' 
                                    : 'text-gray-400'
                                }`}>
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>,
        document.body
      )}
    </div>
  )
}

