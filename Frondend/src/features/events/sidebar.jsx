import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Sidebar.css';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ClipboardList, 
  BarChart3, 
  Briefcase, 
  AlertTriangle,  
  Search, 
  History, 
  MailPlus,
  TrendingUp
} from 'lucide-react';

const Sidebar = () => {
  const userRoleDisplay = localStorage.getItem('role_display') || 'staff';
  const userRole = localStorage.getItem('role') || 'staff';
  const username = localStorage.getItem('username') || 'User'; 
  const profilePic = localStorage.getItem('profile_pic') || null;
  const navigate =useNavigate()
 const menuConfig = {
  admin: [
    { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
    { title: "User Management", icon: <Users size={20} />, path: "/user-management" },
    { title: "System Settings", icon: <Settings size={20} />, path: "/settings" },
    { title: "Audit Logs", icon: <ClipboardList size={20} />, path: "/logs" },
  ],
  manager: [
    { title: "Operations Overview", icon: <TrendingUp size={20} />, path: "/" },
    { title: "Department Tasks", icon: <Briefcase size={20} />, path: "/tasks/queue" },
    { title: "Inventory Alerts", icon: <AlertTriangle size={20} />, path: "/inventory/alerts" },
    { title: "Performance Reports", icon: <BarChart3 size={20} />, path: "/reports" },
  ],
  staff: [
    { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
    { title: "Inventory Alerts", icon: <AlertTriangle size={20} />, path: "/inventory/alerts" },
    { title: "Stock Lookup", icon: <Search size={20} />, path: "/inventory/lookup" },
    { title: "Procurement History", icon: <History size={20} />, path: "/inventory/history" },
    { title: "Supply Request", icon: <MailPlus size={20} />, path: "/requests" },
  ],
};
const menuItems = menuConfig[userRole] || [{ title: "Dashboard", icon: "🏠", path: "/" }];


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
      <hr style={{ border: '1px solid #9c9b9b', margin: '10px 0' }} />
      

      <nav className="sidebar-nav">
      <p className="sidebar-label">Main Menu</p> {/* Professional Label */}
      <ul>
        {menuItems.map((item, index) => (
  <li key={index}>
    <Link to={item.path} className={window.location.pathname === item.path ? 'active' : ''}>
      {/* 🔷 Render the icon component directly */}
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-text">{item.title}</span>
    </Link>
  </li>
))}
      </ul>
    </nav>

    </div>
  );
};

export default Sidebar;