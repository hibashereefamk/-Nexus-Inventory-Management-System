import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, Search, ArrowRightLeft, Plus, X, 
  Package, Calendar, Send, Bell, Truck, Info
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

function DepartmentTaskMaster() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [products, setProducts] = useState([]);

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
      const res = await axios.get(`${API_BASE}/api/orders/manager/list/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({ staff: '', deadline_date: '' });
  const [items, setItems] = useState([{ product: '', quantity: 1, is_inspected: false }]);

  const fetchFormData = async () => {
    try {
      const [staffRes, prodRes] = await Promise.all([
        axios.get(`${API_BASE}/api/orders/manager/department/staff/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/api/inventory/products/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.results || []);
      setProducts(prodRes.data);
    } catch (err) {
      console.error("Error loading form data", err);
    }
  };

  useEffect(() => { 
    fetchDepartmentTasks(); 
    fetchFormData();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { staff: formData.staff, deadline_date: formData.deadline_date, items };
    try {
      await axios.post(`${API_BASE}/api/orders/manager/create-order/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Order created successfully!");
      setShowCreateModal(false);
      fetchDepartmentTasks();
      setFormData({ staff: '', deadline_date: '' });
      setItems([{ product: '', quantity: 1, is_inspected: false }]);
    } catch (err) {
      alert("❌ Error creating order");
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">LOADING REGISTRY...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      
      {/* --- FEATURE: Top Status Cards (Light Theme) --- */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Orders</p>
          <h2 className="text-4xl font-black mt-2 text-slate-800">{stats.total}</h2>
        </div>
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-amber-600 text-xs font-bold uppercase tracking-wider">Pending Fulfillment</p>
          <h2 className="text-4xl font-black mt-2 text-amber-600">{stats.pending}</h2>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">Packing In Progress</p>
          <h2 className="text-4xl font-black mt-2 text-blue-600">{stats.packing}</h2>
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Packed & Ready</p>
          <h2 className="text-4xl font-black mt-2 text-emerald-600">{stats.packed}</h2>
        </div>
        <div className="bg-slate-200 p-6 rounded-2xl border border-slate-300 shadow-sm">
          <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Shipped/Completed</p>
          <h2 className="text-4xl font-black mt-2 text-slate-700">{stats.shipped}</h2>
        </div>
      </div>

      {/* --- FEATURE: Master Registry Table (White Theme) --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-black tracking-tight text-slate-800">Master Order Registry</h2>
          <div className="flex gap-3">
             <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
               <Plus size={16}/> New Order
             </button>
             <div className="relative">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
               <input type="text" placeholder="Filter Registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
             </div>
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Assigned Staff</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-black text-slate-800">#{task.order_number}</span>
                  <p className="text-[10px] text-slate-400 font-bold">{task.assigned_at?.split('T')[0]}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black border border-indigo-100">
                      {task.staff_username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{task.staff_username || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                    {task.items?.length || 0} Products
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    task.status === 'SHIPPED' ? 'bg-slate-100 text-slate-500' : 
                    task.status === 'PACKING' ? 'bg-blue-100 text-blue-600' : 
                    task.status === 'PACKED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {task.status === 'PENDING' && <button title="Notify Staff" className="p-2 bg-amber-50 text-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-colors"><Bell size={16}/></button>}
                    {task.status === 'PACKED' && <button className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1 text-[10px] font-bold px-3 transition-colors shadow-sm"><Truck size={14}/> SHIP</button>}
                    <button onClick={() => navigate(`/tasks/detail/${task.id}`)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"><Info size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- CREATE ORDER MODAL (White Theme) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">PROVISION NEW ORDER</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-[10px] font-black text-indigo-600 uppercase mb-4 tracking-widest">Logistics</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Personnel</label>
                      <select name="staff" value={formData.staff} onChange={handleChange} required className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select Staff...</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.manager} - {s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Deadline</label>
                      <input type="date" name="deadline_date" value={formData.deadline_date} onChange={handleChange} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 overflow-y-auto max-h-[400px]">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase mb-4 tracking-widest">Order Manifest</h3>
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 gap-3 mb-4 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="col-span-3">
                      <select value={item.product} onChange={(e) => handleItemChange(index, 'product', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700">
                        <option value="">Select Item...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Qty: {p.total_stock})</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <input type="number" value={item.quantity} min="1" onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700" />
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" checked={item.is_inspected} onChange={(e) => handleItemChange(index, 'is_inspected', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </div>
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 transition-colors"><X size={16}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => setItems([...items, { product: '', quantity: 1, is_inspected: false }])} className="text-indigo-600 text-xs font-black uppercase mt-2 hover:text-indigo-800 transition-colors">+ Add Product Row</button>
              </div>

              <div className="md:col-span-3 flex justify-end gap-4 border-t border-slate-100 pt-6">
                 <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                 <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl text-sm font-black shadow-lg shadow-indigo-100 transition-all active:scale-95">AUTHORIZE ASSIGNMENT</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentTaskMaster;