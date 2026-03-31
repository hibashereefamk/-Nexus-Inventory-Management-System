import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  MoreVertical, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function DepartmentTaskMaster() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const navigate = useNavigate();
  const departmentName = localStorage.getItem('department_name') || 'Department';

  const fetchDepartmentTasks = async () => {
    const token = localStorage.getItem('access_token');
    try {
      setLoading(true);
      // Fetches all tasks filtered by the user's department on the backend
      const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data.results || []);
    } catch (err) {
      console.error("Error fetching dept tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartmentTasks(); }, []);

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-20 text-center text-slate-400">Loading Department Registry...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {departmentName.toUpperCase()} TASK REGISTRY
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage and update all localized departmental operations.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-blue-50 border border-blue-100 px-6 py-2 rounded-2xl">
            <span className="block text-[10px] font-bold text-blue-600 uppercase">Total Load</span>
            <span className="text-xl font-black text-blue-800">{tasks.length} Tasks</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Order Number..." 
            className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
          <Filter size={16} className="text-slate-400" />
          <select 
            className="bg-transparent border-none outline-none text-sm font-bold text-slate-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PACKING">Packing</option>
            <option value="SHIPPED">Shipped</option>
          </select>
        </div>
      </div>

      {/* Main Task Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5">Order Reference</th>
              <th className="px-8 py-5">Assigned Staff</th>
              <th className="px-8 py-5">Deadline</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-5">
                  <span className="font-bold text-slate-800 block">#{task.order_number}</span>
                  <span className="text-xs text-slate-400">{task.items?.length || 0} Products Included</span>
                </td>
                <td className="px-8 py-5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                      ID
                    </div>
                    Staff #{task.staff || 'Unassigned'}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <AlertCircle size={14} className={new Date(task.deadline_date) < new Date() ? 'text-red-500' : 'text-slate-300'} />
                    {task.deadline_date}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    task.status === 'SHIPPED' ? 'bg-emerald-100 text-emerald-600' : 
                    task.status === 'PACKING' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 🔷 Action 1: Deep Inspect/Update */}
                    <button 
                      onClick={() => navigate(`/tasks/inspect/${task.id}`)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg title='Inspect & Update'"
                    >
                      <Edit3 size={18} />
                    </button>
                    {/* 🔷 Action 2: Quick Status Toggle */}
                    <button 
                      onClick={() => navigate(`/tasks/detail/${task.id}`)}
                      className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"
                    >
                      <ArrowRightLeft size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTasks.length === 0 && (
          <div className="p-20 text-center">
            <CheckCircle size={48} className="mx-auto text-slate-100 mb-4" />
            <p className="text-slate-400 italic font-medium">No tasks match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentTaskMaster;