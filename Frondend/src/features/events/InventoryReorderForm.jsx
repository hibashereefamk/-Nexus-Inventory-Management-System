import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

function InventoryReorderForm() {
  const { id } = useParams(); // Get the Alert/Notification ID from URL
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertData, setAlertData] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    quantity: '',
    supplier_notes: '',
    priority: 'NORMAL',
    expected_date: ''
  });

  useEffect(() => {
    const fetchAlertDetails = async () => {
      const token = localStorage.getItem('access_token');
      try {
        // Fetch specific notification to know which product we are reordering
        const res = await axios.get(`${API_BASE}/api/inventory/notifications/${id}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlertData(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching alert details", err);
        setLoading(false);
      }
    };
    fetchAlertDetails();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('access_token');

    try {
      // Example Endpoint: POST to your reorder/procurement logic
      await axios.post(`${API_BASE}/api/inventory/reorder/`, {
        notification_id: id,
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Reorder Request Sent Successfully!");
      navigate('/inventory/alerts'); // Go back to alerts list
    } catch (err) {
      alert("Failed to submit reorder. Please check all fields.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-mono">Initializing Procurement Form...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-800 mb-6 flex items-center gap-2 transition-all">
          ← Cancel and Go Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          {/* Header Section */}
          <div className="bg-slate-900 p-8 text-white">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Procurement Module</span>
            <h1 className="text-2xl font-bold mt-2">Reorder Request</h1>
            {alertData && (
              <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/10">
                <p className="text-xs text-slate-400 uppercase font-bold">Related Alert</p>
                <p className="text-sm font-medium">{alertData.message}</p>
              </div>
            )}
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Order Quantity</label>
                <input 
                  required
                  type="number"
                  placeholder="e.g. 500"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>

              {/* Priority Field */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Priority Level</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="NORMAL">Normal Stockup</option>
                  <option value="URGENT">Urgent - Out of Stock</option>
                  <option value="CRITICAL">Critical - High Priority</option>
                </select>
              </div>
            </div>

            {/* Expected Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Requested Delivery Date</label>
              <input 
                type="date"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.expected_date}
                onChange={(e) => setFormData({...formData, expected_date: e.target.value})}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notes for Supplier</label>
              <textarea 
                rows="4"
                placeholder="Specific batch requirements or packaging instructions..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.supplier_notes}
                onChange={(e) => setFormData({...formData, supplier_notes: e.target.value})}
              />
            </div>

            {/* Submit Button */}
            <button 
              disabled={submitting}
              type="submit"
              className={`w-full py-4 rounded-xl text-white font-bold tracking-wide shadow-lg transition-all ${
                submitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              {submitting ? 'PROCESSING REQUEST...' : 'SUBMIT REORDER REQUEST'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InventoryReorderForm;