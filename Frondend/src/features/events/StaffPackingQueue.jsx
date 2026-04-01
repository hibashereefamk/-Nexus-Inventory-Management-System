import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Zap, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function StaffPackingQueue() {
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // 1. Initialize dashboardStats with default values to prevent crashes on first render
  const [dashboardStats, setDashboardStats] = useState({
    total_assigned: 0,
    pending: 0,
    packing: 0,
    shipped: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const department = localStorage.getItem('department_name') || 'Staff';

  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setError("No login token found. Please log in.");
      setLoading(false);
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      setLoading(true);
      // Fetch Tasks, Notifications, and the new Stats endpoint in parallel
      const [taskRes, notifyRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/orders/staff/tasks/`, config),
        axios.get(`${API_BASE}/api/inventory/notifications/`, config),
        axios.get(`${API_BASE}/api/orders/staff/stats/`, config) 
      ]);

      setTasks(taskRes.data.results || []);
      setNotifications(notifyRes.data.results || []);
      // 2. Update the stats state with data from the new backend view
      setDashboardStats(statsRes.data); 
      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError("Could not connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#334155]">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">STAFF DASHBOARD</h1>
        <div className="text-sm text-gray-500">Dept: {department}</div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!error && (
          <>
            {/* Stat Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <BannerCard 
                count={dashboardStats.total_assigned} 
                label="Total Assigned" 
                subText="All Time" 
                icon={<Zap size={30} />} 
              />
              <BannerCard 
                count={dashboardStats.pending} 
                label="Pending" 
                subText="Awaiting Action" 
                icon={<AlertTriangle size={30} />} 
              />
              <BannerCard 
                count={dashboardStats.packing} 
                label="In Progress" 
                subText="Currently Packing" 
                icon={<Zap size={30} />} 
              />
              <BannerCard 
                count={dashboardStats.shipped} 
                label="Completed" 
                subText="Shipped" 
                icon={<Zap size={30} />} 
              />
            </div>

            {/* Kanban Board Container */}
            <div className="bg-gray-100 rounded-xl border shadow-inner mb-10 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                <WorkflowColumn 
                  title="Pending" 
                  items={tasks.filter(t => t.status === 'PENDING')} 
                  onItemClick={(id) => navigate(`/tasks/detail/${id}`)}
                />
                <WorkflowColumn 
                  title="Packing" 
                  items={tasks.filter(t => t.status === 'PACKING')} 
                  onItemClick={(id) => navigate(`/tasks/detail/${id}`)}
                />
                <WorkflowColumn 
                  title="Shipped" 
                  items={tasks.filter(t => t.status === 'SHIPPED')} 
                  onItemClick={(id) => navigate(`/tasks/detail/${id}`)}
                />
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-xl border shadow-sm">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase">Recent Inventory Notifications</h2>
                <button onClick={() => navigate('/inventory/alerts')} className="text-xs text-blue-600 font-bold hover:underline">VIEW ALL</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-400 font-semibold">
                    <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Title</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {notifications.slice(0, 5).map(note => (
                      <tr 
                        key={note.id} 
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/inventory/reorder/${note.id}`)}
                      >
                        <td className="px-6 py-4 text-xs font-mono">{new Date(note.created_at).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{note.title}</td>
                        <td className="px-6 py-4 text-blue-600 font-bold text-[10px]">REORDER →</td>
                      </tr>
                    ))}
                    {notifications.length === 0 && (
                      <tr><td colSpan="3" className="p-10 text-center text-gray-400">No recent notifications</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Sub-components remain the same but ensure they receive the proper props
const BannerCard = ({ count, label, subText, icon, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white border p-6 rounded-xl flex items-center justify-between shadow-sm transition-all ${onClick ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : ''}`}
  >
    <div className="flex items-center gap-6">
      <span className="text-5xl font-black text-gray-900 leading-none">{count}</span>
      <div>
        <p className="text-lg font-bold text-slate-800">{label}</p>
        <p className="text-xs text-gray-400">{subText}</p>
      </div>
    </div>
    <div className="text-4xl opacity-20 text-blue-600">{icon}</div>
  </div>
);

const WorkflowColumn = ({ title, items, onItemClick }) => (
  <div className="p-4 min-h-[400px] bg-white/50 rounded-lg border border-dashed border-gray-300">
    <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-[0.2em] px-2">{title}</h3>
    <div className="space-y-3">
      {items.map(task => (
        <div 
          key={task.id} 
          onClick={() => onItemClick(task.id)}
          className="group border border-slate-200 rounded-xl p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all shadow-sm bg-white"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-slate-800 text-sm">Order #{task.order_number}</span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-slate-400 font-mono">{task.deadline_date}</span>
            <span className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">MANAGE →</span>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-center text-xs text-slate-400 italic py-10">No tasks in this stage</p>}
    </div>
  </div>
);

export default StaffPackingQueue;