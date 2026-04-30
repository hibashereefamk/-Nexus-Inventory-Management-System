import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AssignTasksManager from './assigntasksmanager';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Send, Bell, Truck, Info, Package, 
  ChevronRight, ClipboardList 
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function DepartmentTaskMaster() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); // State for the order being assigned

  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    packing: tasks.filter(t => t.status === 'PACKING').length,
    packed: tasks.filter(t => t.status === 'PACKED').length,
    shipped: tasks.filter(t => t.status === 'SHIPPED').length,
  };

  const fetchDepartmentTasks = async () => {
    try {
      setLoading(true);
      // Matches path('manager/assignments/', ManagerAssignmentListView.as_view())
      const res = await axios.get(`${API_BASE}/api/orders/manager/assignments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDepartmentTasks(); 
  }, []);

  const openAssignModal = (task) => {
    setSelectedOrder(task);
    setShowAssignModal(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Synchronizing Registry...</p>
    </div>
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* --- Dashboard Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Queue</p>
          <h2 className="text-3xl font-black mt-2 text-slate-800">{stats.total}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm">
          <p className="text-amber-600 text-[10px] font-black uppercase tracking-widest">Unassigned</p>
          <h2 className="text-3xl font-black mt-2 text-amber-600">{stats.pending}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm">
          <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Packing</p>
          <h2 className="text-3xl font-black mt-2 text-blue-600">{stats.packing}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm">
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Ready to Ship</p>
          <h2 className="text-3xl font-black mt-2 text-emerald-600">{stats.packed}</h2>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800 uppercase flex items-center gap-2">
              <ClipboardList className="text-indigo-600" /> Task Assignment Terminal
            </h2>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase">Manage and allocate confirmed orders to department staff</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Order ID..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all w-64" 
              />
            </div>
          </div>
        </div>
  
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Manifest Info</th>
                <th className="px-8 py-5">Allocation Status</th>
                <th className="px-8 py-5">Workflow State</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 p-3 rounded-xl">
                        <Package size={20} className="text-indigo-600"/>
                      </div>
                      <div>
                        <span className="font-black text-slate-800 text-base">#{task.order_number}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {task.items?.length || 0} Units • Confirmed {new Date(task.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {task.staff_username ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-200">
                          {task.staff_username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{task.staff_username}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 italic">Awaiting Assignment</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      task.status === 'SHIPPED' ? 'bg-slate-100 text-slate-500' : 
                      task.status === 'PACKING' ? 'bg-blue-100 text-blue-600' : 
                      task.status === 'PACKED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.status === 'PENDING' && (
                        <button 
                          onClick={() => openAssignModal(task)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-indigo-100"
                        >
                          <Send size={14}/> Assign Staff
                        </button>
                      )}
                      
                      {task.status === 'PACKED' && (
                        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-emerald-100">
                          <Truck size={14}/> Dispatch
                        </button>
                      )}

                      <button 
                        onClick={() => navigate(`/tasks/detail/${task.id}`)} 
                        className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <ChevronRight size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Advanced Assign Modal --- */}
      <AssignTasksManager 
        isOpen={showAssignModal} 
        onClose={() => {
          setShowAssignModal(false);
          setSelectedOrder(null);
        }} 
        onSuccess={() => {
          fetchDepartmentTasks();
          setShowAssignModal(false);
        }}
        token={token}
        selectedOrder={selectedOrder}
      />
    </div>
  );
}

export default DepartmentTaskMaster;