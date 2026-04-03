import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Play, CheckCircle } from 'lucide-react';

function OperationsView() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/operations/active-tasks/').then(res => setItems(res.data));
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/operations/tasks/${id}/`, { status: newStatus });
      setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Settings size={20} className="text-gray-600" /> Current Operations
      </h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-sm uppercase text-gray-600">
            <tr>
              <th className="p-4">Reference</th>
              <th className="p-4">Operator</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="p-4 font-medium">{item.ref_code}</td>
                <td className="p-4 text-sm text-gray-600">{item.operator_name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Running' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4">
                  {item.status !== 'Running' && (
                    <button 
                      onClick={() => updateStatus(item.id, 'Running')}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-bold"
                    >
                      <Play size={14} /> Start Task
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default OperationsView ;