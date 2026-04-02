import React from 'react';
import AdminStats from './AdminStats';
import ManagerWorkflow from './ManagerWorkflow';
import StaffPackingQueue from './StaffPackingQueue';
function Home() {
  const userRole = localStorage.getItem('role');
  const userDept = localStorage.getItem('department_name');

  return (
    <div className="dashboard-container">
      {userRole === 'admin' && (
        <section className="admin-section">
          <AdminStats />
        </section>
      )}

      {userRole === 'manager'  && (
        <section className="manager-section">
          <ManagerWorkflow /> 
        </section>
      )}

      {userRole === 'staff'  && (
        <section className="staff-section">
          <StaffPackingQueue/> 
        </section>
      )}
    </div>
  );
};
export default Home;