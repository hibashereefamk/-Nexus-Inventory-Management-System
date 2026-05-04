import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiChevronLeft, FiCheck, FiHash, FiCamera, FiCheckCircle } from 'react-icons/fi';

const API = "http://127.0.0.1:8000";

const VerificationMode = ({ taskId, onBack }) => {
  const [task, setTask] = useState(null);
  const [inspections, setInspections] = useState({});
  const [reportingIssue, setReportingIssue] = useState(null);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
  });

 useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get(`${API}/api/orders/staff/tasks/${taskId}/`, getAuthHeaders());
        
        // Handle potential nested data or results from pagination
        const taskData = res.data;
        setTask(taskData);

        // Safely extract items: check if taskData.items exists and is an array
        const items = Array.isArray(taskData.items) ? taskData.items : [];
        
        const initial = {};
        items.forEach(item => {
          initial[item.product] = { is_inspected: item.is_inspected || false };
        });
        
        setInspections(initial);
      } catch (error) {
        console.error("Failed to load task details:", error);
      }
    };
    fetchDetail();
  }, [taskId]);

  const toggleVerify = (productId) => {
    setInspections(prev => ({
      ...prev,
      [productId]: { is_inspected: !prev[productId]?.is_inspected }
    }));
  };

  const submitFinal = async () => {
    await axios.patch(`${API}/api/orders/staff/tasks/${taskId}/inspect/`, { inspections }, getAuthHeaders());
    onBack();
  };

  const handleReport = async (productId) => {
    const desc = prompt("Describe the issue/damage:");
    if (!desc) return;
    await axios.post(`${API}/api/orders/staff/report-issue/`, {
      product: productId,
      type: "DAMAGE",
      description: desc
    }, getAuthHeaders());
    alert("Issue Reported");
  };

  if (!task) return <div className="p-10 text-white">Loading Verification...</div>;

  // 1. Calculate verified count safely
const verifiedCount = inspections ? Object.values(inspections).filter(i => i.is_inspected).length : 0;

// 2. Calculate progress safely by checking if items exists
// If your current API returns a single order instead of a list, use [task.order]
const itemsList = Array.isArray(task.items) ? task.items : (task.order ? [task.order] : []);
const progress = itemsList.length > 0 ? Math.round((verifiedCount / itemsList.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300">
      <div className="bg-[#1e293b] p-4 flex justify-between items-center border-b border-slate-800 sticky top-0 z-50">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm">
          <FiChevronLeft /> Exit
        </button>
        <div className="text-center">
          <h2 className="text-white font-black text-sm uppercase tracking-widest">Verification Mode</h2>
          <p className="text-[10px] text-indigo-400 font-mono">ORDER: #{task.order_number}</p>
        </div>
        <div className="w-20"></div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Items Processed</p>
              <h1 className="text-3xl font-black text-white">{progress}%</h1>
            </div>
            <p className="text-xs text-slate-400">{verifiedCount} of {task.items.length} Verified</p>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="space-y-4 mb-24">
          {task?.items?.map((item) => (
    <div key={item.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
              inspections[item.product]?.is_inspected ? 'bg-green-500/10 border-green-500/40' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm">{item.product_details?.name}</h4>
                <div className="flex gap-4 mt-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                    <FiHash className="text-indigo-500"/> SKU-{item.product}
                  </span>
                  <span className="text-[10px] text-white font-black uppercase">Qty: {item.quantity}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleReport(item.product)} className="p-3 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-900/40">
                  <FiCamera />
                </button>
                <button 
                  onClick={() => toggleVerify(item.product)}
                  className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest ${
                    inspections[item.product]?.is_inspected ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {inspections[item.product]?.is_inspected ? 'VERIFIED' : 'CONFIRM'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6">
          <button 
            onClick={submitFinal}
            disabled={progress < 100}
            className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              progress === 100 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-slate-800 text-slate-600'
            }`}
          >
            <FiCheckCircle /> Complete & Sync Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationMode;