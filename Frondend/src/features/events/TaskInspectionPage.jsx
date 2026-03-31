import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ClipboardCheck, 
  AlertOctagon, 
  Calendar, 
  Package, 
  ChevronLeft, 
  Save,
  CheckCircle2
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function TaskInspectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Local state for inspection data
  const [inspectionResults, setInspectionResults] = useState({});

  const fetchTaskDetails = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(res.data);
      
      // Initialize inspection form for each item in the task
      const initialForm = {};
      res.data.items.forEach(item => {
        initialForm[item.product] = {
          status: 'GOOD', // GOOD, DAMAGED, EXPIRED
          verified_qty: item.quantity,
          expiry_checked: false,
          notes: ''
        };
      });
      setInspectionResults(initialForm);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTaskDetails(); }, [id]);

  const handleInputChange = (productId, field, value) => {
    setInspectionResults(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));
  };

  const submitInspection = async () => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.post(`${API_BASE}/api/orders/staff/tasks/${id}/inspect/`, {
        inspections: inspectionResults,
        status: 'INSPECTED'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Inventory Audit and Task Status Updated Successfully!");
      navigate('/');
    } catch (err) {
      alert("Error updating audit. Check all required fields.");
    }
  };

  if (loading) return <div className="p-20 text-center font-mono text-slate-400">Loading Warehouse Audit Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-blue-600 transition-colors mb-2">
              <ChevronLeft size={20} /> Back to Command Center
            </button>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <ClipboardCheck className="text-blue-600" size={32} />
              Task Inspection & Audit
            </h1>
            <p className="text-slate-500 mt-1">Order Ref: <span className="font-mono font-bold">{task?.order_number}</span></p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={submitInspection} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
              <Save size={18} /> COMPLETE & REPORT
            </button>
          </div>
        </div>

        {/* Task Items Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <span className="text-sm font-bold tracking-widest uppercase">Inventory Checklist</span>
            <span className="text-xs bg-blue-500 px-3 py-1 rounded-full">{task?.items.length} Items Pending</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-8 py-4">Item Details</th>
                  <th className="px-8 py-4">Quantity Verification</th>
                  <th className="px-8 py-4">Physical Condition</th>
                  <th className="px-8 py-4">Compliance Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {task?.items.map((item) => (
                  <tr key={item.product} className="hover:bg-slate-50/50 transition-colors">
                    {/* Item Info */}
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-800">Product ID: {item.product}</p>
                      <p className="text-xs text-slate-400 mt-1">Target Qty: {item.quantity}</p>
                    </td>

                    {/* Quantity Update */}
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Package size={16} className="text-slate-400" />
                        <input 
                          type="number"
                          className="w-20 p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          value={inspectionResults[item.product]?.verified_qty}
                          onChange={(e) => handleInputChange(item.product, 'verified_qty', e.target.value)}
                        />
                        <span className="text-xs font-bold text-slate-400">UNITS</span>
                      </div>
                    </td>

                    {/* Status / Damage Check */}
                    <td className="px-8 py-6">
                      <select 
                        className={`p-2 rounded-lg border text-xs font-bold outline-none transition-all ${
                          inspectionResults[item.product]?.status === 'GOOD' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          inspectionResults[item.product]?.status === 'DAMAGED' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-amber-50 text-amber-600 border-amber-200'
                        }`}
                        value={inspectionResults[item.product]?.status}
                        onChange={(e) => handleInputChange(item.product, 'status', e.target.value)}
                      >
                        <option value="GOOD">✓ GOOD CONDITION</option>
                        <option value="DAMAGED">⚠ DAMAGED STOCK</option>
                        <option value="EXPIRED">✖ EXPIRED STOCK</option>
                      </select>
                    </td>

                    {/* Expiry Checkbox */}
                    <td className="px-8 py-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox"
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={inspectionResults[item.product]?.expiry_checked}
                          onChange={(e) => handleInputChange(item.product, 'expiry_checked', e.target.checked)}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Expiry Verified</span>
                          <span className="text-[10px] text-slate-400 uppercase">Checked Date Label</span>
                        </div>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Reporting Box */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
            <h3 className="flex items-center gap-2 text-amber-800 font-bold mb-2 text-sm uppercase tracking-wider">
              <AlertOctagon size={18} /> Damage/Loss Report
            </h3>
            <textarea 
              placeholder="Provide details if any items were marked as damaged or missing for the manager report..."
              className="w-full bg-white border border-amber-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-amber-500"
              rows="3"
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="text-emerald-800 font-bold text-sm uppercase tracking-wider">Ready for Packing?</h3>
              <p className="text-emerald-600 text-xs mt-1">Status will auto-update to 'PACKED' upon submission.</p>
            </div>
            <CheckCircle2 size={40} className="text-emerald-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskInspectionPage;