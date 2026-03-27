import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopNavbar.css';

const TopNavbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'User';
  const department = localStorage.getItem('department_name') || '';
  const role = localStorage.getItem('role_display') || '';

  return (
    <div className="top-navbar">


      <div className="top-left">
        </div>
      <div className="top-right">

        {/* Notifications */}
        <div className="nav-item">
          <span className="icon">🔔</span>
          <span>Notifications</span>
          <span className="badge">3</span>
        </div>

        {/* Help */}
        <div className="nav-item">
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
          <div style={{display:'flex',flexDirection:"column"}}>

          <span>{username}</span>

          
          <span>
            {role} - {department}
          </span>
          {open && (
            <div className="dropdown">
              <p onClick={() => navigate('/profile')}>Profile</p>
              <p onClick={() => navigate('/settings')}>Settings</p>
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