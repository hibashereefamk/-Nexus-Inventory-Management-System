import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { 
  LayoutDashboard, Users, Settings, ClipboardList, 
  BarChart3, Briefcase, AlertTriangle, Search, 
  History, MailPlus, Warehouse, MessageSquare, Sparkles
} from 'lucide-react';
import { FiClipboard } from 'react-icons/fi';
import { useNotifications } from '../../hooks/useTaskNotifications';

const Sidebar = () => {
  const userRole = localStorage.getItem('role') || 'staff';
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const menuConfig = {
    admin: [
      { title: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
      { title: "Users & Roles", icon: <Users size={18} />, path: "/user-management" },
      { title: "Operations", icon: <Briefcase size={18} />, path: "/admin/operations" }, 
      { title: "Reports & Approvals", icon: <ClipboardList size={18} />, path: "/admin/reports" },
      { title: "Analytics", icon: <BarChart3 size={18} />, path: "/admin/analytics" },
      { title: "Alerts & Monitoring", icon: <AlertTriangle size={18} />, path: "/admin/alerts" },
      { title: "Settings & Logs", icon: <Settings size={18} />, path: "/admin/settings" }
    ],
    manager: [
      { title: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
      { title: "Inventory management", icon: <Warehouse size={18} />, path: "/inventory" },
      { title: "Assignment", icon: <FiClipboard size={18} />, path: "/manager/staff-tasks" },
      { title: "Shipments & Packing", icon: <Briefcase size={18} />, path: "/manager/operations" },
      { title: "Alerts & Overdue", icon: <AlertTriangle size={18} />, path: "/manager/alerts" },
      { title: "Reports", icon: <ClipboardList size={18} />, path: "/manager/reports" },
      { title: "Performance", icon: <BarChart3 size={18} />, path: "/manager/performance" },
    ],
    staff: [
      { title: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" },
      { title: "Task Registry", icon: <ClipboardList size={18} />, path: "/tasks/show" },
      { title: "Inventory Alerts", icon: <AlertTriangle size={18} />, path: "/inventory/alerts" },
      { title: "Stock Lookup", icon: <Search size={18} />, path: "/inventory/lookup" },
      { title: "Procurement History", icon: <History size={18} />, path: "/inventory/history" },
      { title: "Supply Request", icon: <MailPlus size={18} />, path: "/requests" },
    ],
  };

  const menuItems = menuConfig[userRole] || [{ title: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/" }];

  return (
    <div className="sidebar">
      {/* Top Brand Nameplate */}
      <div className="sidebar-nameplate">
        <div className="logo-icon">N</div>
        <div className="nameplate-text">
          <span className="brand-name">NEXUS</span>
          <span className="brand-sub">INVENTORY</span>
        </div>
      </div>

      <hr className="sidebar-divider" />

      {/* Main Scrollable Navigation */}
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

      {/* Fixed Integrations Footer (Chat & AI) */}
      <div className="sidebar-footer">
        <hr className="sidebar-divider" />
        <p className="sidebar-label">Collaboration</p>
        <ul>
          <li>
            <Link to="/chat" className={location.pathname === '/chat' ? 'active chat-active' : ''}>
              <span className="nav-icon chat-icon"><MessageSquare size={18} /></span>
              <span className="nav-text">Team Chat</span>
            </Link>
          </li>
          <li>
            <Link to="/ai-assistant" className={location.pathname === '/ai-assistant' ? 'active ai-active' : ''}>
              <span className="nav-icon ai-icon"><Sparkles size={18} /></span>
              <span className="nav-text">AI Assistant</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;