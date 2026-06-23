import React, { useEffect, useState } from "react";
import axios from "axios";
import { LayoutDashboard, Users, ClipboardList, AlertTriangle, Truck } from "lucide-react";

function ManagerWorkflow() {
  // 1. ALL hooks must be here at the top level
  const [stats, setStats] = useState({ staff: 0, active_tasks: 0, completed_shipments: 0, overdue: 0 });
  const [staffPerDept, setStaffPerDept] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token"); // Get your token

      const res = await axios.get("http://127.0.0.1:8000/api/orders/manager/dashboard/", {
        headers: {
          Authorization: `Bearer ${token}`, // 2. MUST send the token for the UI to work
        },
      });

      if (res.data) {
        setStats(res.data.stats);
        setStaffPerDept(res.data.staff_per_dept);
        setRecentTasks(res.data.recent_tasks);
        setAlerts(res.data.alerts);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
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
        <Card title="Total Staff" value={stats.total_staff} icon={<Users />} />
        <Card title="Active Tasks" value={stats.active_tasks} icon={<ClipboardList />} />
        <Card title="Completed" value={stats.completed_shipments} icon={<Truck />} />
        <Card title="Overdue" value={stats.overdue} icon={<AlertTriangle />} />
      </div>

      {/* 🔷 Staff Breakdown */}
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
          <ul className="space-y-3">
            {recentTasks.map((task) => (
              <li key={task.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-bold text-blue-600">{task.order__order_number}</span>
                  <p className="text-xs text-gray-500">By: {task.staff__username}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alerts */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600 border-b pb-2">
            <AlertTriangle size={18} /> Critical Alerts
          </h2>
          {alerts.map((alert, index) => (
            <div key={index} className="p-3 mb-2 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
              <p className="text-xs text-red-700 font-medium">{alert.message}</p>
            </div>
          ))}
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