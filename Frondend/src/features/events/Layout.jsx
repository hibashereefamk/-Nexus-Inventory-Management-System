import React from 'react';
import { Outlet } from 'react-router-dom';// Adjust path to your Sidebar
import Sidebar from './sidebar';

const Layout = () => {
  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar is fixed on the left */}
      <Sidebar/>

      {/* Main content area on the right */}
      <main style={{ 
        marginLeft: '260px', 
        padding: '20px', 
        width: 'calc(100% - 260px)', 
        minHeight: '100vh',
        backgroundColor: '#f9fafb' 
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;