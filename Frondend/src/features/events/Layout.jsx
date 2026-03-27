import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import TopNavbar from './TopNavbar';

const Layout = () => {
  return (
    <div style={{ display: 'flex' }}>
      
      {/* Sidebar (Left) */}
      <Sidebar />

      {/* Right Side (Navbar + Content) */}
      <div style={{ 
        marginLeft: '260px',
        width: '100%'
      }}>
        
        {/* Top Navbar */}
        <TopNavbar />

        {/* Main Content */}
        <main style={{ 
          padding: '20px',
          minHeight: 'calc(100wh - 260px)',
          minHeight: 'calc(100vh - 60px)', // adjust for navbar height
          backgroundColor: '#f9fafb'
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;