import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Info, Clock, Calendar, Package, User, Activity, CheckCircle } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const AssignTasksManager = ({ isOpen, onClose, onSuccess, token, selectedOrder }) => {
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // selectedOrder should contain the data from the order the Admin just confirmed
  const [formData, setFormData] = useState({
    staff: '',
    deadline_date: '',
    priority: 'MED',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchStaff = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/manager/fulfillment-data/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStaffData(res.data.staff || []);
        } catch (err) {
          console.error("Staff Data Error", err);
        } finally {
          setLoading(false);
        }
      };
      fetchStaff();
    }
  }, [isOpen, token]);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      // Endpoint: /api/manager/assignments/<id>/assign-staff/
      await axios.post(`${API_BASE}/api/manager/assignments/${selectedOrder.id}/assign-staff/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Assignment Failed");
    }
  };

  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1f2e] text-slate-300 w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#1e2536]">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Activity className="text-indigo-500" /> Fulfill & Assign New Task
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[85vh]">
          
          {/* Column 1: Order Context */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-xs">1</span> Order Context
            </h3>
            <div className="bg-[#1e2536] p-5 rounded-2xl border border-slate-700 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Order ID</p>
                <p className="text-indigo-400 font-mono font-bold">{selectedOrder.order_number}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase">Order Items ({selectedOrder.items?.length})</p>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#252d41] p-3 rounded-xl border border-slate-700">
                    <div className="bg-indigo-500/10 p-2 rounded-lg"><Package size={16} className="text-indigo-400"/></div>
                    <div>
                      <p className="text-sm font-semibold">{item.product_name}</p>
                      <p className="text-[10px] text-slate-500">Qty: {item.quantity} | {item.department_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Staff Optimization (The Heatmap) */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-xs">2</span> Staff Optimization
            </h3>
            <div className="bg-[#1e2536] p-5 rounded-2xl border border-slate-700 space-y-4">
              <p className="text-xs text-slate-400">Dynamic Workload (Heatmap)</p>
              
              {/* Heatmap Legend Grid */}
              <div className="grid grid-cols-4 gap-1 mb-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`h-6 rounded ${i % 3 === 0 ? 'bg-emerald-500/50' : i % 2 === 0 ? 'bg-amber-500/50' : 'bg-red-500/50'}`}></div>
                ))}
              </div>

              <select 
                required 
                className="w-full bg-[#252d41] border border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.staff}
                onChange={(e) => setFormData({...formData, staff: e.target.value})}
              >
                <option value="">Select Personnel</option>
                {staffData.map(s => (
                  <option key={s.id} value={s.id}>{s.username} (Tasks: {s.current_tasks})</option>
                ))}
              </select>

              {/* Staff mini-list visual */}
              <div className="space-y-2 mt-4">
                {staffData.slice(0, 3).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 rounded-xl bg-[#252d41]/50 border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-[10px]"><User size={14}/></div>
                      <span className="text-xs font-medium">{s.username}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${s.current_tasks > 3 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {s.current_tasks} Tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Execution Details */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-xs">3</span> Execution Details
            </h3>
            <div className="bg-[#1e2536] p-5 rounded-2xl border border-slate-700 space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] text-slate-500 uppercase font-bold">Priority</label>
                 <div className="grid grid-cols-2 gap-2">
                    {['LOW', 'MED', 'HIGH', 'EMER'].map(p => (
                      <button 
                        key={p} 
                        type="button"
                        onClick={() => setFormData({...formData, priority: p})}
                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${formData.priority === p ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-[#252d41] border-slate-700 text-slate-400'}`}
                      >
                        {p}
                      </button>
                    ))}
                 </div>
               </div>

               <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-bold">Manager Deadline</label>
                <input 
                  type="date" 
                  className="w-full bg-[#252d41] border border-slate-600 rounded-xl p-3 text-sm"
                  value={formData.deadline_date}
                  onChange={(e) => setFormData({...formData, deadline_date: e.target.value})}
                />
               </div>

               <textarea 
                  placeholder="Notes for staff..."
                  className="w-full bg-[#252d41] border border-slate-600 rounded-xl p-3 text-sm h-24 resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
               />
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/30">
              <CheckCircle size={18} /> CONFIRM & NOTIFY STAFF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AssignTasksManager;