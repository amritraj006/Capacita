import React, { useState, useEffect, useRef } from 'react'
import {
  Bell,
  CheckCheck,
  Calendar,
  BookOpen,
  Award,
  CheckSquare,
  Clock,
  Loader2,
  X
} from 'lucide-react'
import { notificationsApi } from '../api/notifications'

function NotificationIcon({ type }) {
  switch (type) {
    case 'TRAINING_ASSIGNMENT':
      return <Calendar size={14} className="text-blue-500" />
    case 'ENROLLMENT_UPDATE':
      return <BookOpen size={14} className="text-emerald-500" />
    case 'UPCOMING_TRAINING':
      return <Clock size={14} className="text-amber-500" />
    case 'ASSESSMENT':
      return <CheckSquare size={14} className="text-purple-500" />
    case 'COMPLETION':
      return <Award size={14} className="text-indigo-500" />
    default:
      return <Bell size={14} className="text-slate-400" />
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  const fetchUnreadCount = () => {
    notificationsApi.getUnreadCount()
      .then(data => setUnreadCount(data.unread_count || 0))
      .catch(() => {})
  }

  const loadNotifications = () => {
    setLoading(true)
    notificationsApi.getNotifications()
      .then(data => {
        const list = Array.isArray(data) ? data : (data.results || [])
        setNotifications(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 45000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 ring-2 ring-white" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs">
                <Loader2 size={16} className="animate-spin mr-2" /> Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4 text-xs text-slate-400">
                <Bell size={24} className="mx-auto mb-2 text-slate-200" />
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    !notif.is_read ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <NotificationIcon type={notif.notification_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-xs font-medium truncate ${!notif.is_read ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark read"
                          className="text-[10px] text-slate-400 hover:text-slate-700"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(notif.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
