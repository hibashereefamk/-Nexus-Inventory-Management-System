import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { 
  LayoutDashboard, Users, Settings, ClipboardList, 
  BarChart3, Briefcase, AlertTriangle, Search, 
  History, MailPlus, Warehouse
} from 'lucide-react';
import {FiClipboard} from 'react-icons/fi';
import { useNotifications } from '../../hooks/useTaskNotifications';

const Sidebar = () => {
  const userRole = localStorage.getItem('role') || 'staff';
  const { unreadCount } = useNotifications();
  const location = useLocation(); // Better way to track active paths in React Router

  const menuConfig = {
    admin: [
      { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
      { title: "Users & Roles", icon: <Users size={20} />, path: "/user-management" },
      { title: "Operations", icon: <Briefcase size={20} />, path: "/admin/operations" }, 
      { title: "Reports & Approvals", icon: <ClipboardList size={20} />, path: "/admin/reports" },
      { title: "Analytics", icon: <BarChart3 size={20} />, path: "/admin/analytics" },
      { title: "Alerts & Monitoring", icon: <AlertTriangle size={20} />, path: "/admin/alerts" },
      { title: "Settings & Logs", icon: <Settings size={20} />, path: "/admin/settings" }
    ],
    manager: [
      { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
      { title: "Inventory management", icon: <Warehouse size={20} />, path: "/inventory" },
      { title: "Assignment", icon: <FiClipboard size={20} />, path: "/manager/staff-tasks" },
      { title: "Shipments & Packing", icon: <Briefcase size={20} />, path: "/manager/operations" },
      { title: "Alerts & Overdue", icon: <AlertTriangle size={20} />, path: "/manager/alerts" },
      { title: "Reports", icon: <ClipboardList size={20} />, path: "/manager/reports" },
      { title: "Performance", icon: <BarChart3 size={20} />, path: "/manager/performance" },
    ],
    staff: [
      { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
      { title: "Task Registry", icon: <ClipboardList size={20} />, path: "/tasks/show" },
      { title: "Inventory Alerts", icon: <AlertTriangle size={20} />, path: "/inventory/alerts" },
      { title: "Stock Lookup", icon: <Search size={20} />, path: "/inventory/lookup" },
      { title: "Procurement History", icon: <History size={20} />, path: "/inventory/history" },
      { title: "Supply Request", icon: <MailPlus size={20} />, path: "/requests" },
    ],
  };

  const menuItems = menuConfig[userRole] || [{ title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" }];

  return (
    <div className="sidebar">
      <div className="sidebar-nameplate">
        <div className="logo-icon">N</div>
        <div className="nameplate-text">
          <span className="brand-name">NEXUS</span>
          <span className="brand-sub">INVENTORY</span>
        </div>
      </div>

      <hr style={{ border: '1px solid #9c9b9b', margin: '10px 0' }} />

      <nav className="sidebar-nav">
        <p className="sidebar-label">Main Menu</p>
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link 
                to={item.path} 
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.title}</span>

                {/* The logic is now safely inside the .map() scope */}
                {item.title.toLowerCase().includes("alerts") && unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;