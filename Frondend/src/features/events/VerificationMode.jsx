import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiCoffee, FiTruck, FiTv, FiEdit3, 
  FiCheckCircle, FiXCircle, FiCalendar, FiUser, FiInfo 
} from 'react-icons/fi';

const API = "http://127.0.0.1:8000";

const ProductVerification = ({ product, onComplete, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('food');

  const [formData, setFormData] = useState({
    is_passed: true,
    comments: '',
    batch_lot: '',
    // Food
    temp_chain_ok: true,
    packaging_sealed: true,
    fssai_verified: true,
    // Furniture
    structural_ok: true,
    finish_no_scratches: true,
    parts_complete: true,
    // Electronics
    unique_serial_number: '',
    boot_test_passed: true, // Changed default to true for logical consistency
    ports_physical_ok: true,
    firmware_version: '',
    // Stationery
    quantity_reconciled: true,
    ink_lead_test_passed: true,
    paper_not_damaged: true,
  });

  // Auto-calculate is_passed whenever checkboxes change
  useEffect(() => {
    let passed = true;
    if (activeType === 'food') {
      passed = formData.temp_chain_ok && formData.packaging_sealed && formData.fssai_verified;
    } else if (activeType === 'furniture') {
      passed = formData.structural_ok && formData.finish_no_scratches && formData.parts_complete;
    } else if (activeType === 'electronics') {
      passed = formData.boot_test_passed && formData.ports_physical_ok;
    } else if (activeType === 'stationery') {
      passed = formData.quantity_reconciled && formData.ink_lead_test_passed && formData.paper_not_damaged;
    }
    setFormData(prev => ({ ...prev, is_passed: passed }));
  }, [formData.temp_chain_ok, formData.packaging_sealed, formData.fssai_verified, 
      formData.structural_ok, formData.finish_no_scratches, formData.parts_complete,
      formData.boot_test_passed, formData.ports_physical_ok,
      formData.quantity_reconciled, formData.ink_lead_test_passed, formData.paper_not_damaged,
      activeType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

 const handleSubmit = async (isDraft = false) => {
  if (!formData.batch_lot.trim()) {
    toast.error("Batch/Lot Number is required");
    return;
  }

  if (!formData.is_passed && !formData.comments.trim()) {
    toast.error("Please describe failure reason");
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("access_token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const pId = product.product_details?.id || product.id || product.product;
    const taskId = product.task_id || product.assignment_id;

    await axios.post(`${API}/api/inventory/verify-products/`, {
      product: pId,
      is_passed: formData.is_passed,
      comments: formData.comments,
      batch_lot: formData.batch_lot,
      active_type: activeType,
    }, config);

    // ✅ Step 2: Trigger assignment workflow
    if (!isDraft && taskId) {
      const response = await axios.patch(
        `${API}/api/orders/staff/tasks/${taskId}/inspect/`,
        {
         inspections: {
  [pId]: { is_inspected: formData.is_passed }
},
          comments: formData.comments
        },
        config
      );
      print("INSPECTIONS:", inspections)
print("PRODUCT ID:", p_id)
print("RESULT:", inspections.get(p_id))
      const { verification_status, approval_status, status } = response.data;

if (verification_status === 'PASSED') {
  toast.success(`✔ Verified → ${status} (Approval: ${approval_status})`);
} else {
  toast.error("❌ Verification failed → Issue sent to manager");
}
    }

    if (onComplete) onComplete();

  } catch (err) {
    console.error(err);
    toast.error("Something went wrong. Check stock or connection.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-700">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 bg-white">
          <h1 className="text-2xl font-bold text-slate-900">Product Verification</h1>
        </div>

        <div className="p-8 space-y-8">
          {/* Section: Basic Information */}
          <section>
            <h2 className="text-lg font-bold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Product</label>
                <input type="text" readOnly value={product.product_name} className="w-full p-2.5 bg-slate-50 border rounded-md text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Category</label>
                <input type="text" readOnly value={product.department_name} className="w-full p-2.5 bg-slate-50 border rounded-md text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Batch / Lot No. <span className="text-red-500">*</span></label>
                <input name="batch_lot" value={formData.batch_lot} onChange={handleInputChange} placeholder="Ex: BATCH-2026" className="w-full p-2.5 border rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </section>

          {/* Section: Type Selection */}
          <section>
            <h2 className="text-lg font-bold mb-4">Select Verification Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TypeCard active={activeType === 'food'} icon={<FiCoffee />} title="Food" onClick={() => setActiveType('food')} />
              <TypeCard active={activeType === 'furniture'} icon={<FiTruck />} title="Furniture" onClick={() => setActiveType('furniture')} />
              <TypeCard active={activeType === 'electronics'} icon={<FiTv />} title="Electronics" onClick={() => setActiveType('electronics')} />
              <TypeCard active={activeType === 'stationery'} icon={<FiEdit3 />} title="Stationery" onClick={() => setActiveType('stationery')} />
            </div>
          </section>

          {/* Section: Dynamic Checklist */}
          <section className="bg-blue-50/30 p-6 rounded-lg border border-blue-100">
            <h2 className="text-blue-700 font-bold mb-4 flex items-center gap-2">
              <FiInfo /> Checklist ({activeType.toUpperCase()})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeType === 'food' && (
                <>
                  <CheckboxCard label="Temp Chain OK" name="temp_chain_ok" checked={formData.temp_chain_ok} onChange={handleInputChange} />
                  <CheckboxCard label="Packaging Sealed" name="packaging_sealed" checked={formData.packaging_sealed} onChange={handleInputChange} />
                  <CheckboxCard label="FSSAI Verified" name="fssai_verified" checked={formData.fssai_verified} onChange={handleInputChange} />
                </>
              )}
              {activeType === 'furniture' && (
                <>
                  <CheckboxCard label="Structural OK" name="structural_ok" checked={formData.structural_ok} onChange={handleInputChange} />
                  <CheckboxCard label="Finish OK" name="finish_no_scratches" checked={formData.finish_no_scratches} onChange={handleInputChange} />
                  <CheckboxCard label="Parts Complete" name="parts_complete" checked={formData.parts_complete} onChange={handleInputChange} />
                </>
              )}
              {activeType === 'electronics' && (
                <>
                  <CheckboxCard label="Boot Test" name="boot_test_passed" checked={formData.boot_test_passed} onChange={handleInputChange} />
                  <CheckboxCard label="Ports Physical" name="ports_physical_ok" checked={formData.ports_physical_ok} onChange={handleInputChange} />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Firmware</label>
                    <input name="firmware_version" value={formData.firmware_version} onChange={handleInputChange} className="w-full p-2 border rounded-md text-xs" placeholder="v1.0.2" />
                  </div>
                </>
              )}
              {activeType === 'stationery' && (
                <>
                  <CheckboxCard label="Qty Reconciled" name="quantity_reconciled" checked={formData.quantity_reconciled} onChange={handleInputChange} />
                  <CheckboxCard label="Ink/Lead Test" name="ink_lead_test_passed" checked={formData.ink_lead_test_passed} onChange={handleInputChange} />
                  <CheckboxCard label="Paper Unharmed" name="paper_not_damaged" checked={formData.paper_not_damaged} onChange={handleInputChange} />
                </>
              )}
            </div>
          </section>

          {/* Section: Status Display */}
          <section className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">System Calculation</h2>
                <p className="text-sm text-slate-500">Auto-detected based on checklist results</p>
              </div>
              <div className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 ${formData.is_passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {formData.is_passed ? ( <><FiCheckCircle /> VERIFIED (Awaiting Approval)</>) : (<><FiXCircle /> FAILED (Issue Reported)</>)}
                <p className="text-xs mt-1 text-slate-500">
  {formData.is_passed 
    ? "Manager will review and approve for shipping"
    : "Issue report sent to manager for decision"}
</p>
              </div>
            </div>
            
            {!formData.is_passed && (
               <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                 <label className="text-sm font-bold text-red-600">Issue Description (Required)</label>
                 <textarea name="comments" value={formData.comments} onChange={handleInputChange} className="w-full mt-1 p-3 border border-red-200 rounded-md text-sm h-20 outline-none focus:ring-1 focus:ring-red-500" placeholder="Describe the damage or discrepancy..." />
               </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button onClick={onBack} className="px-6 py-2 border rounded-md font-bold text-sm hover:bg-slate-50">Cancel</button>
            <button
  disabled={loading}
  onClick={() => handleSubmit(false)}
  className={`px-8 py-2 text-white rounded-md font-bold text-sm ${
    loading ? 'opacity-50 cursor-not-allowed' :
    formData.is_passed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
  }`}
>
  {loading ? "Processing..." : "Complete Verification"}
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... Sub-components (TypeCard, CheckboxCard) remain the same but cleaner
const TypeCard = ({ active, icon, title, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-4 p-4 border rounded-xl transition-all ${active ? 'border-blue-600 ring-2 ring-blue-100 bg-white' : 'border-slate-200 bg-slate-50'}`}>
    <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${active ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>{icon}</div>
    <div className={`text-sm font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{title}</div>
  </button>
);

const CheckboxCard = ({ label, name, checked, onChange }) => (
  <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${checked ? 'bg-white border-blue-200' : 'bg-red-50 border-red-100'}`}>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-4 h-4 accent-blue-600" />
    <span className={`text-xs font-bold ${checked ? 'text-slate-700' : 'text-red-600'}`}>{label}</span>
  </label>
);

export default ProductVerification;