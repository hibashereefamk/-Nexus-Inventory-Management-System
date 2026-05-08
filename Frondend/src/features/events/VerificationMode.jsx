import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  FiCoffee, FiTruck, FiTv, FiEdit3, 
  FiCheckCircle, FiXCircle, FiCalendar, FiShield, FiInfo 
} from 'react-icons/fi';

const API = "http://127.0.0.1:8000";

// Helper to get Auth Token (CRITICAL FIX)
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const ProductVerification = ({ product,assignmentId , onComplete, onBack }) => {
  const [previousReport, setPreviousReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('food');

  const isPastDate = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateString) < today;
  };

  const [formData, setFormData] = useState({
    is_passed: true,
    comments: '',
    batch_lot: product.batch_number || '', 
    temp_chain_ok: false, 
    packaging_sealed: false,
    fssai_verified: false,
    structural_ok: false,
    finish_no_scratches: false,
    parts_complete: false,
    unique_serial_number: '',
    boot_test_passed: false, 
    ports_physical_ok: false,
    firmware_version: '',
    quantity_reconciled: false,
    ink_lead_test_passed: false,
    paper_not_damaged: false,
    
  });

  // Auto-Select Type based on Department
  useEffect(() => {
    if (product.department_name) {
      const dept = product.department_name.toLowerCase();
      if (dept.includes('food')) setActiveType('food');
      else if (dept.includes('elect')) setActiveType('electronics');
      else if (dept.includes('furn')) setActiveType('furniture');
      else if (dept.includes('stat')) setActiveType('stationery');
    }
  }, [product.department_name]);

  // Sync is_passed with UI checkboxes and Date validation
  useEffect(() => {
    let passed = true;
    if (activeType === 'food') {
      passed = formData.temp_chain_ok && formData.packaging_sealed && formData.fssai_verified && !isPastDate(product.expiry_date);
    } else if (activeType === 'electronics') {
      passed = formData.boot_test_passed && formData.ports_physical_ok && !isPastDate(product.warranty_expiry);
    } else if (activeType === 'furniture') {
      passed = formData.structural_ok && formData.finish_no_scratches && formData.parts_complete;
    } else if (activeType === 'stationery') {
      passed = formData.quantity_reconciled && formData.ink_lead_test_passed && formData.paper_not_damaged;
    }
    setFormData(prev => ({ ...prev, is_passed: passed }));
  }, [formData.temp_chain_ok, formData.packaging_sealed, formData.fssai_verified, 
      formData.structural_ok, formData.finish_no_scratches, formData.parts_complete,
      formData.boot_test_passed, formData.ports_physical_ok,
      formData.quantity_reconciled, formData.ink_lead_test_passed, formData.paper_not_damaged,
      activeType, product.expiry_date, product.warranty_expiry]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

 const handleSubmit = async () => {
   console.log("Submit process started..."); // <--- Check if this appears in console
  
  // If product is undefined, this will stop here
  if (!product) {
    console.error("Product prop is missing!");
    return;
  }

  // Check if loading is stuck
  if (loading) {
    console.log("Currently loading, skipping click.");
    return;
  }
    setLoading(true);
    
    try {
      // Logic Check
      const pId = product.product_details?.id || product.id || product.product;
      const taskId = assignmentId ;
      
      console.log("IDs found:", { pId, taskId });

      if (!taskId) {
        throw new Error("Task ID is missing. Cannot submit.");
      }

      const config = getAuthHeaders();

      // 1. Submit Detailed Verification
      console.log("Sending POST to verify-products...");
      await axios.post(`${API}/api/inventory/verify-products/`, {
        product: pId,
        assignment_id: taskId,
        active_type: activeType,
        ...formData
      }, config);

      // 2. Update Order Assignment
      console.log("Sending PATCH to staff tasks...");
      await axios.patch(`${API}/api/orders/staff/tasks/${taskId}/inspect/`, {
        is_passed: formData.is_passed,
        comments: formData.comments || (isPastDate(product.expiry_date) ? "Product Expired" : ""),
        status: formData.is_passed ? 'PACKED' : 'PICKING'
      }, config);

      toast.success("Success!");
      if (onComplete) onComplete();

    } catch (err) {
      console.error("FULL ERROR:", err);
      toast.error(err.response?.data?.detail || "Execution Error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-700">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Product Verification</h1>
            <p className="text-sm text-slate-500 font-mono">Order: {product.order_number}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-mono">SKU: {product.sku || product.product_details?.sku}</p>
            <p className="text-xs text-slate-500">Available: {product.total_stock || product.product_details?.total_stock}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Expiry Warning */}
          {activeType === 'food' && isPastDate(product.expiry_date) && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 animate-pulse">
              <FiCalendar className="text-2xl" />
              <div>
                <p className="font-bold">SYSTEM ALERT: EXPIRED</p>
                <p className="text-sm">This item expired on {product.expiry_date}. You must reject this verification.</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <section>
            <h2 className="text-lg font-bold mb-4">Metadata Verification</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Product</label>
                <input type="text" readOnly value={product.name || product.product_details?.name} className="w-full p-2.5 bg-slate-50 border rounded-md text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Department</label>
                <input type="text" readOnly value={product.department_name} className="w-full p-2.5 bg-slate-50 border rounded-md text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Batch / Lot No. *</label>
                <input 
                  name="batch_lot" 
                  value={formData.batch_lot} 
                  onChange={handleInputChange} 
                  className={`w-full p-2.5 border rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500`} 
                  placeholder="Enter Batch Number" 
                />
              </div>
            </div>
          </section>

          {/* Dynamic Checklist */}
          <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h2 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
              <FiInfo /> QC Checklist ({activeType.toUpperCase()})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeType === 'food' && (
                <>
                  <CheckboxCard label="Temp Chain OK" name="temp_chain_ok" checked={formData.temp_chain_ok} onChange={handleInputChange} />
                  <CheckboxCard label="Packaging Sealed" name="packaging_sealed" checked={formData.packaging_sealed} onChange={handleInputChange} />
                  <CheckboxCard label="FSSAI Verified" name="fssai_verified" checked={formData.fssai_verified} onChange={handleInputChange} />
                </>
              )}
              {activeType === 'electronics' && (
                <>
                  <CheckboxCard label="Boot Test Passed" name="boot_test_passed" checked={formData.boot_test_passed} onChange={handleInputChange} />
                  <CheckboxCard label="Ports Physical OK" name="ports_physical_ok" checked={formData.ports_physical_ok} onChange={handleInputChange} />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Firmware Version</label>
                    <input name="firmware_version" value={formData.firmware_version} onChange={handleInputChange} className="w-full p-2 border rounded-md text-xs" />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="pt-6 border-t">
            <div className={`p-4 rounded-lg flex items-center justify-between ${formData.is_passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                {formData.is_passed ? <FiCheckCircle className="text-emerald-600 text-2xl"/> : <FiXCircle className="text-red-600 text-2xl"/>}
                <div>
                  <p className={`font-bold ${formData.is_passed ? 'text-emerald-800' : 'text-red-800'}`}>
                    {formData.is_passed ? "Ready for Packaging" : "Verification Rejected"}
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Decision: {formData.is_passed ? "PASS" : "FAIL"}</p>
                </div>
              </div>
            </div>

            {!formData.is_passed && (
              <div className="mt-4">
                <label className="text-sm font-bold text-red-600 italic">Please describe the issue for the Manager *</label>
                <textarea 
                  name="comments" 
                  value={formData.comments} 
                  onChange={handleInputChange} 
                  className="w-full mt-1 p-3 border border-red-200 rounded-md text-sm h-24 outline-none focus:ring-2 focus:ring-red-400" 
                  placeholder={isPastDate(product.expiry_date) ? "PRODUCT EXPIRED" : "Ex: Torn packaging, temp high..."} 
                />
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button onClick={onBack} className="px-6 py-2 border rounded-md font-bold text-sm hover:bg-slate-50 transition-colors">Back</button>
            <button
              disabled={loading}
              onClick={()=>handleSubmit()}
              className={`px-8 py-2 text-white rounded-md font-bold text-sm shadow-lg transition-all transform active:scale-95 ${
                loading ? 'bg-slate-400' : formData.is_passed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? "Syncing ERP..." : "Complete Task"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckboxCard = ({ label, name, checked, onChange }) => (
  <label className={`flex items-center justify-between gap-3 p-4 border rounded-xl cursor-pointer transition-all ${checked ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-white border-slate-200 shadow-none'}`}>
    <span className={`text-xs font-bold ${checked ? 'text-emerald-700' : 'text-slate-600'}`}>{label}</span>
    <input type="checkbox" name={name} checked={checked} onChange={onChange} className="w-5 h-5 accent-emerald-600" />
  </label>
);

export default ProductVerification;