import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopNavbar.css';

function TopNavbar ({ notifications, badgeCount, resetBadge }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role_display') || '';

  const handleNotificationClick = () => {
    // Use notifications from props
    navigate('/inventory/alerts', { state: { alerts: notifications } });
    resetBadge();
  };
  const Clickhelp=()=>{
    navigate('/help')
  }

  useEffect(() => {
    // ✅ FIX 2: WebSocket connection
    const socket = new WebSocket('ws://127.0.0.1:8000/ws/notifications/');

    socket.onopen = () => {
      console.log("WebSocket Connected");
    };

    socket.onmessage = (event) => {
      // ✅ FIX 3: Correct JSON parsing
      const data = JSON.parse(event.data);

      console.log("New Alert:", data.message);

      setNotifications(prev => [data.message, ...prev]);
      setBadgeCount(prev => prev + 1);

      alert("Inventory Alert: " + data.message);
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => socket.close();
  }, []);


  return (
    <div className="top-navbar">
      <div className="top-left"></div>

      <div className="top-right">
        <div className="nav-item" onClick={handleNotificationClick} style={{ cursor: 'pointer' }}>
          <span className="icon">🔔</span>
          <span>Notifications</span>
          {badgeCount > 0 && <span className="badge">{badgeCount}</span>}
        </div>

        {/* Help */}
        <div className="nav-item" onClick={Clickhelp}>
          <span className="icon">❓</span>
          <span>Help</span>
        </div>

        {/* Profile */}
        <div 
          className="profile-menu"
          onClick={() => setOpen(!open)}
        >
          <span className="avatar">
            {username.charAt(0).toUpperCase()}
          </span>

          <div style={{ display: 'flex', flexDirection: "column" }}>
            <span>{username} - {role}</span>

            {open && (
              <div className="dropdown">
                <p onClick={() => navigate('/profile')}>Profile</p>
                <p onClick={() => navigate('/help')}>help</p>
                <p onClick={() => navigate('/login')}>Logout</p>
                 
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TopNavbar;