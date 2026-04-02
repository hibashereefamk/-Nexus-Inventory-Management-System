import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  AlertTriangle,
  Truck,
  Package,
} from "lucide-react";

function ManagerWorkflow() {
  const [stats, setStats] = useState({
    staff: 0,
    active_tasks: 0,
    completed_shipments: 0,
    overdue: 0,
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. FIX: Use the full URL or ensure your axios instance has the baseURL set to http://127.0.0.1:8000
      // Also ensure the Bearer token is attached if not using a global interceptor
      const token = localStorage.getItem("token"); 
      const [staffPerDept, setStaffPerDept] = useState([]);

// Inside fetchDashboardData
const res = await axios.get("http://127.0.0.1:8000/api/orders/manager/dashboard/");
if (res.data) {
    setStats(res.data.stats);
    setStaffPerDept(res.data.staff_per_dept); // Store the new list
    setRecentTasks(res.data.recent_tasks);
    setAlerts(res.data.alerts);
}
    } catch (error) {
      console.error("Error loading dashboard:", error);
      // Optional: setStats to 0 to prevent "undefined" errors if request fails
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center font-semibold">Connecting to Inventory Server...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <LayoutDashboard /> Manager Dashboard
      </h1>

      {/* 🔷 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow mb-6">
    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users size={18} /> Staff Breakdown by Department
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {staffPerDept.map((dept, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500 uppercase">{dept.department__name || "Unassigned"}</p>
                <p className="text-xl font-bold text-blue-600">{dept.count} Staff</p>
            </div>
        ))}
    </div>
</div>
        <Card title="Active Tasks" value={stats.active_tasks} icon={<ClipboardList />} />
        <Card title="Completed Shipments" value={stats.completed_shipments} icon={<Truck />} />
        <Card title="Overdue Tasks" value={stats.overdue} icon={<AlertTriangle />} />
      </div>
<div className="bg-white p-5 rounded-2xl shadow mb-6">
    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users size={18} /> Staff Breakdown by Department
    </h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {staffPerDept.map((dept, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500 uppercase">{dept.department__name || "Unassigned"}</p>
                <p className="text-xl font-bold text-blue-600">{dept.count} Staff</p>
            </div>
        ))}
    </div>
</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b pb-2">
            <ClipboardList size={18} /> Recent Department Tasks
          </h2>

          {recentTasks.length === 0 ? (
            <p className="text-gray-400 italic">No recent activity found.</p>
          ) : (
            <ul className="space-y-3">
              {recentTasks.map((task) => (
                <li key={task.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col">
                    <span className="font-bold text-blue-600">{task.order_number}</span>
                    <span className="text-xs text-gray-500 font-medium">By: {task.staff__username}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    task.status === 'PACKING' ? 'bg-blue-100 text-blue-700' : 
                    task.status === 'PACKED' ? 'bg-yellow-100 text-yellow-700' :
                    task.status === 'SHIPPED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {task.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600 border-b pb-2">
            <AlertTriangle size={18} /> Critical Alerts
          </h2>

          {alerts.length === 0 ? (
            <p className="text-gray-400 italic">System clear. No alerts.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((alert, index) => (
                <li key={alert.id || index} className="p-3 border-l-4 border-red-500 rounded-r-lg bg-red-50">
                  <p className="text-sm font-bold text-red-800 uppercase text-[10px] tracking-tight">
                    {alert.title || "SYSTEM ALERT"}
                  </p>
                  <p className="text-xs text-red-700 font-medium">{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const Card = ({ title, value, icon }) => (
  <div className="bg-white p-5 rounded-2xl shadow flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase">{title}</p>
      <h2 className="text-2xl font-black text-gray-800">{value}</h2>
    </div>
    <div className="text-blue-600 p-3 bg-blue-50 rounded-xl">{icon}</div>
  </div>
);

export default ManagerWorkflow;