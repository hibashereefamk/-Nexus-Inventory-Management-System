import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiPackage, FiClock, FiCheckCircle, FiAlertCircle, 
  FiNavigation, FiMaximize2, FiArrowRight 
} from "react-icons/fi";
import VerificationMode from "./VerificationMode"; // We will create this next

const API = "http://127.0.0.1:8000";

const StaffTaskTerminal = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ pending: 0, packing: 0, packed: 0 });
  const [activeVerificationTask, setActiveVerificationTask] = useState(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  });

  const fetchData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/orders/staff/tasks/`, getAuthHeaders()),
        axios.get(`${API}/api/orders/staff/stats/`, getAuthHeaders())
      ]);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.results || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id, status) => {
    await axios.patch(`${API}/api/orders/staff/update-task/${id}/`, { status }, getAuthHeaders());
    fetchData();
  };
useEffect(() => {
  axios.get(`${API}/api/orders/staff/tasks/${taskId}/`, getAuthHeaders())
    .then(res => setTask(res.data))
}, [taskId])
  // If a task is selected for verification, show that view instead
  if (activeVerificationTask) {
    return (
      <VerificationMode 
        taskId={activeVerificationTask} 
        onBack={() => { setActiveVerificationTask(null); fetchData(); }} 
      />
    );
  }

  return (
   <div className="min-h-screen bg-gray-50 text-gray-800 p-6 font-sans">
  
  {/* HEADER */}
  <div className="flex justify-between items-center mb-8">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
        Staff Fulfillment Terminal
      </h1>
      <p className="text-xs text-gray-500 uppercase font-semibold mt-1 tracking-widest">
        Active Assignments
      </p>
    </div>
  </div>

  {/* QUICK STATS */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <StatCard icon={<FiClock />} color="text-yellow-500 bg-yellow-100" label="Awaiting" value={stats.pending} />
    <StatCard icon={<FiPackage />} color="text-blue-500 bg-blue-100" label="In Progress" value={stats.packing} />
    <StatCard icon={<FiCheckCircle />} color="text-green-500 bg-green-100" label="Completed" value={stats.packed} />
  </div>

  {/* TASK LIST */}
  <div className="space-y-4">
    {Array.isArray(task.items) &&
  task.items.map(item => (
    <div key={item.id}
        className={`rounded-xl bg-white border shadow-sm hover:shadow-md transition border-l-4 ${
          task.status === "PENDING"
            ? "border-l-yellow-400"
            : task.status === "PACKING"
            ? "border-l-blue-400"
            : "border-l-green-400"
        }`}
      >{item.product_details?.name}
        <div className="p-5 flex flex-wrap lg:flex-nowrap justify-between items-center gap-6">
          
          {/* LEFT */}
          <div className="flex items-center gap-5">
            
            {/* ORDER BOX */}
            <div className="text-center bg-gray-100 p-3 rounded-lg border min-w-[100px]">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">
                Order
              </p>
              <p className="text-indigo-600 font-mono font-bold">
                #{item.order_number}
              </p>
            </div>

            {/* DETAILS */}
            <div>
              <h3 className="text-gray-900 font-semibold text-sm">
                {item.department_name}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FiNavigation size={10} />
                Priority: {item.priority || "NORMAL"}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 ml-auto">
            
            {item.status === "PENDING" && (
              <button
                onClick={() => updateStatus(task.id, "PACKING")}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2"
              >
                Start Packing
              </button>
            )}

            {item.status === "PACKING" && (
              <button
                onClick={() => setActiveVerificationTask(task.id)}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2"
              >
                <FiCheckCircle /> Verify
              </button>
            )}

            {item.status === "PACKED" && (
              <button
                onClick={() => updateStatus(task.id, "SHIPPED")}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Ship Order
              </button>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
  );
};

const StatCard = ({ icon, color, label, value }) => (
  <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
    
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
      {icon}
    </div>

    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-[10px] font-semibold text-gray-500 uppercase">
        {label}
      </p>
    </div>
  </div>
);

export default StaffTaskTerminal;