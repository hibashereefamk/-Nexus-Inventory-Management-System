import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StaffPackingQueue() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, packing: 0, packed: 0 });
  const department = localStorage.getItem('department_name') || '';

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:8000/api/orders/staff/tasks/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data.results || [];
      setTasks(data);
      setStats({
        pending: data.filter(t => t.status === 'PENDING').length,
        packing: data.filter(t => t.status === 'PACKING').length,
        packed: data.filter(t => t.status === 'PACKED').length
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) return <div className="p-10 text-center font-sans text-gray-400">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#334155]">
      {/* 🔷 TOP NAVIGATION BAR AREA (Mock) */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
           <h1 className="text-xl font-bold tracking-tight text-gray-800">DASHBOARD</h1>
        </div>
        <div className="text-sm font-medium text-gray-500">Staff - {department} Dept</div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto">
        
        {/* 🔷 TODAY'S TASKS (Banner Cards) */}
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Today's Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <BannerCard 
            count={stats.pending + stats.packing} 
            label="Shipments Due" 
            subText="4 High Priority" 
            icon="🚚"
          />
          <BannerCard 
            count="26" 
            label="Expiring Soon" 
            subText="Within 7 Days" 
            icon="📅"
          />
        </div>

        {/* 🔷 PACKING WORKFLOW (Kanban) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-10">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold uppercase tracking-widest">Packing Workflow</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-gray-100">
            <WorkflowColumn 
                title="Pending" 
                items={tasks.filter(t => t.status === 'PENDING')} 
            />
            <WorkflowColumn 
                title="Packing" 
                items={tasks.filter(t => t.status === 'PACKING')} 
            />
            <WorkflowColumn 
                title="Packed" 
                items={tasks.filter(t => t.status === 'PACKED')} 
            />
          </div>
        </div>

        {/* 🔷 RECENT ACTIVITY (Table) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
           <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-bold uppercase tracking-widest">Recent Inventory Activity</h2>
           </div>
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Item Name</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.slice(0, 3).map(task => (
                  <tr key={task.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-500 font-mono">09:15 AM</td>
                    <td className="px-6 py-4 font-bold">{task.order_number}</td>
                    <td className="px-6 py-4">Status Updated</td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-green-600 font-bold px-2 py-1 bg-green-50 rounded text-xs">OK</span>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

/* --- Styled Sub-Components --- */

const BannerCard = ({ count, label, subText, icon }) => (
  <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-6">
      <span className="text-6xl font-black text-gray-900 leading-none">{count}</span>
      <div>
        <p className="text-lg font-bold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 font-medium">{subText}</p>
      </div>
    </div>
    <div className="text-5xl opacity-40 grayscale">{icon}</div>
  </div>
);

const WorkflowColumn = ({ title, items }) => (
  <div className="p-6 bg-white min-h-[300px]">
    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">'{title}'</h3>
    <div className="space-y-4">
      {items.map(task => (
        <div key={task.id} className="group border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
          <div className="flex justify-between items-start mb-3">
             <span className="font-bold text-gray-800">Order #{task.order_number.split('-')[1]}</span>
             <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Priority</span>
          </div>
          <div className="text-[11px] text-gray-400 space-y-1">
            <p>Status: <span className="text-gray-600 font-semibold">{task.status}</span></p>
            <p>Customer Name: <span className="text-gray-600">John Doe</span></p>
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="border-2 border-dashed border-gray-100 rounded-xl h-24 flex items-center justify-center text-xs text-gray-300 uppercase font-bold italic">Empty</div>}
    </div>
  </div>
);

export default StaffPackingQueue;