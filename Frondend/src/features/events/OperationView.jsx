import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OperationsView = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('order-entry');
  const [orders, setOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Tab 1 Logic: Fetch Draft Orders for Admin
  const fetchDraftOrders = async () => {
    const res = await axios.get('/api/admin/orders/'); // AdminOrderListCreateView
    setOrders(res.data);
  };

  const OrderEntryTab = ({ orders, refresh }) => {
  const handleConfirm = async (orderId) => {
    try {
      await axios.post(`/api/admin/orders/${orderId}/confirm/`, { 
        target_department: 1 // Example ID
      });
      alert("Order sent to Manager Queue!");
      refresh();
    } catch (err) {
      console.error("Confirmation failed", err);
    }
  };

  return (
    <div>
      <h3>Draft Orders</h3>
      <table>
        <thead>
          <tr><th>Order #</th><th>Product</th><th>Qty</th><th>Action</th></tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.order_number}</td>
              <td>{order.product_details.name}</td>
              <td>{order.quantity}</td>
              <td>
                <button onClick={() => handleConfirm(order.id)}>Confirm to Manager</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};const TaskManagementTab = ({ assignments, refresh }) => {
  const [selectedStaff, setSelectedStaff] = useState({});

  const handleAssign = async (assignmentId) => {
    await axios.post(`/api/manager/assignments/${assignmentId}/assign-staff/`, {
      staff: selectedStaff[assignmentId],
      priority: 'MED'
    });
    alert("Staff assigned successfully!");
    refresh();
  };

  return (
    <div>
      <h3>Pending Assignments</h3>
      {assignments.map(task => (
        <div key={task.id} className="task-card">
          <p>Order: {task.order_number}</p>
          <select onChange={(e) => setSelectedStaff({...selectedStaff, [task.id]: e.target.value})}>
            <option value="">Select Staff</option>
            {/* Populate with staff from ManagerStaffFulfillmentView[cite: 1] */}
            <option value="10">John Doe (Picker)</option>
          </select>
          <button onClick={() => handleAssign(task.id)}>Assign Task</button>
        </div>
      ))}
    </div>
  );
};
  const fetchPendingAssignments = async () => {
    const res = await axios.get('/api/manager/assignments/'); // ManagerAssignmentListView
    setAssignments(res.data);
  };

  useEffect(() => {
    if (activeTab === 'order-entry') fetchDraftOrders();
    if (activeTab === 'task-mgmt') fetchPendingAssignments();
  }, [activeTab]);

  return (
    <div className="operations-container">
      {/* Tab Navigation */}
      <div className="tabs">
        {userRole === 'admin' && (
          <button onClick={() => setActiveTab('order-entry')}>Tab 1: Order Entry</button>
        )}
        {userRole === 'manager' && (
          <button onClick={() => setActiveTab('task-mgmt')}>Tab 2: Task Management</button>
        )}
        <button onClick={() => setActiveTab('active-ops')}>Tab 3: Active Operations</button>
      </div>

      {/* Tab Content Rendering */}
      <div className="tab-content">
        {activeTab === 'order-entry' && <OrderEntryTab orders={orders} refresh={fetchDraftOrders} />}
        {activeTab === 'task-mgmt' && <TaskManagementTab assignments={assignments} refresh={fetchPendingAssignments} />}
        {activeTab === 'active-ops' && <ActiveOperationsTab />}
      </div>
    </div>
  );
};

export default OperationsView ;