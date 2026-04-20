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
import { useNotifications } from '../../hooks/useTaskNotifications';
const Sidebar = () => {
  const userRoleDisplay = localStorage.getItem('role_display') || 'staff';
  const userRole = localStorage.getItem('role') || 'staff';
  const username = localStorage.getItem('username') || 'User'; 
  const profilePic = localStorage.getItem('profile_pic') || null;
  const { unreadCount } = useNotifications();
  const navigate =useNavigate()
 const menuConfig = {
  admin: [
  { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },

  { title: "Users & Roles", icon: <Users size={20} />, path: "/user-management" },

  { title: "Operations", icon: <Briefcase size={20} />, path: "/admin/operations" }, 
  // (Orders + Shipments + Staff Monitoring combined)

  { title: "Reports & Approvals", icon: <ClipboardList size={20} />, path: "/admin/reports" },
  // (Damage + Overdue + Emergency + Approval)

  { title: "Analytics", icon: <BarChart3 size={20} />, path: "/admin/analytics" },

  { title: "Alerts & Monitoring", icon: <AlertTriangle size={20} />, path: "/admin/alerts" },
  // (Celery + Redis + Overdue + System Alerts)

  { title: "Settings & Logs", icon: <Settings size={20} />, path: "/admin/settings" }
],
  manager: [
  { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },

  { title: "Staff & Tasks", icon: <Users size={20} />, path: "/manager/staff-tasks" },
  // (Staff + Assign + Department tasks)

  { title: "Shipments & Packing", icon: <Briefcase size={20} />, path: "/manager/operations" },

  { title: "Alerts & Overdue", icon: <AlertTriangle size={20} />, path: "/manager/alerts" },

  { title: "Reports", icon: <ClipboardList size={20} />, path: "/manager/reports" },
  // (Damage + Emergency + Review)

  { title: "Performance", icon: <BarChart3 size={20} />, path: "/manager/performance" },

],
  staff: [
    { title: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
    { title: "Task Registry", icon: <ClipboardList size={20} />, path: "/tasks/registry" },
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
      {item.title === "Alerts" && unreadCount > 0 && (
    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
      {unreadCount}
    </span>
  )}

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