import { useEffect, useState } from 'react';

const useTaskNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/notifications/');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle different types of real-time updates
      if (data.type === 'task_assigned' || data.type === 'status_updated') {
        setNotifications((prev) => [data.payload, ...prev]);
        setBadgeCount((prev) => prev + 1);
        
        // Optional: browser alert
        console.log("Real-time Update:", data.payload);
      }
    };

    return () => socket.close();
  }, []);

  return { notifications, badgeCount, setBadgeCount };
};

export default useTaskNotifications;