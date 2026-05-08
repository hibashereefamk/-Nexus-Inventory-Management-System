import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiTruck, FiAlertTriangle, FiSend } from 'react-icons/fi';

const API = 'http://127.0.0.1:8000';

const ManagerOrderReview = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [verification, setVerification] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  });

  // FIX: Define loadData OUTSIDE useEffect so it's cleaner, then call it INSIDE
  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Task Details
      const taskRes = await axios.get(
        `${API}/api/orders/manager/approve-order/${taskId}/`,
        getAuthHeaders()
      );
      setTask(taskRes.data);

      // 2. Extract Verification ID
      // Fallback to 65 only for testing; in production, use the actual ID from task
      // 2. Determine which Verification ID to fetch
// Look at where "60" is coming from in your task response
const verificationId = taskRes.data?.verification_id || taskRes.data?.id; 

if (verificationId) {
    const detailRes = await axios.get(
        `${API}/api/inventory/verify-products/get-details/${verificationId}/`,
        getAuthHeaders()
    );
    console.log("Detailed Verification Data:", detailRes.data); // Debug this!
    setVerification(detailRes.data);
} else {
        console.warn("No verification ID found for this task");
      }console.log("Current Task State:", task);
console.log("Current Verification State:", verification);

    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && taskId !== 'undefined') {
      loadData();
    }
  }, [taskId]);

  const handleDecision = async (decision) => {
    try {
      await axios.patch(`${API}/api/orders/manager/approve-order/${taskId}/`, {
        decision: decision, 
        remarks: remarks
      }, getAuthHeaders());
      
      toast.success(`Order ${decision.toLowerCase()} successfully`);
      navigate('/manager/tasks'); 
    } catch (err) {
      toast.error("Error submitting decision");
    }
  };

  const escalateToAdmin = async () => {
    try {
      // Ensure we have a product ID from the task object
      const productId = task?.order?.product || task?.product_id;

      await axios.post(`${API}/api/inventory/create-issue/`, {
        product: productId,
        description: `MANAGER ESCALATION for Order ${task?.order?.order_number}: ${remarks}`,
        type: 'DAMAGE',
        urgency: 'HIGH'
      }, getAuthHeaders());
      
      toast.success("Issue escalated to Admin.");
      navigate('/manager/tasks');
    } catch (err) {
      toast.error("Escalation failed.");
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading Audit Data...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Audit Review: #{task?.order?.order_number || taskId}
          </h1>
          <p className="text-sm text-gray-500 italic">
            Reviewing verification submitted by Staff ID: {verification?.verified_by || "Unknown"}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg text-sm font-black border ${verification?.is_passed ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {verification?.is_passed ? "PASSED QC" : "FAILED QC"}
        </div>
      </div>

      {/* 1. QC Checklist Audit */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Technical Checklist Results</h2>
        {verification ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(verification).map(([key, value]) => {
              // Only show boolean fields (the actual checks)
              if (typeof value === 'boolean' && key !== 'is_passed') {
                return (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{key.replace(/_/g, ' ')}</span>
                    {value ? <FiCheckCircle className="text-emerald-500"/> : <FiXCircle className="text-rose-500"/>}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 text-amber-700 rounded-lg text-sm flex items-center gap-2">
            <FiAlertTriangle /> No detailed digital checklist found.
          </div>
        )}
      </div>

      {/* 2. Staff Remarks */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Staff Notes</h2>
        <p className="text-sm text-slate-700 italic border-l-4 border-indigo-500 pl-4 py-2 bg-indigo-50/30 rounded-r-lg">
          {verification?.comments || "No comments provided by staff."}
        </p>
      </div>

      {/* 3. Decision Controls */}
      <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl">
        <label className="block text-[10px] font-black mb-3 uppercase text-slate-400 tracking-widest">Manager Audit Remarks</label>
        <textarea 
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm mb-6 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-200"
          placeholder="Add final instructions or reasons for rejection..."
          rows={3}
        />
        
        <div className="flex gap-4">
          {verification?.is_passed ? (
            <>
              <button 
                onClick={() => handleDecision('APPROVED')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <FiTruck /> APPROVE & RELEASE
              </button>
              <button 
                onClick={() => handleDecision('REJECTED')}
                className="px-8 bg-slate-700 hover:bg-rose-600 py-4 rounded-xl font-bold transition-all"
              >
                REJECT
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleDecision('REJECTED')}
                className="flex-1 bg-rose-600 hover:bg-rose-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <FiXCircle /> REJECT ORDER
              </button>
              <button 
                onClick={escalateToAdmin}
                className="flex-1 bg-amber-500 hover:bg-amber-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-slate-900"
              >
                <FiSend /> ESCALATE TO ADMIN
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerOrderReview;