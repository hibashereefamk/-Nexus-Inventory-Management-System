import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const updateStatus = async (newStatus) => {
    const token = localStorage.getItem('access_token');
    try {
      await axios.patch(`${API_BASE}/api/orders/staff/tasks/${id}/`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Order moved to ${newStatus}`);
      fetchTask(); // Refresh local data
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Task Details...</div>;
  if (!task) return <div className="p-10 text-center">Task not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 text-blue-600 font-bold">← Back to Queue</button>
        
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-800">Order #{task.order_number}</h1>
              <p className="text-slate-500">Deadline: {task.deadline_date}</p>
            </div>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
              Current Status: {task.status}
            </span>
          </div>

          {/* ITEM LIST */}
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-slate-700">Items to Pack</h2>
            <div className="space-y-4">
              {task.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between p-4 bg-slate-50 rounded-xl border">
                  <span className="font-medium text-slate-700">Product ID: {item.product}</span>
                  <span className="font-bold text-blue-600">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {task.status === 'PENDING' && (
              <button 
                onClick={() => updateStatus('PACKING')}
                className="bg-amber-500 text-white font-bold py-4 rounded-xl hover:bg-amber-600 transition-all"
              >
                START PACKING
              </button>
            )}

            {(task.status === 'PACKING' || task.status === 'PENDING') && (
              <button 
                onClick={() => updateStatus('PACKED')}
                className="bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all"
              >
                MARK AS PACKED
              </button>
            )}

            {task.status === 'PACKED' && (
              <button 
                onClick={() => navigate(`/inventory/reorder/${task.id}`)} // Logic for shipping or reordering
                className="bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all"
              >
                READY FOR SHIPMENT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;