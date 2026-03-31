import React, { useState } from 'react';
import axios from 'axios';
import { MailPlus, Send } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function SupplyRequest() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ item: '', quantity: '', reason: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE}/api/inventory/supply-requests/`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Request Sent to Manager");
      setForm({ item: '', quantity: '', reason: '' });
    } catch (err) { alert("Failed to send request"); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <MailPlus size={40} className="mb-4 opacity-50" />
          <h1 className="text-2xl font-bold">Internal Supply Request</h1>
          <p className="text-blue-100 text-sm mt-1">Request warehouse station supplies from management.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Supply Item Name</label>
            <input required type="text" placeholder="e.g. 50mm Packaging Tape" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.item} onChange={e => setForm({...form, item: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Quantity Needed</label>
            <input required type="number" placeholder="e.g. 5" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Justification</label>
            <textarea rows="3" placeholder="Current roll is empty / Station 4 backup..." className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
          </div>

          <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            {loading ? 'SENDING...' : <><Send size={18} /> SEND REQUEST</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SupplyRequest;