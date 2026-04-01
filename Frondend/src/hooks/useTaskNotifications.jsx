import { useEffect, useState } from 'react';

const useTaskNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/notifications/');

    socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("WebSocket Data Received:", data);
  
  if (data.type === 'task_assigned' || data.type === 'status_updated') {
    // FIX: Change data.payload to data.message
    setNotifications((prev) => [data.message, ...prev]); 
    setBadgeCount((prev) => prev + 1);
    
    console.log("Real-time Update:", data.message);
  }
};

    return () => socket.close();
  }, []);

  return { notifications, badgeCount, setBadgeCount };
};

export default useTaskNotifications;