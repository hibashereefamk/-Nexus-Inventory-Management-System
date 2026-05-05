import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
  FiPackage, FiClock, FiCheckCircle, FiSearch 
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import ProductVerification from "./VerificationMode";

const API = "http://127.0.0.1:8000";

const StaffTaskTerminal = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [stats, setStats] = useState({ pending: 0, packing: 0, packed: 0 });
  const [activeVerificationTask, setActiveVerificationTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());
  const [inspectionItems, setInspectionItems] = useState([]);
  const [isSelectingProduct, setIsSelectingProduct] = useState(false);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  });

  // --- 1. MISSING FETCH DATA FUNCTION ---
  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/orders/staff/tasks/`, getAuthHeaders()),
        axios.get(`${API}/api/orders/staff/stats/`, getAuthHeaders())
      ]);

      // Handle both DRF paginated and non-paginated responses
      const taskData = Array.isArray(tasksRes.data) ? tasksRes.data : tasksRes.data.results || [];
      
      setTasks(taskData);
      setFilteredTasks(taskData);
      setStats(statsRes.data);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Sync Error:", err);
      toast.error("Failed to sync with ERP server.");
    }
  }, []);

  // --- 2. TRIGGER FETCH ON MOUNT ---
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle verification logic
  const handleOpenVerification = async (taskItem) => {
    try {
      // Corrected URL to match your Django path: staff/tasks/<id>/
      const response = await axios.get(
        `${API}/api/orders/staff/tasks/${taskItem.id}/`, 
        getAuthHeaders()
      );

      const items = response.data.items || [];

      if (items.length === 0) {
        toast.warn("No products found for this task.");
        return;
      }

      setInspectionItems(items); 
      setActiveVerificationTask(taskItem);
      setIsSelectingProduct(true);
      
    } catch (err) {
      toast.error("Could not load products for this task.");
    }
  };

  // Search and Filter Logic
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
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error("Error updating status.");
    }
  };

 // --- RENDER MODES ---

if (isSelectingProduct && activeVerificationTask) {
    const task = activeVerificationTask;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            {/* Navigation Header */}
            <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
                <button 
                    onClick={() => {
                        setIsSelectingProduct(false);
                        setActiveVerificationTask(null);
                    }} 
                    className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
                >
                    ← BACK TO TERMINAL
                </button>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase">
                    Status: {task.status}
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-6">
                {/* 1. Order Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xl font-black text-slate-900">Order Manifest: #{task.order_number}</h2>
                    </div>
                    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
                            <p className="text-sm font-bold text-slate-800">{task.department_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Staff</p>
                            <p className="text-sm font-bold text-slate-800">{task.staff_username}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Deadline</p>
                            <p className="text-sm font-bold text-slate-800">{task.deadline_date}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Assignment Date</p>
                            <p className="text-sm font-bold text-slate-800">
                                {new Date(task.assigned_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Order Items Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Product Details</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Category</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Qty</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inspectionItems.map((item) => (
                                <tr key={item.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-slate-900">{item.product_details?.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400">{item.product_details?.sku}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                            {item.product_details?.category_name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-mono font-bold text-slate-700">
                                        {item.quantity}
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.is_inspected ? (
                                            <span className="flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-black uppercase">
                                                <FiCheckCircle size={12} /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-amber-500 text-[10px] font-black uppercase tracking-tighter">
                                                ○ Awaiting
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
    {item.status === 'DAMAGED' ? (
        /* If item is Damaged, show a red indicator button */
        <button 
            disabled
            className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-red-100 text-red-600 border border-red-200 cursor-not-allowed"
        >
            Issue Reported
        </button>
    ) : item.is_inspected ? (
        /* If item is already verified */
        <button 
            disabled
            className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed"
        >
            Verified ✓
        </button>
    ) : (
        /* Default Action Button */
        <button
            onClick={() => {
                const selectedProduct = {
                    ...item.product_details,
                    order_item_id: item.id,
                    task_id: task.id,
                    department_name: task.department_name,
                    order_number: task.order_number,
                    staff_username: task.staff_username,
                    product_name: item.product_details?.name,
                    quantity: item.quantity,
                };
                setActiveVerificationTask({ ...task, current_product: selectedProduct });
                setIsSelectingProduct(false);
            }}
            className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm transition-all"
        >
            Verify Product
        </button>
    )}
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

// Mode 2: Active Verification Form (Only if NOT selecting and product is picked)
if (!isSelectingProduct && activeVerificationTask?.current_product) {
    return (
        <ProductVerification 
            product={activeVerificationTask.current_product} 
            onBack={() => { 
                setIsSelectingProduct(true);
                fetchData(); 
            }}
            onComplete={() => {
                setActiveVerificationTask(null);
                setIsSelectingProduct(false);
                fetchData();
            }}
        />
    );
}
  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800 p-6 font-sans">
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Fulfillment Terminal</h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <FiClock size={12}/> Last Synced: {lastSynced}
          </div>
        </div>
        <div className="flex gap-4">
           <input 
             type="text" 
             placeholder="Search Order..." 
             className="px-4 py-2 rounded-lg border text-sm w-64"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<FiClock />} color="text-yellow-600 bg-yellow-50" label="Pending" value={stats.pending} />
        <StatCard icon={<FiPackage />} color="text-blue-600 bg-blue-50" label="Packing" value={stats.packing} />
        <StatCard icon={<FiCheckCircle />} color="text-emerald-600 bg-emerald-50" label="Packed" value={stats.packed} />
      </div>

      {/* TASK LIST */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">No active tasks assigned to you.</p>
          </div>
        ) : (
          filteredTasks.map((taskItem) => (
            <div key={taskItem.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex justify-between items-center">
              <div>
                <span className="font-mono font-bold text-blue-700">#{taskItem.order_number}</span>
                <h3 className="font-bold text-slate-900">{taskItem.department_name}</h3>
                <span className="text-xs text-slate-400 uppercase font-bold">{taskItem.status}</span>
              </div>
              
              <div className="flex gap-2">
                {taskItem.status === "PENDING" && (
                  <button onClick={() => updateStatus(taskItem.id, "PACKING")} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg">START PACKING</button>
                )}
                {taskItem.status === "PACKING" && (
                  <button onClick={() => handleOpenVerification(taskItem)} className="px-4 py-2 bg-yellow-500 text-white text-xs font-bold rounded-lg">VERIFY ITEMS</button>
                )}
                {taskItem.status === "PACKED" && (
                  <button onClick={() => updateStatus(taskItem.id, "SHIPPED")} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">SHIP ORDER</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, color, label, value }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

export default StaffTaskTerminal;