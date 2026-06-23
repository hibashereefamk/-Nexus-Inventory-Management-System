import React, { createContext, useContext, useState, useEffect } from 'react'

import axios from 'axios'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const [unreadCount, setUnreadCount] = useState(0)

  const token = localStorage.getItem('access_token')

  const headers = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }

  useEffect(() => {
    if (!token) return

    // Load existing notifications
    const loadNotifications = async () => {
      try {
        const res = await axios.get(
          'http://127.0.0.1:8000/api/inventory/notifications/',
          headers
        )

        const data = res.data.results || res.data

        setNotifications(data)

        setUnreadCount(data.filter(n => !n.is_read).length)
      } catch (err) {
        console.log(err)
      }
    }

    loadNotifications()

    // websocket
    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/notifications/?token=${token}`
    )

    socket.onmessage = event => {
      const data = JSON.parse(event.data)

      setNotifications(prev => [data, ...prev])

      setUnreadCount(prev => prev + 1)
    }

    return () => socket.close()
  }, [token])

 const markAsRead = () =>
setUnreadCount(
 prev =>
 Math.max(
   prev - 1,
   0
 )
);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
