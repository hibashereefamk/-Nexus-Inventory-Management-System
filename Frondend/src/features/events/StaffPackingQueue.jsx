import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StaffPackingQueue (){
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ lowStock: 0, urgent: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/staff-view/');
      
      // FIX: Ensure data is treated as an array. 
      // If your backend nests the list, use response.data.tasks or similar.
      const rawData = Array.isArray(response.data) ? response.data : (response.data.tasks || []);
      
      setTasks(rawData);
      
      // Use rawData here instead of 'data'
      const lowStockCount = rawData.filter(t => t.total_stock <= t.min_stock_level).length;
      const urgentCount = rawData.filter(t => t.priority === 'URGENT').length;
      
      setStats({ lowStock: lowStockCount, urgent: urgentCount });
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Load Error", err);
      setTasks([]); // Set to empty array on error to prevent filter crash
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/products/${id}/`, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      alert("Status Update Failed: Check department-specific requirements.");
    }
  };

  if (loading) return <div className="p-8 text-center">Initializing Dashboard...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER SECTION */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Operations</h1>
          <p className="text-gray-500 text-sm">Manage inventory and packing workflow</p>
        </div>
        
        <div className="flex gap-4">
          <StatBadge label="Low Stock" count={stats.lowStock} color="bg-orange-500" />
          <StatBadge label="Urgent" count={stats.urgent} color="bg-red-500" />
        </div>
      </header>

      {/* KANBAN QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QueueColumn 
          title="Pending (Available)" 
          items={tasks.filter(t => t.status === 'AVAILABLE')} 
          action={(id) => handleUpdateStatus(id, 'PACKED')}
          btnText="Start Packing"
        />
        <QueueColumn 
          title="In Progress (Packing)" 
          items={tasks.filter(t => t.status === 'PACKED')} 
          action={(id) => handleUpdateStatus(id, 'SHIPPED')}
          btnText="Mark Shipped"
        />
        <QueueColumn 
          title="Completed" 
          items={tasks.filter(t => t.status === 'SHIPPED')} 
          isReadOnly
        />
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const StatBadge = ({ label, count, color }) => (
  <div className={`${color} text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-3`}>
    <span className="text-xs uppercase font-bold tracking-tighter">{label}</span>
    <span className="text-xl font-black">{count}</span>
  </div>
);

const QueueColumn = ({ title, items, action, btnText, isReadOnly }) => (
  <div className="bg-gray-200 bg-opacity-50 rounded-xl p-4 min-h-[500px] border border-gray-200">
    <h3 className="font-bold text-gray-600 mb-4 px-2 flex justify-between">
      {title}
      <span className="bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full text-xs">{items.length}</span>
    </h3>
    <div className="space-y-3">
      {items.map(task => (
        <EnhancedTaskCard 
          key={task.id} 
          task={task} 
          onAction={() => action(task.id)} 
          btnText={btnText} 
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  </div>
);

const EnhancedTaskCard = ({ task, onAction, btnText, isReadOnly }) => {
  // Logic to determine which department detail to show
  const getDeptDetail = () => {
    if (task.expiry_date) return `Exp: ${task.expiry_date}`;
    if (task.warranty_expiry) return `Warranty: ${task.warranty_expiry}`;
    if (task.reorder_level) return `Reorder @ ${task.reorder_level}`;
    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-blue-300 transition-all">
      <div className="flex justify-between mb-2">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
          {task.category?.name || 'General'}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
          task.priority === 'URGENT' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {task.priority}
        </span>
      </div>
      
      <h4 className="font-bold text-gray-800 leading-tight">{task.name}</h4>
      <p className="text-xs text-gray-400 mt-1">SKU: {task.sku}</p>

      {/* Dynamic Department Info */}
      <div className="mt-3 flex items-center gap-2">
        <div className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded">
          {getDeptDetail()}
        </div>
        {task.is_low_stock && (
          <span className="text-[10px] text-red-500 font-bold animate-pulse">LOW STOCK</span>
        )}
      </div>

      {!isReadOnly && (
        <div className="mt-4 pt-3 border-t flex justify-between items-center">
          <span className="text-xs font-bold text-gray-600">Qty: {task.quantity_to_ship}</span>
          <button 
            onClick={onAction}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded-md font-medium"
          >
            {btnText}
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffPackingQueue;