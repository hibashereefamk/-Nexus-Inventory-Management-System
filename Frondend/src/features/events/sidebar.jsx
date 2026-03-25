import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const userRoleDisplay = localStorage.getItem('role_display') || 'staff';
  const userRole = localStorage.getItem('role') || 'staff';
  const username = localStorage.getItem('username') || 'User'; 
  const profilePic = localStorage.getItem('profile_pic') || null;
  const navigate =useNavigate()
 const menuConfig = {
    admin: [
      { title: "User Management", icon: "👥" },
      { title: "System Settings", icon: "⚙️" },
      { title: "Audit Logs", icon: "📋" },
      { title: "Global Reports", icon: "📊" },
      { title: "Backup & Recovery", icon: "💾" }
    ],
    manager: [
      { title: "Business Overview", icon: "📈" },
      { title: "Approval Requests", icon: "✅" },
      { title: "Department Stats", icon: "🏢" },
      { title: "Strategic Reports", icon: "📝" }
    ],
    staff: [
      { title: "My Profile", icon: "👤" },
      { title: "Daily Tasks", icon: "📅" },
      { title: "Item Lookup", icon: "🔍" },
      { title: "Internal Requests", icon: "📩" }
    ],
  };
const menuItems = menuConfig[userRole] || [{ title: "Dashboard", icon: "🏠" }];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      {/* Brand Nameplate */}
      <div className="sidebar-nameplate">
        <div className="logo-icon">N</div>
        <div className="nameplate-text">
          <span className="brand-name">NEXUS</span>
          <span className="brand-sub">INVENTORY</span>
        </div>
      </div>

      {/* NEW: User Profile Section */}
      <div className="sidebar-profile">
        <div className="profile-avatar-container">
          {profilePic ? (
            <img src={profilePic} alt="Profile" className="profile-img" />
          ) : (
            <div className="profile-initials">{username.charAt(0).toUpperCase()}</div>
          )}
          <div className="status-indicator online"></div>
        </div>
        <div className="profile-details">
          <p className="profile-username">{username}</p>
          <span className={`role-badge ${userRoleDisplay}`}>{userRoleDisplay.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link to={`/${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <span className="logout-icon">⏻</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;