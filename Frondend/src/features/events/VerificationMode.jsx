import React, { useState } from "react";
import axios from "axios";
import { FiArrowLeft, FiCheck, FiAlertTriangle, FiShield } from "react-icons/fi";
import { toast } from "react-hot-toast";

const API = "http://127.0.0.1:8000";

const Verification = ({ task, onBack }) => {
  const [items, setItems] = useState(task.items || []);
  const [verifiedIds, setVerifiedIds] = useState([]);

  const toggleVerify = (id) => {
    setVerifiedIds(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleCompleteVerification = async () => {
  try {
    const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };

    const inspections = {};

    items.forEach(item => {
      inspections[item.product_id] = {
        is_inspected: verifiedIds.includes(item.id)
      };
    });

    await axios.patch(
      `${API}/api/orders/staff/inspect/${task.id}/`,
      { inspections },
      { headers }
    );

    toast.success("Inspection completed → Order PACKED");
    onBack();

  } catch (err) {
    toast.error("Inspection failed");
  }
};

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <FiArrowLeft /> Back to Terminal
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Verification Mode</h2>
            <p className="text-xs text-yellow-500 font-bold">Scanning Order #{task.order_number}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
             <FiShield className="text-blue-400" />
             <span className="text-xs font-bold uppercase">QA Control</span>
          </div>
        </div>

        {/* Verification List */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-4 bg-slate-700/50 flex justify-between text-[10px] font-black uppercase text-slate-400">
            <span>Item Description</span>
            <span>Manual Check</span>
          </div>
          <div className="divide-y divide-slate-700">
            {items.map((item) => (
              <div key={item.id} className="p-6 flex justify-between items-center group hover:bg-slate-700/30 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${verifiedIds.includes(item.id) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-700 text-slate-500'}`}>
                    {item.quantity}x
                  </div>
                  <div>
                    <h4 className="font-bold">{item.product_name || "Product Item"}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-tighter">SKU: {item.sku || 'N/A'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleVerify(item.id)}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                    verifiedIds.includes(item.id) 
                    ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
                    : 'border-slate-600 text-transparent hover:border-emerald-500'
                  }`}
                >
                  <FiCheck size={24} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-10 flex flex-col items-center">
           <div className="text-slate-500 text-xs mb-4 uppercase font-bold">
             Items Verified: {verifiedIds.length} / {items.length}
           </div>
           <button 
             disabled={verifiedIds.length !== items.length}
             onClick={handleCompleteVerification}
             className={`px-12 py-4 rounded-xl font-black uppercase tracking-widest transition shadow-2xl ${
               verifiedIds.includes(items[0]?.id) // Just a mock check for UX
               ? 'bg-blue-600 hover:bg-blue-500 text-white' 
               : 'bg-slate-800 text-slate-600 cursor-not-allowed'
             }`}
           >
             Finalize & Move to Packed
           </button>
        </div>
      </div>
    </div>
  );
};

export default Verification;