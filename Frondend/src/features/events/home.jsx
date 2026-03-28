import React from 'react';
import AdminStats from './AdminStats';
import ManagerWorkflow from './ManagerWorkflow';
import StaffPackingQueue from './StaffPackingQueue';
function Home() {
  const userRole = localStorage.getItem('role');
  const userDept = localStorage.getItem('department_name');

  return (
    <div className="dashboard-container">
      <header>
        <h1>{userRole.toUpperCase()} DASHBOARD</h1>
        <p>Current Department: {userDept}</p>
      </header>
      {userRole === 'admin' && (
        <section className="admin-section">
          <AdminStats />
        </section>
      )}

      {(userRole === 'manager' || userRole === 'admin') && (
        <section className="manager-section">
          <ManagerWorkflow /> 
        </section>
      )}

      {(userRole === 'staff' || userRole === 'manager') && (
        <section className="staff-section">
          <StaffPackingQueue/> 
        </section>
      )}
    </div>
  );
};
export default Home;