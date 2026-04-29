import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Send, Info, Clock, Calendar, Package, User } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const AssignTasksManager = ({ isOpen, onClose, onSuccess, token }) => {
  const [staffData, setStaffData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ staff: '', deadline_date: '', priority: 'MED' });
  const [items, setItems] = useState([{ product: '', quantity: 1 }]);

  // Load advanced fulfillment data (Heatmaps + FEFO Products)
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const res = await axios.get(`${API_BASE}/api/orders/manager/assign-data/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStaffData(res.data.staff || []);
          setProducts(res.data.products || []);
        } catch (err) {
          console.error("Fulfillment Engine Error", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, token]);

  const handleAuthorize = async (e) => {
    e.preventDefault();
    const payload = { ...formData, items };
    try {
      await axios.post(`${API_BASE}/api/tasks/manager/orders/${orderId}/assign/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("🚀 Order Authorized & Stock Reserved!");
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Authorization Failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Fulfill & Assign Task</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Data-Driven Allocation Engine</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} className="text-slate-400" /></button>
        </div>

        <form onSubmit={handleAuthorize} className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[80vh]">
          
          {/* Col 1: Manifest */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase flex items-center gap-2"><Package size={14}/> 1. Order Manifest</h3>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <select required className="w-full text-xs font-bold text-slate-700 bg-transparent outline-none mb-2"
                    value={item.product} onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].product = e.target.value;
                      setItems(newItems);
                    }}>
                    <option value="">Select Item...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.total_stock})</option>)}
                  </select>
                  <div className="flex justify-between items-center border-t pt-2 border-slate-50">
                    <input type="number" min="1" value={item.quantity} className="w-16 bg-slate-100 rounded-lg p-1 text-xs font-black" 
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].quantity = e.target.value;
                        setItems(newItems);
                      }} />
                    <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-400 text-[10px] font-black uppercase">Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setItems([...items, {product: '', quantity: 1}])} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 text-[10px] font-black uppercase hover:border-indigo-400 hover:text-indigo-400 transition-all">+ Add Product</button>
            </div>
          </div>

          {/* Col 2: Staff Heatmap */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase flex items-center gap-2"><User size={14}/> 2. Staff Optimization</h3>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
              <div className="grid grid-cols-4 gap-1 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400"></div><div className="bg-amber-400"></div><div className="bg-orange-500"></div><div className="bg-red-500"></div>
              </div>
              <select required value={formData.staff} onChange={(e) => setFormData({...formData, staff: e.target.value})}
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500">
                <option value="">Choose Personnel...</option>
                {staffData.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.username} (Load: {s.active_tasks_count} | {s.zone_name})
                  </option>
                ))}
              </select>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Info size={12}/> AI Insight</p>
                <p className="text-[11px] text-indigo-900 font-bold mt-1 leading-relaxed">System suggests staff based on lowest active task count and warehouse zone specialization.</p>
              </div>
            </div>
          </div>

          {/* Col 3: Execution */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-indigo-600 uppercase flex items-center gap-2"><Clock size={14}/> 3. Execution Details</h3>
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['LOW', 'MED', 'HIGH', 'EMER'].map(p => (
                  <button key={p} type="button" onClick={() => setFormData({...formData, priority: p})}
                    className={`py-2 rounded-xl text-[10px] font-black transition-all ${formData.priority === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>{p}</button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Calendar size={12}/> Target Deadline</label>
                <input type="date" required value={formData.deadline_date} onChange={(e) => setFormData({...formData, deadline_date: e.target.value})} 
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xs text-slate-700" />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3">
              <Send size={18}/> AUTHORIZE ASSIGNMENT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTasksManager;