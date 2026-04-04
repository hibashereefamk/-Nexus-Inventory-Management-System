import React, { useState } from 'react';
import { X, AlertTriangle, Send, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

const IssueReportModal = ({ isOpen, onClose, product, orderId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'DAMAGE',       // Matches Model Choice: 'DAMAGE', 'OVERDUE', 'EXPIRY'
    cause: 'OTHER',       // Matches Model Choice: 'HUMAN', 'NATURAL', 'OTHER'
    urgency: 'MEDIUM',    // Matches Model Choice: 'LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'
    description: '',
    is_emergency: false
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Retrieve the token (Ensure the key matches what you use in Login.jsx)
    const token = localStorage.getItem('access_token'); 

    // 2. Setup headers to prevent "AnonymousUser" error
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    // 3. Construct payload matching your Django Model fields
    const payload = {
      product: product.id,
      type: formData.type,
      cause: formData.cause,
      description: formData.description,
      is_emergency: formData.is_emergency,
      urgency: formData.is_emergency ? 'EMERGENCY' : formData.urgency,
      // order_assignment: orderId // Add if you use the traceability field
    };

    try {
      await axios.post(`${API_BASE}/api/inventory/report-issue/`, payload, config);
      alert("Report successfully transmitted to the department manager.");
      onClose();
    } catch (err) {
      console.error("Submission Error:", err.response?.data);
      const serverError = err.response?.data;
      
      // Show specific validation errors (like the 0 stock error from your Serializer)
      const errorMsg = serverError?.non_field_errors?.[0] || 
                       serverError?.detail || 
                       "Submission failed. Please check your connection.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-red-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} />
            <h3 className="font-black uppercase tracking-tight text-lg">Inventory Issue Report</h3>
          </div>
          <button onClick={onClose} className="hover:rotate-90 transition-transform">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Product Read-only Display */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Item Under Review</label>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-800">{product.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">SKU: {product.sku}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Field: Type */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Issue Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:border-red-500 outline-none"
              >
                <option value="DAMAGE">Physical Damage</option>
                <option value="EXPIRY">Expired Stock</option>
                <option value="OVERDUE">Overdue Item</option>
              </select>
            </div>

            {/* Field: Cause */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Root Cause</label>
              <select 
                value={formData.cause}
                onChange={(e) => setFormData({...formData, cause: e.target.value})}
                className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:border-red-500 outline-none"
              >
                <option value="HUMAN">Human Error</option>
                <option value="NATURAL">Natural/External</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Field: Urgency (Hidden if Emergency is checked) */}
          {!formData.is_emergency && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Urgency Level</label>
              <select 
                value={formData.urgency}
                onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 text-sm focus:border-red-500 outline-none"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
            </div>
          )}

          {/* Field: Description */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Detailed Remarks</label>
            <textarea 
              required
              placeholder="Provide context for the manager..."
              className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl h-24 text-sm focus:bg-white focus:border-red-500 outline-none transition-all"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Field: Is Emergency */}
          <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${formData.is_emergency ? 'bg-red-600 border-red-700' : 'bg-red-50 border-red-100'}`}>
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-slate-900"
              checked={formData.is_emergency}
              onChange={(e) => setFormData({...formData, is_emergency: e.target.checked})}
            />
            <span className={`text-xs font-bold ${formData.is_emergency ? 'text-white' : 'text-red-700'}`}>
              {formData.is_emergency ? "CRITICAL SYSTEM ALERT" : "Mark as Critical Emergency"}
            </span>
          </label>

          {/* Submit */}
          <button 
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
            Transmit Report
          </button>
        </form>
      </div>
    </div>
  );
};

export default IssueReportModal;