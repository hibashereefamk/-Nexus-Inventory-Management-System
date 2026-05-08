
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
  FiPackage, FiClock, FiCheckCircle, FiSearch,FiXCircle ,
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

 const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/api/orders/staff/update-task/${id}/`, { status }, getAuthHeaders());
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error("Error updating status.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

 const handleOpenVerification = async (taskItem) => {
  try {
    const pId = taskItem.order_details.product; // Get Product ID
    
    // 1. Fetch the full history for this specific product
    const historyRes = await axios.get(
      `${API}/api/inventory/verify-products/history/${pId}/`, 
      getAuthHeaders()
    );

    // 2. Get the latest record (since history is sorted by timestamp)
    const latestVerification = historyRes.data.length > 0 ? historyRes.data[0] : null;

    const items = [{
      ...taskItem.order_details,
      product_details: taskItem.order_details.product_details,
      // 3. ATTACH THE FULL JSON DATA HERE
      last_verification: latestVerification, 
      is_inspected: false,
    }];

    setInspectionItems(items); 
    setActiveVerificationTask(taskItem);
    setIsSelectingProduct(true);
    
  } catch (err) {
    toast.error("ERP History Sync Error.");
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
                  {task.status} | {task.approval_status}
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
  <React.Fragment key={item.id}>
    <tr className="border-b border-slate-100">
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
  {item.issue_status === 'DAMAGED' ? (
    <div className="flex flex-col items-end gap-2">
      <button 
        disabled
        className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-red-100 text-red-600 border border-red-200 cursor-not-allowed"
      >
        Issue Reported
      </button>
      
      {/* NEW: Explicit button to see the report and start fixing */}
      <button
        onClick={() => {
          setActiveVerificationTask({ 
            ...task, 
            current_product: {
              ...item.product_details,
              order_item_id: item.id,
              task_id: task.id,
              product_name: item.product_details?.name,
              issue_description: task.issue_description // From your handleOpenVerification logic
            } 
          });
          setIsSelectingProduct(false);
        }}
        className="text-[10px] font-bold text-red-700 underline hover:text-red-900"
      >
        View Damage Report & Start Rework
      </button>
    </div>
  
  ) : item.is_inspected ? (
    <button 
      disabled
      className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200"
    >
      Verified ✓
    </button>
  ) : (
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

        console.log("SELECTED PRODUCT:", selectedProduct);

        setActiveVerificationTask({ 
          ...task, 
          current_product: selectedProduct 
        });
        setIsSelectingProduct(false);
      }}
      className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase bg-blue-600 text-white hover:bg-blue-700"
    >
      Verify Product
    </button>
  )}
</td>
                                </tr>
                            {item.last_verification && !item.last_verification.is_passed && (
      <tr>
        <td colSpan="5" className="p-0">
          <div className="bg-red-50 border-x-4 border-red-500 m-2 p-4 rounded-lg shadow-inner">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-xs font-black text-red-800 uppercase flex items-center gap-2">
                <FiXCircle /> Audit Failure Report
              </h4>
              <span className="text-[10px] font-mono text-red-400">
                Log ID: {item.last_verification.id} | {new Date(item.last_verification.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Checklist Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              {/* Logic to map boolean fields to icons */}
              {Object.entries(item.last_verification).map(([key, value]) => {
                if (typeof value === 'boolean' && key !== 'is_passed') {
                  return (
                    <div key={key} className="flex items-center gap-2">
                      {value ? 
                        <FiCheckCircle className="text-emerald-500" /> : 
                        <FiXCircle className="text-red-500" />
                      }
                      <span className={`text-[10px] font-bold ${value ? 'text-slate-500' : 'text-red-700 underline'}`}>
                        {key.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="bg-white/60 p-2 rounded border border-red-100">
               <p className="text-[10px] font-black text-red-400 uppercase">Staff Comments:</p>
               <p className="text-sm italic text-slate-700">"{item.last_verification.comments}"</p>
            </div>
          </div>
        </td>
      </tr>
    )}
  </React.Fragment>
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
            assignmentId={activeVerificationTask.id}
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

     <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
  <table className="w-full text-sm">
    <thead className="bg-slate-50 border-b">
      <tr>
        <th className="p-4 text-left text-xs font-bold text-slate-500">Order</th>
        <th className="p-4 text-left text-xs font-bold text-slate-500">Dedline Date</th>
        <th className="p-4 text-center text-xs font-bold text-slate-500">Priority</th>
        <th className="p-4 text-center text-xs font-bold text-slate-500">Status</th>
        <th className="p-4 text-center text-xs font-bold text-slate-500">Progress</th>
        <th className="p-4 text-right text-xs font-bold text-slate-500">Action</th>
      </tr>
    </thead>

    <tbody>
      {filteredTasks.map(task => (
        <tr key={task.id} className="border-b hover:bg-slate-50 transition">

          {/* ORDER */}
          <td className="p-4">
            <p className="font-mono font-bold text-blue-700">
              #{task.order_number}
            </p>
            <p className="text-xs text-slate-400">
  {task.assigned_at?.split("T")[0]} {" "}
  {task.assigned_at?.split("T")[1]?.split(".")[0]}
</p>
          </td>

          {/* DEPARTMENT */}
          <td className="p-4 font-semibold text-slate-700">
            {task.deadline_date}
          </td>

          {/* PRIORITY */}
          <td className="p-4 text-center">
            <span className={`px-2 py-1 text-xs font-bold rounded
              ${task.priority === "HIGH" && "bg-red-100 text-red-600"}
              ${task.priority === "MED" && "bg-yellow-100 text-yellow-600"}
              ${task.priority === "LOW" && "bg-green-100 text-green-600"}
            `}>
              {task.priority}
            </span>
          </td>

          {/* STATUS */}
          <td className="p-4 text-center">
            <span className={`px-3 py-1 text-xs font-bold rounded-full
              ${task.status === "PENDING" && "bg-gray-100 text-gray-600"}
              ${task.status === "PACKING" && "bg-blue-100 text-blue-600"}
              ${task.status === "PACKED" && "bg-purple-100 text-purple-600"}
              ${task.status === "SHIPPED" && "bg-green-100 text-green-600"}
            `}>
              {task.status}
            </span>

            {task.status === "PACKED" && task.approval_status === "PENDING" && (
              <p className="text-[10px] text-yellow-500 mt-1">
                Waiting Approval
              </p>
            )}
          </td>

          {/* PROGRESS BAR */}
          <td className="p-4">
            <div className="w-full bg-slate-200 h-2 rounded-full">
              <div
                className={`h-2 rounded-full ${
                  task.status === "PENDING" ? "w-[25%] bg-gray-400" :
                  task.status === "PACKING" ? "w-[50%] bg-blue-500" :
                  task.status === "PACKED" ? "w-[75%] bg-purple-500" :
                  "w-full bg-green-500"
                }`}
              />
            </div>
          </td>

        {/* ACTION */}
<td className="p-4 text-right">
  <div className="flex justify-end gap-2 flex-wrap">

    {/* =====================================
        ISSUE / DAMAGE WORKFLOW
    ====================================== */}
    {task.verification_status === 'FAILED' && (
      <button
        onClick={() => handleOpenVerification(task)}
        className="
          px-4 py-2
          bg-red-600 hover:bg-red-700
          text-white text-[11px] font-black uppercase tracking-wide
          rounded-xl shadow-sm
          transition-all duration-200
        "
      >
        Resolve QC Failure
      </button>
    )}

    {/* =====================================
        PENDING → START PICKING
    ====================================== */}
    {task.status === "PENDING" && (
      <button
        onClick={() => updateStatus(task.id, "PACKING")}
        className="
          px-4 py-2
          bg-slate-900 hover:bg-black
          text-white text-[11px] font-black uppercase tracking-wide
          rounded-xl shadow-sm
          transition-all duration-200
        "
      >
        Start Fulfillment
      </button>
    )}

    {/* =====================================
        PACKING → VERIFY
    ====================================== */}
    {task.status === "PACKING" &&
      task.verification_status !== "FAILED" && (
      <button
        onClick={() => handleOpenVerification(task)}
        className="
          px-4 py-2
          bg-blue-600 hover:bg-blue-700
          text-white text-[11px] font-black uppercase tracking-wide
          rounded-xl shadow-sm
          transition-all duration-200
        "
      >
        Run QC Check
      </button>
    )}

    {/* =====================================
        WAITING FOR MANAGER
    ====================================== */}
    {task.status === "PACKED" &&
      task.approval_status === "PENDING" && (
      <span
        className="
          inline-flex items-center
          px-4 py-2
          bg-amber-50
          text-amber-700
          border border-amber-200
          text-[10px] font-black uppercase tracking-widest
          rounded-full
        "
      >
        Awaiting Manager Approval
      </span>
    )}

    {/* =====================================
        APPROVED → READY TO SHIP
    ====================================== */}
    {task.status === "PACKED" &&
      task.approval_status === "APPROVED" && (
      <button
        onClick={() => updateStatus(task.id, "SHIPPED")}
        className="
          px-5 py-2
          bg-emerald-600 hover:bg-emerald-700
          text-white text-[11px] font-black uppercase tracking-wide
          rounded-xl shadow-lg
          transition-all duration-200
        "
      >
        Dispatch Shipment
      </button>
    )}

    {/* =====================================
        REJECTED
    ====================================== */}
    {task.status === "PACKED" &&
      task.approval_status === "REJECTED" && (
      <span
        className="
          px-4 py-2
          bg-red-50
          text-red-700
          border border-red-200
          text-[10px] font-black uppercase tracking-widest
          rounded-full
        "
      >
        Rejected By Manager
      </span>
    )}

    {/* =====================================
        SHIPPED
    ====================================== */}
    {task.status === "SHIPPED" && (
      <span
        className="
          inline-flex items-center
          px-4 py-2
          bg-emerald-50
          text-emerald-700
          border border-emerald-200
          text-[10px] font-black uppercase tracking-widest
          rounded-full
        "
      >
        ✔ Shipment Dispatched
      </span>
    )}

  </div>
</td>
        </tr>
      ))}
    </tbody>
  </table>
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