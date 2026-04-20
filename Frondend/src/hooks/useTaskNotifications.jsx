import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const token = localStorage.getItem('access_token');

    useEffect(() => {
        if (!token) return;

        // Establish WebSocket connection
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Assuming data contains { type: '...', msg: '...' }
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
        };

        socket.onclose = () => console.log("Notification WebSocket Closed");

        return () => socket.close();
    }, [token]);

    const markAsRead = () => setUnreadCount(0);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);