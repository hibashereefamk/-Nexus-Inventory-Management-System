import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, CheckCircle2, Clock } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function ProcurementHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const res = await axios.get(`${API_BASE}/api/inventory/reorder/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data.results || []);
      } catch (err) { console.error(err); }
    };
    fetchHistory();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <History className="text-blue-600" size={28} />
        <h1 className="text-2xl font-black text-slate-800">Procurement History</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b">
              <th className="px-6 py-4">Request Date</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {history.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{item.quantity} units</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${item.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.is_approved ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-amber-500" />}
                    <span className="text-xs font-medium text-slate-500">{item.is_approved ? 'Approved' : 'Pending Manager'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProcurementHistory;