import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiInfo,
  FiUser,
  FiCalendar,
  FiAlertTriangle,
  FiRotateCcw,
  FiShield,
  FiSlash,
  FiTrendingDown
} from 'react-icons/fi';

const API = 'http://127.0.0.1:8000';

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`
  }
});

const ManagerOrderReview = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);

  // --- DATA LOADING MECHANISM ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Task Details
      const taskRes = await axios.get(`${API}/api/orders/manager/assignments/`, getAuthHeaders());
      const foundTask = taskRes.data.find((t) => t.id === parseInt(taskId));

      if (!foundTask) {
        toast.error("Task assignment layout record not found");
        return;
      }
      setTask(foundTask);

      // 2. Fetch Verification History Checklist Profiles
      const verificationPromises = foundTask.products.map(async (product) => {
        try {
          const historyRes = await axios.get(
            `${API}/api/inventory/verify-products/history/${product.id}/`,
            getAuthHeaders()
          );

          // Get the latest verification for this specific item
          const latest = historyRes.data.length > 0 ? historyRes.data[0] : null;
          return { product, verification: latest };
        } catch (err) {
          return { product, verification: null };
        }
      });

      const results = await Promise.all(verificationPromises);
      setVerifications(results);
    } catch (err) {
      toast.error("Failed to load audit pipeline structural data.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  // --- ERP STANDARD RESOLUTION HANDLERS ---
  const handleDecision = async (decision) => {
    try {
      await axios.patch(`${API}/api/orders/manager/approve-order/${taskId}/`, {
        decision,
        remarks
      }, getAuthHeaders());

      toast.success(`Order registration evaluated: ${decision}`);
      navigate('/manager/staff-tasks');
    } catch (err) {
      toast.error("Standard workflow submission layer failed.");
    }
  };

  const handleRework = async () => {
    const note = window.prompt("Enter rework instructions for warehouse staff:", "Verification failed. Please re-pack items.");
    if (note === null) return;
    try {
      await axios.post(`${API}/api/orders/manager/assignments/${taskId}/rework/`, { note }, getAuthHeaders());
      toast.success("Task status demoted. Sent back to staff terminal.");
      loadData();
    } catch (err) {
      toast.error("Rework dispatch protocol failed.");
    }
  };

  const handleForceCycleCount = async () => {
    const note = window.prompt("Reason for forcing an urgent physical inventory cycle count?", "Mismatched stock counts discovered during verification audit.");
    if (note === null) return;
    try {
      await axios.post(`${API}/api/orders/manager/assignments/${taskId}/force-cycle-count/`, { note }, getAuthHeaders());
      toast.success("Discrepancy registered. Physical check task forced.");
      loadData();
    } catch (err) {
      toast.error("Failed to inject forced cycle count.");
    }
  };

  const handleFlagStaffIncident = async () => {
    if (!task?.staff) return toast.error("No clear staff owner bounded to task.");
    const reason = window.prompt(`Enter performance incident reason for staff member @${task.staff}:`, "Repeated damage or packaging quality variance.");
    if (reason === null) return;
    try {
      await axios.post(`${API}/api/orders/manager/staff/${task.staff}/flag-incident/`, { reason }, getAuthHeaders());
      toast.success("Performance warning metric registered successfully.");
    } catch (err) {
      toast.error("Incident file registration blocked.");
    }
  };

  const handleQuarantineWriteOff = async () => {
    if (!window.confirm("Confirm item destruction? This will deduct the items from physical stock pools and request an Admin write-off.")) return;
    try {
      await axios.post(`${API}/api/orders/manager/assignments/${taskId}/quarantine-writeoff/`, {}, getAuthHeaders());
      toast.success("Stock isolated in quarantine. Admin write-off request launched.");
      loadData();
    } catch (err) {
      toast.error("Quarantine separation error.");
    }
  };

  const handleEscalateToBackorder = async () => {
    if (!window.confirm("Escalate to Admin for Backorder Processing? This will freeze current task progression.")) return;
    try {
      await axios.post(`${API}/api/orders/manager/assignments/${taskId}/escalate-backorder/`, {}, getAuthHeaders());
      toast.success("Order frozen. Shifted to Admin for backorder allocation.");
      loadData();
    } catch (err) {
      toast.error("Backorder transition processing failed.");
    }
  };

  // Evaluate structural validity checks
  const allPassed = verifications.length > 0 && verifications.every(
    item => item.verification?.is_passed === true
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-sm font-semibold tracking-wider uppercase">Loading Audit Manifest Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans antialiased text-slate-900">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOP COMPONENT: CONTEXT HEADER BANNER */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">Managerial Audit Workspace</span>
            <h1 className="text-2xl font-bold text-slate-800 mt-2 flex items-center gap-2">
              Order Quality Audit Evaluation
            </h1>
            <p className="text-slate-400 font-mono text-xs mt-1">Assignment ID Reference: #{task?.id} • System Code: {task?.order_number}</p>
          </div>
          <div className="bg-slate-50 border px-5 py-3 rounded-xl text-left md:text-right min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fulfillment Queue State</span>
            <span className="font-mono text-sm font-bold text-indigo-600">{task?.status}</span>
          </div>
        </div>

        {/* CORE PRODUCT CHECKS ROW DISPATCH */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Monitored Items Checklist</h2>
          
          {verifications.map((item, index) => {
            const v = item.verification;
            const p = item.product;

            // System keys to extract food metrics checkboxes dynamic lists
            const excludedKeys = ['id', 'timestamp', 'is_passed', 'comments', 'product', 'verified_by', 'verification_type', 'batch_lot', 'assignment'];
            const checkFields = v ? Object.keys(v).filter(key => !excludedKeys.includes(key)) : [];

            return (
              <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
                {/* Product Section Card Head */}
                <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center px-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Product Registration Code: ID {p.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border ${
                    v ? (v.is_passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200') : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {v ? (v.is_passed ? 'PASSED' : 'CRITICAL FAILURE') : 'UNVERIFIED POOL'}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {!v ? (
                    <div className="text-center py-6 border border-dashed rounded-xl bg-slate-50/40">
                      <p className="text-slate-400 italic text-xs">No validation record found submitted by warehouse operators.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Metric Checkboxes Checklist Blocks */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quality Parameters Inspection Summary</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {checkFields.map(key => (
                            <div key={key} className={`p-2.5 px-4 rounded-lg border flex items-center justify-between text-xs font-medium transition-colors ${
                              v[key] ? 'bg-emerald-50/40 border-emerald-100 text-slate-700' : 'bg-red-50/40 border-red-100 text-slate-700'
                            }`}>
                              <span className="uppercase text-[10px] tracking-tight font-bold text-slate-500">{key.replace(/_/g, ' ')}</span>
                              {v[key] ? <FiCheckCircle className="text-emerald-600 flex-shrink-0" size={15} /> : <FiXCircle className="text-red-500 flex-shrink-0" size={15} />}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Batches and Operations Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-150 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Batch Number / Lot Allocation</span>
                          <span className="font-mono font-bold text-slate-700 mt-1 block">{v.batch_lot || 'NOT SPECIFIED'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Inspection Protocol Standard Type</span>
                          <span className="font-medium text-slate-700 mt-1 block px-2 py-0.5 bg-slate-200/60 rounded w-fit uppercase text-[10px]">{v.verification_type}</span>
                        </div>
                      </div>

                      {/* Comments and Observations Container */}
                      <div className="bg-amber-50/50 border-l-4 border-amber-500 p-3.5 rounded-r-xl">
                        <p className="text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                          <FiInfo className="text-amber-600" /> Auditor Observations Feedback
                        </p>
                        <p className="text-xs text-slate-600 font-medium italic">
                          {v.comments ? `"${v.comments}"` : '"No specific structural descriptions logged."'}
                        </p>
                      </div>

                      {/* Operations Audit Track Details Line */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold uppercase pt-3 border-t border-slate-100">
                        <span className="flex items-center gap-1"><FiUser size={12}/> Auditor Account Key: User #{v.verified_by}</span>
                        <span className="flex items-center gap-1"><FiCalendar size={12}/> Logged Timestamp: {new Date(v.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 🚀 MODERN SaaS / ERP PREMIUM ACTION PANEL */}
{!allPassed && (
  <div className="bg-white border border-rose-100 rounded-xl shadow-sm overflow-hidden transition-all">
    {/* Alert Header Strip */}
    <div className="bg-rose-50/60 border-b border-rose-100 px-6 py-4 flex items-center gap-3">
      <div className="p-2 bg-rose-100 text-rose-700 rounded-lg animate-pulse">
        <FiAlertTriangle size={18} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">System Resolution Protocol Required</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Quality Control barriers triggered failures on this assignment. Select a corrective system action below.
        </p>
      </div>
    </div>
    
    {/* Action Buttons Matrix Grid */}
    <div className="p-6 bg-slate-50/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      
      {/* 1. Rework Staff */}
      <button 
        onClick={handleRework} 
        className="group relative flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
      >
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors mb-3">
          <FiRotateCcw size={16} />
        </div>
        <span className="text-xs font-bold text-slate-800 tracking-tight">Rework Task</span>
        <span className="text-[10px] text-slate-400 mt-1 leading-snug">Send back to staff terminal for re-packing.</span>
      </button>

      {/* 2. Force Cycle Count */}
      <button 
        onClick={handleForceCycleCount} 
        className="group relative flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
      >
        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-700 group-hover:text-white transition-colors mb-3">
          <FiAlertTriangle size={16} />
        </div>
        <span className="text-xs font-bold text-slate-800 tracking-tight">Force Cycle Count</span>
        <span className="text-[10px] text-slate-400 mt-1 leading-snug">Trigger an urgent stock check on this bin.</span>
      </button>

      {/* 3. Flag Staff Incident */}
      <button 
        onClick={handleFlagStaffIncident} 
        className="group relative flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
      >
        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-colors mb-3">
          <FiSlash size={16} />
        </div>
        <span className="text-xs font-bold text-slate-800 tracking-tight">Flag Operator</span>
        <span className="text-[10px] text-slate-400 mt-1 leading-snug">Log performance incident to employee profile.</span>
      </button>

      {/* 4. Quarantine Write-Off */}
      <button 
        onClick={handleQuarantineWriteOff} 
        className="group relative flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-red-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
      >
        <div className="p-2 bg-red-50 text-red-700 rounded-lg group-hover:bg-red-700 group-hover:text-white transition-colors mb-3">
          <FiShield size={16} />
        </div>
        <span className="text-xs font-bold text-slate-800 tracking-tight">Quarantine Pool</span>
        <span className="text-[10px] text-slate-400 mt-1 leading-snug">Isolate bad stock and initiate Admin write-off.</span>
      </button>

      {/* 5. Escalate to Backorder */}
      <button 
        onClick={handleEscalateToBackorder} 
        className="group relative flex flex-col items-start p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
      >
        <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg group-hover:bg-indigo-900 group-hover:text-white transition-colors mb-3">
          <FiTrendingDown size={16} />
        </div>
        <span className="text-xs font-bold text-slate-800 tracking-tight">Escalate Backorder</span>
        <span className="text-[10px] text-slate-400 mt-1 leading-snug">Freeze workflow and alert core procurement.</span>
      </button>

    </div>
  </div>
)}

        {/* BOTTOM MANAGEMENT RESOLUTION CONTROL DRAWER */}
        <div className="bg-slate-900 p-6 rounded-xl shadow-md border border-slate-800">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Final Manager Audit Signature Notes</label>
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3.5 text-white text-xs mb-4 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500 font-medium"
            rows={3}
            placeholder="Write validation context, procurement references, or mitigation reasons here..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleDecision('APPROVED')}
              disabled={!allPassed}
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
                allPassed 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <FiTruck size={15} /> Release & Initiate Dispatch
            </button>
            <button
              onClick={() => handleDecision('REJECTED')}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm"
            >
              <FiXCircle size={15} /> Terminate & Reject Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagerOrderReview;