import React, { useState } from 'react';
import axios from 'axios';
import { MailPlus, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function SupplyRequest() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [form, setForm] = useState({ item: '', quantity: '', reason: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE}/api/inventory/supply-requests/`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatus({ type: 'success', message: 'Request submitted successfully!' });
      setForm({ item: '', quantity: '', reason: '' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to send request. Check connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transition-all">
        <div className="bg-blue-600 p-8 text-white relative">
          <MailPlus size={80} className="absolute -right-4 -bottom-4 opacity-10" />
          <h1 className="text-2xl font-black tracking-tight">Internal Supply Request</h1>
          <p className="text-blue-100 text-sm mt-1">Submit needs directly to the warehouse manager.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {status.type && (
            <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.message}
            </div>
          )}

          <div className="group">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Supply Item Name</label>
            <input required type="text" placeholder="e.g. 50mm Packaging Tape" 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all" 
              value={form.item} onChange={e => setForm({...form, item: e.target.value})} />
          </div>

          <div className="group">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Quantity Needed</label>
            <input required type="number" placeholder="e.g. 5" 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all" 
              value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          </div>

          <div className="group">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Justification</label>
            <textarea rows="3" placeholder="Explain why this is needed..." 
              className="w-full p-4 bg-slate-50 rounded-xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all resize-none" 
              value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-200 uppercase text-sm tracking-widest mt-4">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Send Request</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SupplyRequest;