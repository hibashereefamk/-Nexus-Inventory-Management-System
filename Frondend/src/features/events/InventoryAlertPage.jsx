import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://127.0.0.1:8000';

function InventoryAlertPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, EXPIRY, LOW_STOCK
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    const token = localStorage.getItem('access_token');
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/inventory/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(res.data.results || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchAlerts();
  const interval = setInterval(fetchAlerts, 60000); // Auto refresh every 1 minute
  return () => clearInterval(interval); // Cleanup when user leaves page
}, []);

  // Operation: Mark as Read/Resolved
  const handleResolve = async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(`${API_BASE}/api/inventory/notifications/${id}/`, 
        { is_read: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh list after resolving
      fetchAlerts();
    } catch (err) {
      alert("Failed to update alert.");
    }
  };

  // Filter logic
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'ALL') return true;
    return alert.notification_type === filter;
  });

  if (loading) return <div className="p-10 text-center">Loading Inventory Alerts...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      {/* Header Area */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="text-sm text-blue-600 mb-2 hover:underline"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-800">Inventory Alerts</h1>
          <p className="text-slate-500">Manage critical stock levels and expiry warnings</p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['ALL', 'EXPIRY', 'STOCK'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                filter === type ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="grid gap-4">
        {filteredAlerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`bg-white border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm transition-all hover:border-blue-300 ${alert.is_read ? 'opacity-60' : 'border-l-4 border-l-red-500'}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  alert.notification_type === 'EXPIRY' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                }`}>
                  {alert.notification_type || 'General'}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">{alert.title}</h3>
              <p className="text-slate-600 text-sm">{alert.message}</p>
            </div>

            <div className="flex gap-3 mt-4 md:mt-0">
              {/* OPERATION 1: REORDER */}
              <button 
                onClick={() => navigate(`/inventory/reorder/${alert.id}`)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
              >
                REORDER ITEM
              </button>

              {/* OPERATION 2: RESOLVE */}
              {!alert.is_read && (
                <button 
                  onClick={() => handleResolve(alert.id)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50"
                >
                  MARK AS RESOLVED
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed">
            <p className="text-slate-400">No active alerts for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryAlertPage;