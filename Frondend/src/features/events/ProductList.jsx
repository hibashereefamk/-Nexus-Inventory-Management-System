import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit, Trash2, User, Clock, ShieldAlert,ShieldCheck, History, X, Package, Truck,Info  } from 'lucide-react';


const ProductFormModal = ({ isOpen, onClose, existingProduct, onSave, staffMembers, currentUser }) => {
    const INITIAL_STATE = {
        name: '', sku: '', category: '', department: '', status: 'AVAILABLE',
        priority: 'LOW', total_stock: 0, min_stock_level: 5, assigned_staff: '',
        expiry_date: '', warranty_expiry: '', manager_deadline: '', 
        reorder_level: '', damage_notes: '', quantity_to_ship: 1
    };

    const [formData, setFormData] = useState(INITIAL_STATE);

    // Hardcoded IDs from your JSON data
    const departments = [
        { id: 2, name: "Food & Beverage" },
        { id: 3, name: "Electronics & IT" },
        { id: 4, name: "Office Supplies & Stationery" },
        { id: 5, name: "Furniture & Fixtures" }
    ];

    const categories = [
        { id: 1, name: "Food Items", deptId: 2 },
        { id: 5, name: "Electronic Assets", deptId: 3 },
        { id: 6, name: "Stationery", deptId: 4 },
        { id: 7, name: "Paper Products", deptId: 4 },
        { id: 8, name: "Furniture", deptId: 5 }
    ];

    const activeDeptId = parseInt(formData.department);

    useEffect(() => {
        if (isOpen) {
            if (existingProduct) {
                setFormData({
                    ...existingProduct,
                    assigned_staff: existingProduct.assigned_staff?.id || existingProduct.assigned_staff || ''
                });
            } else {
                setFormData({ ...INITIAL_STATE, assigned_staff: currentUser?.id || '' });
            }
        }
    }, [isOpen, existingProduct, currentUser]);

    const generateSKU = () => {
        const dept = departments.find(d => d.id === activeDeptId);
        const prefix = dept ? dept.name.substring(0, 2).toUpperCase() : 'NX';
        const code = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
        setFormData({ ...formData, sku: code });
    };

    const handleLocalSave = () => {
        if (!formData.name || !formData.sku || !formData.department || !formData.category) {
            alert("❌ Required: Name, SKU, Department, and Category.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[250] flex justify-center items-center p-4">
            <div className="bg-[#f8f9fa] rounded-lg w-full max-w-4xl shadow-2xl border border-slate-300 flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Django Style Header */}
                <div className="bg-[#417690] p-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold uppercase tracking-wide">
                        {existingProduct ? `Change Product: ${formData.name}` : 'Add Product'}
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1 rounded transition-colors"><X size={24}/></button>
                </div>

                {/* Form Body - Styled like Django Fieldsets */}
                <div className="overflow-y-auto p-4 space-y-4">
                    
                    {/* Fieldset: Identification */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm">
                        <div className="bg-slate-100 p-2 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">Identification & Basic Info</div>
                        <div className="p-4 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center border-b border-slate-50 pb-4">
                                <label className="md:w-1/4 text-sm font-bold text-slate-700">Product Name:</label>
                                <input className="flex-1 border border-slate-300 p-2 rounded text-sm outline-none focus:border-[#79aec8]" 
                                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center border-b border-slate-50 pb-4">
                                <label className="md:w-1/4 text-sm font-bold text-slate-700">SKU Identifier:</label>
                                <div className="flex-1 flex gap-2">
                                    <input className="flex-1 border border-slate-300 p-2 rounded font-mono text-sm bg-slate-50" 
                                        value={formData.sku} readOnly />
                                    <button onClick={generateSKU} className="bg-[#79aec8] text-white px-3 py-2 rounded text-xs font-bold hover:bg-[#417690] transition flex items-center gap-1">
                                        <History size={14}/> Auto-Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fieldset: Classification */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm">
                        <div className="bg-slate-100 p-2 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">Classification & Ownership</div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Department Unit:</label>
                                <select className="w-full border border-slate-300 p-2 rounded text-sm bg-white outline-none focus:border-[#79aec8]"
                                    value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                                    <option value="">---------</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Asset Category:</label>
                                <select className="w-full border border-slate-300 p-2 rounded text-sm bg-white outline-none focus:border-[#79aec8]"
                                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                    <option value="">---------</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600">Assigned Staff (Custodian):</label>
                                <select className="w-full border border-slate-300 p-2 rounded text-sm bg-white outline-none focus:border-[#79aec8]"
                                    value={formData.assigned_staff} onChange={(e) => setFormData({...formData, assigned_staff: e.target.value})}>
                                    <option value="">---------</option>
                                    {staffMembers?.map(s => <option key={s.id} value={s.id}>{s.username}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fieldset: Tracking & Deadlines (Conditional) */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm">
                        <div className="bg-slate-100 p-2 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">Logistics & Compliance</div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {activeDeptId === 2 && (
                                <div>
                                    <label className="text-xs font-bold text-orange-700">Expiry Date:</label>
                                    <input type="date" className="w-full border border-orange-200 p-2 rounded text-sm bg-orange-50" 
                                        value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} />
                                </div>
                            )}
                            {activeDeptId === 3 && (
                                <div>
                                    <label className="text-xs font-bold text-blue-700">Warranty Expiry:</label>
                                    <input type="date" className="w-full border border-blue-200 p-2 rounded text-sm bg-blue-50" 
                                        value={formData.warranty_expiry} onChange={(e) => setFormData({...formData, warranty_expiry: e.target.value})} />
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-slate-600">Manager Deadline:</label>
                                <input type="date" className="w-full border border-slate-300 p-2 rounded text-sm" 
                                    value={formData.manager_deadline} onChange={(e) => setFormData({...formData, manager_deadline: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600">Status:</label>
                                <select className="w-full border border-slate-300 p-2 rounded text-sm outline-none"
                                    value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                                    <option value="AVAILABLE">Available</option>
                                    <option value="PACKED">Packed</option>
                                    <option value="SHIPPED">Shipped</option>
                                    <option value="FLAGGED">Flagged</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Fieldset: Inventory Levels */}
                    <div className="bg-white border border-slate-200 rounded shadow-sm">
                        <div className="bg-slate-100 p-2 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">Inventory Controls</div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600">Total Stock:</label>
                                <input type="number" className="w-full border border-slate-300 p-2 rounded text-sm" 
                                    value={formData.total_stock} onChange={(e) => setFormData({...formData, total_stock: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600">Min Level:</label>
                                <input type="number" className="w-full border border-slate-300 p-2 rounded text-sm" 
                                    value={formData.min_stock_level} onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600">Priority:</label>
                                <select className="w-full border border-slate-300 p-2 rounded text-sm outline-none"
                                    value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600">Qty to Ship:</label>
                                <input type="number" className="w-full border border-slate-300 p-2 rounded text-sm font-bold text-indigo-600" 
                                    value={formData.quantity_to_ship} onChange={(e) => setFormData({...formData, quantity_to_ship: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {formData.status === 'FLAGGED' && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded">
                            <label className="text-xs font-bold text-red-700 block mb-1">Damage Notes:</label>
                            <textarea className="w-full border border-red-300 p-2 rounded text-sm min-h-[60px]" 
                                value={formData.damage_notes} onChange={(e) => setFormData({...formData, damage_notes: e.target.value})} />
                        </div>
                    )}
                </div>

                {/* Professional Action Bar */}
                <div className="bg-[#ebebeb] p-3 border-t border-slate-300 flex justify-between items-center">
                    <button onClick={onClose} className="bg-red-700 text-white px-4 py-2 rounded text-xs font-bold uppercase hover:bg-red-800 transition">Delete / Cancel</button>
                    <div className="flex gap-2">
                        <button onClick={handleLocalSave} className="bg-[#417690] text-white px-6 py-2 rounded text-xs font-bold uppercase hover:bg-[#2e5265] transition flex items-center gap-2 shadow-inner">
                            <ShieldCheck size={16}/> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- Main Component ---
const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });

    const fetchData = async () => {
        try {
            const config = getAuthHeader();
            const [userRes, prodRes] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/profile/', config),
                axios.get('http://127.0.0.1:8000/api/inventory/products/', config)
            ]);
            setUser(userRes.data);
            setProducts(prodRes.data);
        } catch (err) { console.error("Sync Failed", err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);
const handleSaveProduct = async (formData) => {
    // 1. Data Cleaning & Type Casting
    const payload = { 
        ...formData,
        // Ensure numeric fields are integers (Django rejects strings for IntegerFields)
        total_stock: parseInt(formData.total_stock) || 0,
        quantity_to_ship: parseInt(formData.quantity_to_ship) || 1,
        
        // Business Rule: Office Supplies (Dept 4) must have a reorder level
        reorder_level: formData.department === "4" || formData.department === 4 
            ? (parseInt(formData.reorder_level) || 10) 
            : null,
            
        // Fallback: If no custodian selected, assign to the current user ID
        assigned_staff: formData.assigned_staff || user?.id
    };

    // 2. Handle DateFields (Convert empty strings "" to null for Django)
    ['expiry_date', 'warranty_expiry', 'manager_deadline'].forEach(field => {
        if (payload[field] === "") payload[field] = null;
    });

    try {
        const config = getAuthHeader();
        
        // 3. Security Logic: Shipping Restriction
        if (payload.status === 'SHIPPED' && !user?.is_management) {
            alert("⛔ Security Restriction: Manager clearance required for shipping protocol.");
            return;
        }

        // 4. API Execution (Switch between PATCH and POST)
        if (selectedProduct) {
            // EDITING existing product
            await axios.patch(
                `http://127.0.0.1:8000/api/inventory/products/${selectedProduct.id}/`, 
                payload, 
                config
            );
        } else {
            // CREATING new product
            await axios.post(
                'http://127.0.0.1:8000/api/inventory/products/', 
                payload, 
                config
            );
        }
        
        // 5. Post-Success Refresh
        setIsFormOpen(false);
        fetchData(); // Reload the list to show updates
        
    } catch (err) {
        // Professional Error Handling: Extract Django Validation Errors
        const serverErrors = err.response?.data;
        if (serverErrors) {
            const errorList = Object.entries(serverErrors)
                .map(([field, message]) => `${field.toUpperCase()}: ${message}`)
                .join('\n');
            alert(`Synchronization Failed:\n${errorList}`);
        } else {
            alert("System Error: Could not connect to Nexus Database.");
        }
        console.error("Critical Sync Error:", err);
    }
};
    
    const handleDelete = async (id) => {
        const reason = window.prompt("Security Audit: Reason for deleting this asset?");
        if (!reason) return;

        try {
            // DELETE: Passing reason as query param as expected by your SystemLog logic
            await axios.delete(`http://127.0.0.1:8000/api/inventory/products/${id}/?reason=${encodeURIComponent(reason)}`, getAuthHeader());
            setProducts(products.filter(p => p.id !== id));
        } catch (err) { alert("Deletion Forbidden."); }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-mono text-indigo-600 animate-pulse">SYSTEM_LOADING...</div>;

    return (
        <div className="p-8 bg-[#f8fafc] min-h-screen">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div className="space-y-1">
        <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                Nexus<span className="text-indigo-600">Inventory</span>
            </h1>
        </div>
        <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                <ShieldAlert size={12} className="text-indigo-500" />
                Security Cleared
            </div>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>
            <p className="text-sm font-semibold text-slate-600">
                Operator: <span className="text-indigo-600 font-mono underline decoration-indigo-200 underline-offset-4">{user?.username || "AUTH_REQUIRED"}</span>
            </p>
        </div>
    </div>

    <div className="flex items-center gap-4">
        {/* Statistics or Quick Look (Optional addition for professional feel) */}
        <div className="hidden lg:flex flex-col items-end px-4 border-r border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Assets</span>
            <span className="text-xl font-black text-slate-800 font-mono">{products.length}</span>
        </div>

        {/* THE PROFESSIONAL BUTTON */}
        <button 
            onClick={() => { setSelectedProduct(null); setIsFormOpen(true); }}
            className="group relative inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:bg-indigo-600 hover:ring-4 hover:ring-indigo-100 active:scale-95 shadow-2xl shadow-slate-200 overflow-hidden"
        >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Package size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide">Create New Entry</span>
        </button>
    </div>
</header>

                <div className="grid grid-cols-1 gap-4">
                    {products.map(product => (
                        <div key={product.id} className={`bg-white border rounded-2xl p-5 flex items-center justify-between group transition-all hover:shadow-xl hover:border-indigo-100 ${product.is_overdue ? 'border-l-8 border-l-red-500' : 'border-l-8 border-l-slate-900'}`}>
                            <div className="flex items-center gap-6">
                                <div className={`p-4 rounded-xl ${product.status === 'FLAGGED' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                                    {product.status === 'SHIPPED' ? <Truck /> : <Package />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{product.name}</h3>
                                    <div className="flex gap-3 mt-1">
                                        <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-widest">{product.category_name}</span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${product.status === 'AVAILABLE' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{product.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-12">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Deadline</p>
                                    <p className={`font-mono text-sm font-bold ${product.is_overdue ? 'text-red-500' : 'text-slate-700'}`}>{product.manager_deadline || '---'}</p>
                                </div>
                                <div className="text-right min-w-[80px]">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Stock</p>
                                    <p className="font-mono text-lg font-black text-slate-900">{product.total_stock}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setSelectedProduct(product); setIsFormOpen(true); }} className="p-2.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition"><Edit size={18}/></button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <ProductFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                existingProduct={selectedProduct}
                onSave={handleSaveProduct}
                isManager={user?.is_management}
            />
        </div>
    );
};

export default ProductList;