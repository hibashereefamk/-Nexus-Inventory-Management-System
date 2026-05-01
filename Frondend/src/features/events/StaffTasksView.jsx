import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return { headers: { Authorization: `Bearer ${token}` } };
};

function StaffTasksView() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});

  const fetchTasks = async () => {
    const res = await axios.get(`${API}/api/orders/staff/tasks/`, getAuthHeaders());
    setTasks(res.data);
  };

  const fetchStats = async () => {
    const res = await axios.get(`${API}/api/orders/staff/stats/`, getAuthHeaders());
    setStats(res.data);
  };

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  // ✅ UPDATE STATUS
  const updateStatus = async (id, status) => {
    await axios.patch(
      `${API}/api/orders/staff/update-task/${id}/`,
      { status },
      getAuthHeaders()
    );
    fetchTasks();
    fetchStats();
  };

  // ✅ INSPECT PRODUCTS
  const handleInspect = async (task) => {
    let inspections = {};

    task.items.forEach((item) => {
      inspections[item.product] = {
        is_inspected: !item.is_inspected,
      };
    });

    await axios.patch(
      `${API}/api/orders/staff/tasks/${task.id}/inspect/`,
      { inspections },
      getAuthHeaders()
    );

    fetchTasks();
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-6">Staff Task Dashboard</h1>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Total" value={stats.total_assigned || 0} />
        <StatCard title="Pending" value={stats.pending || 0} />
        <StatCard title="Packing" value={stats.packing || 0} />
        <StatCard title="Shipped" value={stats.shipped || 0} />
      </div>

      {/* TASK LIST */}
      <div className="space-y-6">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-5 rounded-xl shadow border"
          >

            {/* HEADER */}
            <div className="flex justify-between mb-4">
              <div>
                <p className="font-mono text-indigo-600 text-lg">
                  {task.order_number}
                </p>
                <p className="text-sm text-gray-500">
                  {task.department_name}
                </p>
              </div>

              <StatusBadge status={task.status} />
            </div>

            {/* PRODUCTS */}
            <div className="space-y-2 mb-4">
              {task.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border p-2 rounded"
                >
                  <div>
                    <p className="font-medium">
                      {item.product_details?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={item.is_inspected}
                    readOnly
                  />
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 justify-end">

              {task.status === "PENDING" && (
                <button
                  onClick={() => updateStatus(task.id, "PACKING")}
                  className="bg-blue-500 text-white px-4 py-1 rounded"
                >
                  Start Packing
                </button>
              )}

              {task.status === "PACKING" && (
                <>
                  <button
                    onClick={() => handleInspect(task)}
                    className="bg-yellow-500 text-white px-4 py-1 rounded"
                  >
                    Inspect
                  </button>

                  <button
                    onClick={() => updateStatus(task.id, "SHIPPED")}
                    className="bg-green-600 text-white px-4 py-1 rounded"
                  >
                    Ship
                  </button>
                </>
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

const StatCard = ({ title, value }) => (
  <div className="bg-white p-4 rounded shadow text-center">
    <p className="text-xs text-gray-400">{title}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PACKING: "bg-blue-100 text-blue-700",
    PACKED: "bg-green-100 text-green-700",
    SHIPPED: "bg-gray-200 text-gray-700",
  };

  return (
    <span className={`px-3 py-1 rounded text-xs ${styles[status]}`}>
      {status}
    </span>
  );
};

export default StaffTasksView;