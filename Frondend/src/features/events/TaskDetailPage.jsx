import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, Package, AlertTriangle, ShieldCheck, 
  ArrowRight, Info, Save, ClipboardCheck
} from 'lucide-react';
import IssueReportModal from './IssueReportModal';

const API_BASE = 'http://127.0.0.1:8000';

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inspections, setInspections] = useState({});
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchTask = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await axios.get(`${API_BASE}/api/orders/staff/tasks/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTask(res.data);
      
      const initialInspections = {};
      res.data.items.forEach(item => {
        initialInspections[item.product] = { is_inspected: item.is_inspected };
      });
      setInspections(initialInspections);
    } catch (err) {
      console.error("Fetch error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const toggleVerify = (pId) => {
    setInspections(prev => ({
      ...prev,
      [pId]: { ...prev[pId], is_inspected: !prev[pId].is_inspected }
    }));
  };

  const handleSync = async () => {
  const token = localStorage.getItem('access_token');
  
  // Logic check: Are all items checked?
  const allItemsVerified = task.items.every(item => inspections[item.product]?.is_inspected);

  try {
    // 1. Sync the inspection checkboxes first
    await axios.patch(`${API_BASE}/api/orders/staff/tasks/${id}/inspect/`, 
      { inspections }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 2. If all items are verified, update the status to PACKED
    if (allItemsVerified) {
      const confirmPacked = window.confirm("All items verified! Change order status to PACKED?");
      if (confirmPacked) {
        await axios.patch(`${API_BASE}/api/orders/staff/tasks/${id}/`, 
          { status: 'PACKED' }, // Sending the new status
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Order status updated to PACKED!");
      }
    } else {
      alert("Inventory sync successful! (Check all items to mark as PACKED)");
    }

    fetchTask(); // Refresh data to show new status in UI
  } catch (err) {
    console.error(err);
    alert("Update failed. Ensure you have permission.");
  }
};

  if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse uppercase tracking-widest">Accessing Secure Manifest...</div>;

  const totalItems = task.items?.length || 0;
  const verifiedCount = Object.values(inspections).filter(i => i.is_inspected).length;

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans pb-20">
      <IssueReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        orderId={task.id}
      />

      {/* Top sticky Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all">
          <ChevronLeft size={20} /> Registry
        </button>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-slate-400 uppercase">Workflow Status</p>
            <p className="text-sm font-bold text-blue-600">{task.status}</p>
          </div>
          <button onClick={handleSync} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-100">
            <Save size={18} /> Sync Progress
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <ClipboardCheck className="text-blue-500" size={28} /> Item Checklist
              </h2>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">
                  {verifiedCount} / {totalItems} Verified
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {task.items?.map((item) => {
                const isChecked = inspections[item.product]?.is_inspected;
                return (
                  <div key={item.id} className={`p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${isChecked ? 'bg-emerald-50/20' : 'hover:bg-slate-50/50'}`}>
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 bg-white rounded-3xl border-2 border-slate-100 flex items-center justify-center shadow-sm overflow-hidden group">
                        {item.product_details?.image ? (
                          <img src={`${API_BASE}${item.product_details.image}`} alt="p" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <Package className="text-slate-200" size={32} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg leading-tight">{item.product_details?.name || "Inventory Item"}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-widest">SKU: {item.product_details?.sku}</span>
                          <span className="text-[10px] font-black text-blue-600 uppercase">Target: {item.quantity} Units</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setSelectedProduct({ id: item.product, name: item.product_details?.name, sku: item.product_details?.sku });
                          setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-[10px] uppercase text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                      >
                        <AlertTriangle size={16} /> Report
                      </button>

                      <button 
                        onClick={() => toggleVerify(item.product)}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border-2 ${
                          isChecked 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' 
                          : 'bg-white border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {isChecked ? <ShieldCheck size={16} /> : 'Verify Item'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-[0.2em]">Assignment Data</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Order Reference</p>
                <p className="font-mono text-sm tracking-wider">{task.order_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Department</p>
                  <p className="text-sm font-black text-blue-400">{task.department_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Assigned Staff</p>
                  <p className="text-sm font-black">{task.staff_username}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-800">
                <div className="flex items-center gap-3 text-amber-400">
                  <AlertTriangle size={18} />
                  <div>
                    <p className="text-[10px] uppercase font-black leading-none">Shipment Deadline</p>
                    <p className="text-sm font-bold mt-1">{task.deadline_date}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 italic">
              <Info size={18} className="text-blue-500" /> Operational Protocol
            </h3>
            <ul className="space-y-4 text-[11px] text-slate-500 font-bold leading-relaxed">
              <li className="flex gap-3"><ArrowRight size={14} className="shrink-0 text-blue-500"/> Validate SKUs against the database manifest.</li>
              <li className="flex gap-3"><ArrowRight size={14} className="shrink-0 text-blue-500"/> Flag any physical damages via the Report button.</li>
              <li className="flex gap-3"><ArrowRight size={14} className="shrink-0 text-blue-500"/> Verify all items before finalizing status.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;