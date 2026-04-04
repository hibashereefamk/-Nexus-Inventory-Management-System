import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  Box, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  RefreshCcw, 
  Filter,
  BarChart3
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const TaskInspectionPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      // Inside TaskInspectionPage.jsx
const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/`, {
  headers: { Authorization: `Bearer ${token}` }
});

// This checks if the data is in 'results' or is a direct array
const taskList = Array.isArray(res.data) ? res.data : res.data.results;
setTasks(taskList || []);
    } catch (err) {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Logic to calculate progress based on your new serializer's 'items'
  const calculateProgress = (items) => {
    if (!items || items.length === 0) return 0;
    const verified = items.filter(item => item.is_inspected).length;
    return Math.round((verified / items.length) * 100);
  };

  const filteredTasks = tasks.filter(t => 
    t.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={36} />
              Operations Center
            </h1>
            <p className="text-slate-500 font-medium mt-2">Inventory Inspection & Fulfillment Queue</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <div className="px-4 py-1 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase">Active Load</p>
              <p className="text-xl font-black text-slate-800">{tasks.length}</p>
            </div>
            <button 
              onClick={() => fetchTasks()}
              className="p-3 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID (e.g. ORD-8A2F)..." 
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="md:col-span-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={18} /> Advanced Filters
          </button>
        </div>

        {/* Task Grid */}
        <div className="grid gap-4">
          {filteredTasks.length > 0 ? filteredTasks.map((task) => {
            const progress = calculateProgress(task.items);
            const isLate = new Date(task.deadline_date) < new Date() && task.status !== 'SHIPPED';

            return (
              <div 
                key={task.id}
                onClick={() => navigate(`/inspect/${task.id}`)}
                className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-6">
                  {/* Progress Ring / Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs ${
                    progress === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {progress}%
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-black text-slate-800 text-lg">{task.order_number}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                        {task.department_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm font-medium text-slate-400">
                      <span className={`flex items-center gap-1.5 ${isLate ? 'text-red-500' : ''}`}>
                        <Clock size={14} /> {task.deadline_date || 'No Deadline'}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="flex items-center gap-1.5"><Box size={14} /> {task.items?.length || 0} Products</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 mt-4 md:mt-0">
                  {/* Visual Status Bar */}
                  <div className="hidden lg:block w-32">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2 border ${
                    task.status === 'SHIPPED' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-slate-900 text-white border-slate-900'
                  }`}>
                    {task.status === 'SHIPPED' ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                    {task.status}
                  </div>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">No assignments found in the registry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskInspectionPage;