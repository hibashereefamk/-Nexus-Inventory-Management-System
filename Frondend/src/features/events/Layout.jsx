import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import TopNavbar from './TopNavbar';
import { useNotifications } from '/src/hooks/useTaskNotifications.jsx';

// Helper hook to detect screen size changes dynamically
const useWindowWidth = () => {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

const Layout = () => {
  const { notifications, badgeCount, setBadgeCount } = useNotifications();
  const windowWidth = useWindowWidth();

  // Dynamically calculate sidebar offset based on media breakpoint (1000px)
  const isCollapsed = windowWidth <= 1000;
  const sidebarWidth = isCollapsed ? '72px' : '260px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      {/* Main Container synchronized with Sidebar */}
      <div
        style={{
          marginLeft: sidebarWidth,
          width: `calc(100% - ${sidebarWidth})`,
          minHeight: '100vh',
          transition: 'margin-left 0.25s ease, width 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TopNavbar
          notifications={notifications}
          badgeCount={badgeCount}
          resetBadge={() => setBadgeCount(0)}
        />

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            padding: '20px',
            backgroundColor: '#f9fafb',
            boxSizing: 'border-box',
          }}
        >
          <Outlet context={{ notifications }} />
        </main>
      </div>
    </div>
  );
};

export default Layout;