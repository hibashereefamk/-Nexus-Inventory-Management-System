import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiInfo,
  FiUser,
  FiCalendar
} from 'react-icons/fi';

const API = 'http://127.0.0.1:8000';

const ManagerOrderReview = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`
    }
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Task Details
      const taskRes = await axios.get(`${API}/api/orders/manager/assignments/`, getAuthHeaders());
      const foundTask = taskRes.data.find((t) => t.id === parseInt(taskId));

      if (!foundTask) {
        toast.error("Task not found");
        return;
      }
      setTask(foundTask);

      // 2. Fetch Latest Verification for each product
      const verificationPromises = foundTask.products.map(async (product) => {
        try {
          const historyRes = await axios.get(
            `${API}/api/inventory/verify-products/history/${product.id}/`,
            getAuthHeaders()
          );

          // historyRes.data is already sorted by -timestamp from your backend sorted() function
          const latest = historyRes.data.length > 0 ? historyRes.data[0] : null;

          return { product, verification: latest };
        } catch (err) {
          return { product, verification: null };
        }
      });

      const results = await Promise.all(verificationPromises);
      setVerifications(results);
    } catch (err) {
      toast.error("Failed to load audit data");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDecision = async (decision) => {
    try {
      await axios.patch(`${API}/api/orders/manager/approve-order/${taskId}/`, {
        decision,
        remarks
      }, getAuthHeaders());

      toast.success(`Order ${decision}`);
      navigate('/manager/staff-tasks');
    } catch (err) {
      toast.error("Decision submission failed");
    }
  };

  // Check if every product has a "passed" verification
  const allPassed = verifications.length > 0 && verifications.every(
    item => item.verification?.is_passed === true
  );

  if (loading) return <div className="p-20 text-center font-bold">Loading Audit...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Order Audit Review</h1>
            <p className="text-slate-500 font-mono text-sm">{task?.order_number}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase">Fulfillment Status</span>
            <p className="font-bold text-indigo-600">{task?.status}</p>
          </div>
        </div>

        {/* Product Cards */}
        {verifications.map((item, index) => {
          const v = item.verification;
          const p = item.product;

          // Define which keys are actual Boolean checks vs metadata
          const excludedKeys = ['id', 'timestamp', 'is_passed', 'comments', 'product', 'verified_by', 'verification_type', 'batch_lot'];
          const checkFields = v ? Object.keys(v).filter(key => !excludedKeys.includes(key)) : [];

          return (
            <div key={index} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                <h3 className="font-bold text-slate-800">{p.name} <span className="text-slate-400 font-normal text-xs ml-2">ID: {p.id}</span></h3>
                <div className={`px-3 py-1 rounded-full text-xs font-black ${v?.is_passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {v ? (v.is_passed ? 'PASSED' : 'FAILED') : 'PENDING'}
                </div>
              </div>

              <div className="p-6">
                {!v ? (
                  <p className="text-slate-400 italic text-center py-4">No verification history found for this product.</p>
                ) : (
                  <div className="space-y-6">
                    {/* Grid of Boolean Checks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {checkFields.map(key => (
                        <div key={key} className={`p-3 rounded-xl border flex items-center justify-between ${v[key] ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                          <span className="text-[10px] font-black uppercase text-slate-600">{key.replace(/_/g, ' ')}</span>
                          {v[key] ? <FiCheckCircle className="text-emerald-500" /> : <FiXCircle className="text-red-500" />}
                        </div>
                      ))}
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-dashed">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Batch/Lot</p>
                        <p className="text-sm font-semibold">{v.batch_lot || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Verification Type</p>
                        <p className="text-sm font-semibold">{v.verification_type}</p>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                       <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1"><FiInfo/> Auditor Remarks:</p>
                       <p className="text-sm text-slate-700 italic">"{v.comments || 'No comments provided'}"</p>
                    </div>

                    {/* Timestamp & User */}
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase pt-4 border-t">
                      <span className="flex items-center gap-1"><FiUser/> Auditor ID: {v.verified_by}</span>
                      <span className="flex items-center gap-1"><FiCalendar/> {new Date(v.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Action Panel */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-xl">
          <textarea
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-sm mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Final manager audit remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
          <div className="flex gap-4">
            <button
              onClick={() => handleDecision('APPROVED')}
              disabled={!allPassed}
              className={`flex-1 py-4 rounded-xl font-black transition-all ${allPassed ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
            >
              <FiTruck className="inline mr-2 text-lg" /> APPROVE & SHIP
            </button>
            <button
              onClick={() => handleDecision('REJECTED')}
              className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black transition-all shadow-lg"
            >
              REJECT ORDER
            </button>
          </div>
          {!allPassed && (
            <p className="text-red-400 text-[10px] mt-4 font-bold text-center uppercase tracking-widest">
              Critical: Some items failed QC. Approval disabled.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerOrderReview;