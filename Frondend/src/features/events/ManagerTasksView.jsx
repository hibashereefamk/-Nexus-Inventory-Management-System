import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FiSearch, FiFilter, FiMoreVertical, FiUserPlus, FiCheckCircle, 
  FiAlertCircle, FiChevronDown, FiChevronUp, FiLayers, FiPackage, FiRefreshCw 
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import AdvancedAssignModal from './AdvancedAssignModal';

const API = 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

function ManagerTasksView() {
  const [tasks, setTasks] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  
  // --- NEW RESTOCK CONNECTION STATES ---
  const [currentView, setCurrentView] = useState("TASKS"); // Supports: "TASKS" or "RESTOCK_QUEUE"
  const [restockRequests, setRestockRequests] = useState([]);
  const [restockActionLoading, setRestockActionLoading] = useState(false);

  const navigate = useNavigate();

  // Fetch standard order fulfillment tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/orders/manager/assignments/`, getAuthHeaders());
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks", err);
      toast.error("Failed to load tasks manifest.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API}/api/orders/manager/fulfillment-data/`, getAuthHeaders());
      setStaffList(res.data.staff || []);
    } catch (err) {
      console.error("Error fetching staff", err);
    }
  };

  // --- FETCH PENDING RESTOCK REQUESTS ---
  const fetchRestockRequests = async () => {
    try {
      const res = await axios.get(`${API}/api/orders/manager/restock-requests/`, getAuthHeaders());
      setRestockRequests(res.data);
    } catch (err) {
      console.error("Error fetching restock requests", err);
      toast.error('Failed to load restock requests queue.');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStaff();
    fetchRestockRequests(); // Silently poll requests cache count on boot
  }, []);

  // Handle Approvals / Rejections on restock requests
  const handleRestockAction = async (id, statusAction) => {
    try {
      setRestockActionLoading(true);
      await axios.patch(`${API}/api/orders/manager/restock-requests/${id}/`, { status: statusAction }, getAuthHeaders());
      toast.success(`Request ${statusAction.toLowerCase()} successfully!`);
      fetchRestockRequests(); // Reload items queue
    } catch (err) {
      toast.error('Restock action execution failed.');
    } finally {
      setRestockActionLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    switch (activeFilter) {
      case "ASSIGNED": return task.staff;
      case "NOT_ASSIGNED": return !task.staff;
      case "NOT_PERFORMED": return task.status === 'PENDING';
      case "SHIP_REQUEST": return task.status === "PACKED" && task.approval_status === "PENDING";
      case "APPROVED_SHIPPED": return task.status === "PACKED" && task.approval_status === "APPROVED";
      case "COMPLETED": return task.status === "SHIPPED";
      default: return true;
    }
  });

  return (
    <div className="bg-slate-50 min-h-screen p-8 font-sans antialiased text-slate-900">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="mb-8 flex justify-between items-end border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {currentView === "TASKS" ? "Task Management Terminal" : "Stock Restoration Control"}
          </h1>
          <p className="text-slate-500 text-sm">
            {currentView === "TASKS" 
              ? "Monitor, evaluate and assign warehouse fulfillment workflows." 
              : "Review and approve stock restock warnings flagged by QA field inspectors."}
          </p>
        </div>

        {/* TOP LEVEL WORKSPACE VIEWS TOGGLER */}
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentView("TASKS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
              currentView === "TASKS" 
                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FiLayers /> Tasks Manifest
          </button>
          
          <button 
            onClick={() => { setCurrentView("RESTOCK_QUEUE"); fetchRestockRequests(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all relative ${
              currentView === "RESTOCK_QUEUE" 
                ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <FiPackage /> Restock Alerts
            {restockRequests.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {restockRequests.length}
              </span>
            )}
          </button>

          <button 
            onClick={currentView === "TASKS" ? fetchTasks : fetchRestockRequests} 
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh active workflow data"
          >
            <FiRefreshCw className={`${loading || restockActionLoading ? "animate-spin" : ""}`} size={16} />
          </button>
        </div>
      </div>

      {/* VIEW DELEGATOR GRID */}
      {currentView === "TASKS" ? (
        <>
          {/* TABS/FILTERS FOR TASKS VIEW */}
          <div className="flex gap-1 mb-6 bg-slate-200/50 p-1 rounded-xl w-fit">
            {["ALL", "NOT_ASSIGNED", "ASSIGNED", "SHIP_REQUEST", "NOT_PERFORMED", "APPROVED_SHIPPED", "COMPLETED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === tab 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* TASKS DATA TABLE GRID */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Detail</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Staff</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400 font-medium text-sm">
                      No tracked tasks matched this verification layer filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <React.Fragment key={task.id}>
                      <tr className={`hover:bg-slate-50 transition-colors group ${expandedOrder === task.id ? 'bg-slate-50/50' : ''}`}>
                        <td className="p-4" onClick={() => setExpandedOrder(expandedOrder === task.id ? null : task.id)}>
                          <div className="flex flex-col cursor-pointer">
                            <span className="font-bold text-indigo-600 text-sm flex items-center gap-2">
                              #{task.order_number}
                              {expandedOrder === task.id ? <FiChevronUp /> : <FiChevronDown />}
                            </span>
                            <span className="text-xs text-slate-400">{task.deadline} • {task.products?.length} items</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                            {task.department || "General"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                              {task.staff ? task.staff.substring(0, 2).toUpperCase() : "?"}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {task.staff || <span className="text-slate-400 italic font-normal">Unassigned</span>}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="p-4 text-right">
                          <ActionButtons 
                            task={task} 
                            setSelectedTask={setSelectedTask} 
                            navigate={navigate} 
                            fetchTasks={fetchTasks}
                          />
                        </td>
                      </tr>
                      {expandedOrder === task.id && (
                        <tr>
                          <td colSpan="5" className="p-0 bg-slate-50/30">
                            <div className="p-4 mx-4 mb-4 bg-white border border-slate-200 rounded-xl shadow-inner">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Product Manifest</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {task.products?.map((p, i) => (
                                  <div key={i} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 text-sm">
                                    <span className="text-slate-700">{p.name}</span>
                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">x{p.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ==================== SUB COMPONENT LAYER: RESTOCK ALERTS QUEUE ==================== */
        <div className="animate-in fade-in duration-200">
          {restockRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 font-medium shadow-sm">
              <FiCheckCircle size={32} className="mx-auto text-emerald-500 mb-3" />
              All clear! No pending restock issues reported by staff inspectors.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Current Stock</th>
                    <th className="p-4">Reason / Problem Flagged</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restockRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-800 text-sm">@{req.staff_username}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{req.date}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 text-sm">{req.product_name}</p>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{req.sku}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          {req.current_stock} units left
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 italic max-w-xs truncate" title={req.reason}>
                        "{req.reason}"
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          disabled={restockActionLoading}
                          onClick={() => handleRestockAction(req.id, 'APPROVED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button 
                          disabled={restockActionLoading}
                          onClick={() => handleRestockAction(req.id, 'REJECTED')}
                          className="bg-red-50 text-red-600 border border-red-100 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ASSIGNMENT BACKDROP MODAL MODIFIER */}
      {selectedTask && (
        <AdvancedAssignModal
          selectedTask={selectedTask}
          staffList={staffList}
          onClose={() => setSelectedTask(null)}
          onRefresh={fetchTasks}
        />
      )}
    </div>
  );
}

const ActionButtons = ({ task, setSelectedTask, navigate, fetchTasks }) => {
  const handleReview = (e) => {
    e.stopPropagation();
    navigate(`/manager/order-review/${task.id}`, { state: { products: task.products } });
  };

  const handleStatusUpdate = async (e, payload) => {
    e.stopPropagation();
    try {
      await axios.patch(`${API}/api/orders/manager/update-status/${task.id}/`, payload, getAuthHeaders());
      fetchTasks();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  if (task.status === "SHIPPED") {
    return (
      <div className="flex items-center justify-end text-emerald-500 gap-1 font-bold text-xs uppercase tracking-tighter">
        <FiCheckCircle /> Dispatched
      </div>
    );
  }

  if (task.is_cancelled) {
    return <span className="text-slate-400 font-bold text-xs uppercase">Order Void</span>;
  }

  return (
    <div className="flex justify-end gap-2 items-center">
      {task.status === "PACKED" && task.approval_status === "PENDING" && (
        <button onClick={handleReview} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm transition-all">
          Review Audit
        </button>
      )}

      {task.approval_status === "APPROVED" && task.status === "PACKED" && (
        <button 
          onClick={(e) => handleStatusUpdate(e, { status: "APPROVED" })}
          className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
        >
          Confirm Dispatch
        </button>
      )}

      {task.approval_status === "REJECTED" && (
        <button onClick={handleReview} className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition-all">
          Re-evaluate
        </button>
      )}

      {(task.status === "PENDING" || task.status === "PACKING") && (
        <button onClick={() => setSelectedTask(task)} className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">
          {task.staff ? "Reassign" : "Assign Staff"}
        </button>
      )}

      {task.verification_status === "FAILED" && task.approval_status !== "REJECTED" && (
        <button onClick={handleReview} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm">
          Damage Review
        </button>
      )}

      {task.status !== "SHIPPED" && !task.is_cancelled && (
        <button 
          title="Cancel Order"
          onClick={(e) => { if(window.confirm("Cancel this order?")) handleStatusUpdate(e, { is_cancelled: true }) }}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <FiAlertCircle size={16} />
        </button>
      )}
    </div>
  );
};
  
const StatusBadge = ({ status }) => {
  const config = {
    PENDING: "bg-amber-50 text-amber-600 border-amber-100",
    PACKING: "bg-blue-50 text-blue-600 border-blue-100",
    PACKED: "bg-indigo-50 text-indigo-600 border-indigo-100",
    APPROVAL_REQUESTED: "bg-purple-50 text-purple-600 border-purple-100",
    SHIPPED: "bg-emerald-50 text-emerald-600 border-emerald-100"
  };

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${config[status] || "bg-slate-50 text-slate-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
};

export default ManagerTasksView;