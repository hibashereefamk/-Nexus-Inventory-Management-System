import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Filter, ArrowUpDown, ClipboardList, 
  Clock, CheckCircle2, AlertCircle, ChevronRight,
  LayoutDashboard, Loader2, RefreshCcw, Wifi, WifiOff
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';
const WS_BASE = 'ws://127.0.0.1:8000/ws/inventory/'; // Adjust path to match your routing.py

const TaskInspectionPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('desc');

  // Memoized fetch to allow calling from WebSocket events
  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
      setError(null);
    } catch (err) {
      setError("Synchronization failed. Check connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- WebSocket Integration ---
  useEffect(() => {
    const socket = new WebSocket(WS_BASE);

    socket.onopen = () => {
      console.log("Connected to Command Center Stream");
      setWsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Logic: If any task update occurs, refresh the list silently
      if (data.type === 'task_update') {
        console.log(`Real-time update: ${data.message}`);
        fetchTasks(true); // Silent refresh
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from Stream");
      setWsConnected(false);
    };

    return () => socket.close();
  }, [fetchTasks]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchesSearch = t.order_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline_date || 0);
        const dateB = new Date(b.deadline_date || 0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [tasks, searchQuery, statusFilter, sortOrder]);

  if (loading && tasks.length === 0) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="font-mono text-slate-500 animate-pulse">Establishing Secure Uplink...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
               {wsConnected ? 
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Wifi size={10} /> LIVE
                </span> : 
                <span className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                  <WifiOff size={10} /> OFFLINE
                </span>
               }
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-blue-600" size={36} />
              Staff Command Center
            </h1>
            <p className="text-slate-500 font-medium mt-1">Real-time Warehouse Inventory & Task Distribution</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm items-center">
            <div className="px-6 py-2 border-r border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Load</p>
              <p className="text-xl font-black text-slate-800">{tasks.length}</p>
            </div>
            <button 
              onClick={() => fetchTasks()}
              className="p-4 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Quick search Order Ref..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="md:col-span-4">
            <select 
              className="w-full bg-slate-50 py-3 px-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Pickup</option>
              <option value="PACKING">Packing In-Progress</option>
              <option value="PACKED">Packed & Ready</option>
            </select>
          </div>

          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="md:col-span-3 flex items-center justify-center gap-3 bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all active:scale-95"
          >
            <ArrowUpDown size={18} />
            {sortOrder === 'asc' ? 'Deadline: Nearest' : 'Deadline: Furthest'}
          </button>
        </div>

        {/* Task Grid */}
        <div className="grid gap-4">
          {filteredTasks.length > 0 ? filteredTasks.map((task) => (
            <div 
              key={task.id}
              onClick={() => navigate(`/inspect/${task.id}`)}
              className="bg-white border border-slate-100 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer transition-all group animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  task.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <ClipboardList size={28} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">{task.order_number}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm font-medium text-slate-400">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {task.deadline_date || 'No Date'}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>{task.items?.length || 0} Items</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 md:mt-0">
                <div className={`px-4 py-2 rounded-xl text-[11px] font-black tracking-widest flex items-center gap-2 ${
                   task.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                   task.status === 'PACKING' ? 'bg-blue-100 text-blue-700' : 
                   'bg-emerald-100 text-emerald-700'
                }`}>
                  {task.status === 'PENDING' ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
                  {task.status}
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">No active tasks found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskInspectionPage;