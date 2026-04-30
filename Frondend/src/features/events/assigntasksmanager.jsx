import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrderEntryTab = ({ orders, refresh }) => {
  // FIXED: Added missing closing brace for the if statement below
  if (!orders || !Array.isArray(orders)) {
    return <div>Loading orders or invalid data format...</div>;
  } // <--- This was missing

  const handleConfirm = async (orderId) => {
    try {
      // Matches path: /api/admin/orders/<int:pk>/confirm/
      await axios.post(`/api/admin/orders/${orderId}/confirm/`, { 
        target_department: 1 
      });
      alert("Order confirmed and moved to Manager queue!");
      refresh();
    } catch (err) {
      console.error("Confirmation failed", err);
    }
  };

  return (
    <div>
      <h3>Draft Orders (Admin Only)</h3>
      <table border="1" width="100%">
        <thead>
          <tr><th>Order #</th><th>Product</th><th>Qty</th><th>Action</th></tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.order_number}</td>
              {/* Optional chaining safely handles nested product data */}
              <td>{order.product_details?.name || "N/A"}</td>
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
};

const TaskManagementTab = ({ assignments, refresh }) => {
  const [selectedStaff, setSelectedStaff] = useState({});
  const [staffList, setStaffList] = useState([]);

  // Fetch available staff using the fulfillment-data endpoint
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get('/api/manager/fulfillment-data/');
        setStaffList(res.data.staff); // Assuming the backend returns { staff: [...] }
      } catch (err) {
        console.error("Failed to fetch staff data", err);
      }
    };
    fetchStaff();
  }, []);

  const handleAssign = async (assignmentId) => {
    try {
      // Matches path: manager/assignments/<int:pk>/assign-staff/[cite: 1]
      await axios.post(`/api/manager/assignments/${assignmentId}/assign-staff/`, {
        staff: selectedStaff[assignmentId],
        priority: 'MED'
      });
      alert("Staff assigned successfully!");
      refresh();
    } catch (err) {
      console.error("Assignment failed", err);
    }
  };

  return (
    <div>
      <h3>Pending Assignments (Manager Only)</h3>
      {assignments.length === 0 ? <p>No tasks waiting for assignment.</p> : (
        assignments.map(task => (
          <div key={task.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <p><strong>Order:</strong> {task.order_number}</p>
            <select 
              value={selectedStaff[task.id] || ""} 
              onChange={(e) => setSelectedStaff({...selectedStaff, [task.id]: e.target.value})}
            >
              <option value="">Select Staff</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.username} ({s.current_tasks} active tasks)</option>
              ))}
            </select>
            <button onClick={() => handleAssign(task.id)} disabled={!selectedStaff[task.id]}>
              Assign Staff
            </button>
          </div>
        ))
      )}
    </div>
  );
};

// Placeholder for Tab 3
const ActiveOperationsTab = () => <div><h3>Active Warehouse Flow</h3><p>Monitoring current picking and packing...</p></div>;

const OperationsView = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('order-entry');
  const [orders, setOrders] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const fetchDraftOrders = async () => {
  try {
    const res = await axios.get('/api/admin/orders/');
    // Handle both direct lists and paginated responses[cite: 1]
    const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
    setOrders(data);
  } catch (err) { 
    console.error(err); 
    setOrders([]); 
  }
};

  const fetchPendingAssignments = async () => {
    try {
      const res = await axios.get('/api/manager/assignments/'); // ManagerAssignmentListView[cite: 1]
      setAssignments(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === 'order-entry' && userRole === 'admin') fetchDraftOrders();
    if (activeTab === 'task-mgmt' && userRole === 'manager') fetchPendingAssignments();
  }, [activeTab, userRole]);

  return (
    <div className="operations-container">
      <div className="tabs" style={{ marginBottom: '20px' }}>
        {userRole === 'admin' && (
          <button onClick={() => setActiveTab('order-entry')}>Order Entry</button>
        )}
        {userRole === 'manager' && (
          <button onClick={() => setActiveTab('task-mgmt')}>Task Management</button>
        )}
        <button onClick={() => setActiveTab('active-ops')}>Active Operations</button>
      </div>

      <div className="tab-content">
        {activeTab === 'order-entry' && userRole === 'admin' && (
          <OrderEntryTab orders={orders} refresh={fetchDraftOrders} />
        )}
        {activeTab === 'task-mgmt' && userRole === 'manager' && (
          <TaskManagementTab assignments={assignments} refresh={fetchPendingAssignments} />
        )}
        {activeTab === 'active-ops' && <ActiveOperationsTab />}
      </div>
    </div>
  );
};

export default OperationsView ;