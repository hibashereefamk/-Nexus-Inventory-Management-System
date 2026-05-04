import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiPackage, FiClock, FiCheckCircle, FiAlertCircle, 
  FiNavigation, FiPrinter, FiEye, FiSearch, FiFilter, FiUser
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import Verification from "./VerificationMode";

const API = "http://127.0.0.1:8000";

const StaffTaskTerminal = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [stats, setStats] = useState({ pending: 0, packing: 0, packed: 0 });
  const [activeVerificationTask, setActiveVerificationTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  });
  
  const fetchData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/orders/staff/tasks/`, getAuthHeaders()),
        axios.get(`${API}/api/orders/staff/stats/`, getAuthHeaders())
      ]);
      const data = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.results || [];
      setTasks(data);
      setFilteredTasks(data);
      setStats(statsRes.data);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      toast.error("Failed to sync with ERP server.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filtering Logic
  useEffect(() => {
    let result = tasks.filter(t => 
      t.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filterPriority !== "ALL") {
      result = result.filter(t => t.priority === filterPriority);
    }
    setFilteredTasks(result);
  }, [searchTerm, filterPriority, tasks]);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/api/orders/staff/update-task/${id}/`, { status }, getAuthHeaders());
      toast.success(`Transaction successful: Status set to ${status}`);
      fetchData();
    } catch (err) {
      toast.error("Critical error during status update.");
    }
  };

  if (activeVerificationTask) {
    return (
      <Verification 
        task={activeVerificationTask} 
        onBack={() => { setActiveVerificationTask(null); fetchData(); }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800 p-6 font-sans">
      <Toaster position="top-right" />
      
      {/* ERP HEADER */}
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <div className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em] mb-1">
            Home - Fulfillment -Terminal
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Fulfillment Terminal</h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <FiClock size={12}/> Last Synced: {lastSynced} | Operator: Hiba Shereefa (Staff)
          </div>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Order ID / Dept..." 
                className="pl-10 pr-4 py-2 rounded-lg border bg-white text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <select 
             className="bg-white border rounded-lg px-4 py-2 text-sm outline-none"
             value={filterPriority}
             onChange={(e) => setFilterPriority(e.target.value)}
           >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal</option>
           </select>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<FiClock />} color="text-yellow-600 bg-yellow-50" label="Awaiting Action" value={stats.pending} />
        <StatCard icon={<FiPackage />} color="text-blue-600 bg-blue-50" label="Currently Packing" value={stats.packing} />
        <StatCard icon={<FiCheckCircle />} color="text-emerald-600 bg-emerald-50" label="Ready for Ship" value={stats.packed} />
      </div>

     <div className="space-y-4">
  {filteredTasks.map((taskItem) => {
    const progress = taskItem.total_items
      ? (taskItem.inspected_count / taskItem.total_items) * 100
      : 0;

    return (
      <div
        key={taskItem.id}
        className="group rounded-xl bg-white border border-slate-200 shadow-sm flex p-5 justify-between"
      >
        {/* LEFT SIDE */}
        <div className="flex items-center gap-6">
          <div className="bg-slate-50 p-3 rounded-lg border text-center min-w-[120px]">
            <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">
              Order UUID
            </span>
            <span className="font-mono font-bold text-blue-700 text-sm">
              #{taskItem.order_number}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              {taskItem.department_name}
            </h3>
            {taskItem.is_damaged && (
              <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded-full font-bold">
                DAMAGED ALERT
              </span>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-8">
          
          {/* ✅ REAL PROGRESS */}
          {taskItem.status === "PACKING" && (
            <div className="w-32">
              <div className="flex justify-between text-[10px] font-bold mb-1 uppercase text-slate-400">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex items-center gap-2">

  {/* START PACKING */}
  {taskItem.status === "PENDING" && (
    <button
      onClick={() => updateStatus(taskItem.id, "PACKING")}
      className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg 
                 hover:bg-slate-800 active:scale-95 transition-all shadow-md"
    >
      START PACKING
    </button>
  )}

  {taskItem.status === "PACKING" && (
    <button
      onClick={() => setActiveVerificationTask(taskItem)}
      className="px-5 py-2 bg-yellow-500 text-white text-xs font-bold rounded-lg 
                 hover:bg-yellow-600 active:scale-95 transition-all shadow-md 
                 flex items-center gap-2"
    >
      VERIFY
    </button>
  )}

  {/* REQUEST APPROVAL */}
  {taskItem.status === "PACKED" && (
    <button
      onClick={() => updateStatus(taskItem.id, "APPROVAL_REQUESTED")}
      className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg 
                 hover:bg-emerald-700 active:scale-95 transition-all shadow-md"
    >
      REQUEST APPROVAL
    </button>
  )}

</div>
        </div>
      </div>
    );
  })}
</div>
</div>
  )
};


const StatCard = ({ icon, color, label, value }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

export default StaffTaskTerminal;