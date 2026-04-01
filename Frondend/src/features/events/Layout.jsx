import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import TopNavbar from './TopNavbar';
import useTaskNotifications from '../../hooks/useTaskNotifications';

const Layout = () => {
  const { notifications, badgeCount, setBadgeCount } = useTaskNotifications();
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />

      <div style={{ 
        marginLeft: '260px',
        width: '100%'
      }}>
        <TopNavbar 
          notifications={notifications} 
          badgeCount={badgeCount} 
          resetBadge={() => setBadgeCount(0)} 
        />

        {/* Main Content */}
        <main style={{ 
          padding: '20px', // adjust for navbar height
          backgroundColor: '#f9fafb'
        }}>
          <Outlet context={{ notifications }} />
        </main>

      </div>
    </div>
  );
};

export default Layout;