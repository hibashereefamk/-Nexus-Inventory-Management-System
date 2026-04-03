import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  ArrowRightLeft,
  Plus,
  X,
  User,
  Package,
  Calendar,
  Send
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function DepartmentTaskMaster() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // --- New State for Create Task Logic ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    staff: '',
    product: '',
    quantity: 1,
    deadline_date: '',
  });

  const navigate = useNavigate();
  const departmentName = localStorage.getItem('department_name') || 'Department';
  const token = localStorage.getItem('access_token');

  const fetchDepartmentTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // If the table is empty, try: setTasks(res.data) 
      // instead of res.data.results
      setTasks(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Error", err);
    } finally {
      setLoading(false);
    }
};

  // --- Fetch Staff and Products for the Modal ---
  const fetchAssignmentData = async () => {
    try {
      const [staffRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE}/api/department-staff/`, { headers: { Authorization: `Bearer ${token}` }}),
        axios.get(`${API_BASE}/api/inventory/products/`, { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setStaffList(staffRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Error fetching assignment data", err);
    }
  };

  useEffect(() => { 
    fetchDepartmentTasks(); 
    fetchAssignmentData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    // RESTRUCTURE DATA: Wrap product and quantity into the 'items' array
    const payload = {
    staff: formData.staff,
    deadline_date: formData.deadline_date,
    items: [{ 
        product: formData.product, 
        quantity: formData.quantity 
    }]
};

    try {
        await axios.post(`${API_BASE}/api/tasks/manager/create-assignment/`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setShowCreateModal(false);
        fetchDepartmentTasks();
        setFormData({ staff: '', product: '', quantity: 1, deadline_date: '' });
        alert("Task Assigned Successfully!");
    } catch (err) {
        console.error("Errors:", err.response?.data);
        alert("Failed to assign task. Ensure all fields are valid.");
    }
};

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">LOADING REGISTRY...</div>;

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {departmentName.toUpperCase()} TASK REGISTRY
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage and update all localized departmental operations.</p>
        </div>
        
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
        >
          <Plus size={20} /> Create New Task
        </button>
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

      {/* Task Table */}
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
                   Staff #{task.staff_username || task.staff}
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
                    <button onClick={() => navigate(`/tasks/inspect/${task.id}`)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit3 size={18} /></button>
                    <button onClick={() => navigate(`/tasks/detail/${task.id}`)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg"><ArrowRightLeft size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- CREATE TASK MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">ASSIGN NEW TASK</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-8 space-y-5">
              {/* Staff Select */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block flex items-center gap-2">
                  <User size={14} className="text-indigo-500" /> Assigned Personnel
                </label>
                <select 
                  required
                  className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.staff}
                  onChange={(e) => setFormData({...formData, staff: e.target.value})}
                >
                  <option value="">Select Department Staff...</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                </select>
              </div>

              {/* Product Select */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block flex items-center gap-2">
                  <Package size={14} className="text-indigo-500" /> Product Selection
                </label>
                <select 
                  required
                  className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.product}
                  onChange={(e) => setFormData({...formData, product: e.target.value})}
                >
                  <option value="">Choose item...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.total_stock})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Quantity</label>
                  <input 
                    type="number" min="1" required
                    className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block flex items-center gap-2">
                    <Calendar size={14} /> Deadline
                  </label>
                  <input 
                    type="date" required
                    className="w-full p-3 bg-slate-50 border-none rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.deadline_date}
                    onChange={(e) => setFormData({...formData, deadline_date: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} /> CONFIRM ASSIGNMENT
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentTaskMaster;