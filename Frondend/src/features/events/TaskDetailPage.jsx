import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State for ERP-specific requirements based on Backend models
  const [requirements, setRequirements] = useState({
    is_expiry_checked: false,
    is_damage_verified: false,
    is_warranty_activated: false
  });

  const fetchTask = async () => {
    const token = localStorage.getItem('access_token');
    try {
      // Fetching from the endpoint defined in your Backend views
      const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(res.data);
      // Initialize requirements if they exist in the task data
      setRequirements({
        is_expiry_checked: res.data.is_expiry_checked || false,
        is_damage_verified: res.data.is_damage_verified || false,
        is_warranty_activated: res.data.is_warranty_activated || false
      });
    } catch (err) {
      console.error("Error fetching task:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    const token = localStorage.getItem('access_token');
    
    // Prepare payload including department-specific flags
    const payload = { 
      status: newStatus,
      ...requirements 
    };

    try {
      // Using the update view logic from your backend
      await axios.patch(`${API_BASE}/api/orders/staff/tasks/${id}/`, 
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Workflow updated to: ${newStatus}`);
      fetchTask();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Update failed.";
      alert(errorMsg); // This catches the "You must check expiry..." errors from your Backend
    }
  };

  if (loading) return <div className="p-10 text-center">Loading ERP Task Data...</div>;
  if (!task) return <div className="p-10 text-center">Order not found in registry.</div>;

  // Determine which requirement to show based on department name
  const deptName = task.department_name?.toLowerCase() || "";

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-blue-600 flex items-center gap-2 transition-colors">
            <span className="text-xl">←</span> Back to Operations Queue
          </button>
          <div className="text-right">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Priority Workflow</span>
            <span className="text-sm font-mono bg-white px-3 py-1 border rounded shadow-sm">UID: {id}</span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">Order {task.order_number}</h1>
                  <p className="text-slate-400 text-sm">Assigned via {task.department_name} Department</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-black uppercase ${
                  task.status === 'SHIPPED' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  {task.status}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Inventory Manifest</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-3 font-semibold text-slate-700">Product Ref</th>
                        <th className="py-3 font-semibold text-slate-700">Required Qty</th>
                        <th className="py-3 font-semibold text-slate-700 text-right">Unit Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {task.items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-4 font-mono text-sm text-blue-600">ID: {item.product}</td>
                          <td className="py-4 font-bold text-slate-700">{item.quantity} Units</td>
                          <td className="py-4 text-right">
                             <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Awaiting Inspection</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ERP Control Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                ⚙️ Operations Control
              </h3>
              
              <div className="space-y-4 mb-8">
                {/* Dynamic Checkboxes based on Department Logic */}
                {deptName.includes("food") && (
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={requirements.is_expiry_checked}
                      onChange={(e) => setRequirements({...requirements, is_expiry_checked: e.target.checked})}
                      className="w-4 h-4 accent-amber-600"
                    />
                    <span className="text-sm font-medium text-amber-900">Verify Expiry Date</span>
                  </label>
                )}

                {deptName.includes("furniture") && (
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={requirements.is_damage_verified}
                      onChange={(e) => setRequirements({...requirements, is_damage_verified: e.target.checked})}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-blue-900">Damage Inspection Complete</span>
                  </label>
                )}

                {deptName.includes("electronics") && (
                  <label className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-100 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={requirements.is_warranty_activated}
                      onChange={(e) => setRequirements({...requirements, is_warranty_activated: e.target.checked})}
                      className="w-4 h-4 accent-purple-600"
                    />
                    <span className="text-sm font-medium text-purple-900">Activate System Warranty</span>
                  </label>
                )}
              </div>

              <div className="grid gap-3">
                {task.status === 'PENDING' && (
                  <button 
                    onClick={() => handleStatusUpdate('PACKING')}
                    className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 transition-all shadow-md"
                  >
                    Start Packing Sequence
                  </button>
                )}

                {(task.status === 'PACKING' || task.status === 'PENDING') && (
                  <button 
                    onClick={() => handleStatusUpdate('PACKED')}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    Set as 'Packed & Verified'
                  </button>
                )}

                {task.status === 'PACKED' && (
                  <button 
                    onClick={() => handleStatusUpdate('SHIPPED')}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-all shadow-md"
                  >
                    Dispatch Shipment
                  </button>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-xs font-black text-blue-800 uppercase mb-2 tracking-tighter">System Log</h4>
              <p className="text-xs text-blue-600 leading-relaxed">
                Deadline: <span className="font-bold">{task.deadline_date || task.shipping_deadline}</span><br/>
                Assigned Staff: <span className="font-bold">{task.staff_name || 'System User'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;