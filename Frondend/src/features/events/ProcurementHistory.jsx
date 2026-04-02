import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, CheckCircle2, PackageCheck } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function ProcurementHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('access_token');
      try {
        // Fetching from your tasks endpoint which already filters by request.user in get_queryset
        const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter for completed/shipped tasks based on your model's STATUS_CHOICES
        const completedTasks = res.data.filter(task => 
          task.status === 'SHIPPED' || task.status === 'PACKED'
        );
        
        setHistory(completedTasks);
      } catch (err) { 
        console.error("Error fetching activity history:", err); 
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500">Loading History...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-lg">
            <History className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">My Activity History</h1>
            <p className="text-sm text-slate-500">Overview of your completed packing and shipments</p>
          </div>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Completed</span>
          <p className="text-xl font-black text-blue-600">{history.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-widest border-b">
              <th className="px-6 py-5">Order Reference</th>
              <th className="px-6 py-5">Items Packed</th>
              <th className="px-6 py-5">Completion Date</th>
              <th className="px-6 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.length > 0 ? (
              history.map(task => (
                <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 group-hover:text-blue-700">#{task.order_number}</span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {task.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <PackageCheck size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">
                        {task.items?.length || 0} Product Categories
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    {task.completed_at ? new Date(task.completed_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold ring-1 ring-inset ring-emerald-600/20">
                      <CheckCircle2 size={12} />
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <History size={48} />
                    <p className="font-bold">No completed tasks found in your history.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProcurementHistory;