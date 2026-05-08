import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiAlertTriangle
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

    // FETCH TASK
    const taskRes = await axios.get(
      `${API}/api/orders/manager/assignments/`,
      getAuthHeaders()
    );

    const foundTask = taskRes.data.find(
      (t) => t.id === parseInt(taskId)
    );

    setTask(foundTask);

    if (!foundTask) {
      toast.error("Task not found");
      return;
    }

    // FETCH ASSIGNMENT VERIFICATION

    try {

      const verificationRes = await axios.get(
        `${API}/api/inventory/assignment-verification/${taskId}/`,
        getAuthHeaders()
      );

      setVerifications([
        {
          product: foundTask.products[0],
          verification: verificationRes.data
        }
      ]);

    } catch (err) {

      console.error("Verification fetch failed:", err);

      setVerifications([
        {
          product: foundTask.products[0],
          verification: null
        }
      ]);
    }

  } catch (err) {

    console.error(err);
    toast.error("Failed to load verification audit.");

  } finally {

    setLoading(false);

  }

}, [taskId]);

useEffect(() => {
  loadData();
}, [loadData]);

  const handleDecision = async (decision) => {

    try {

      await axios.patch(
        `${API}/api/orders/manager/approve-order/${taskId}/`,
        {
          decision,
          remarks
        },
        getAuthHeaders()
      );

      toast.success(`Order ${decision}`);
      navigate('/manager/staff-tasks');

    } catch (err) {

      toast.error("Failed to submit decision.");
    }
  };

  const allPassed = verifications.every(
    item => item.verification?.is_passed
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Verification Audit...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}

        <div className="bg-white rounded-2xl p-6 border shadow-sm">

          <h1 className="text-2xl font-black">
            Order Audit Review
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            {task?.order_number}
          </p>

        </div>

        {/* PRODUCTS */}

        {verifications.map((item, index) => {

          const product = item.product;
          const verification = item.verification;

          return (

            <div
              key={index}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            >

              {/* PRODUCT HEADER */}

              <div className="p-5 border-b bg-slate-50 flex justify-between items-center">

                <div>

                  <h2 className="text-lg font-black">
                    {product.name}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Product ID: {product.id}
                  </p>

                </div>

                <div
                  className={`px-4 py-2 rounded-xl text-xs font-black
                  ${
                    verification?.is_passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {verification?.is_passed
                    ? 'PASSED'
                    : 'FAILED'}
                </div>

              </div>

              {/* NO VERIFICATION */}

              {!verification && (

                <div className="p-6 text-center text-slate-400">

                  No verification record found

                </div>

              )}

              {/* VERIFICATION */}

              {verification && (

                <div className="p-6 space-y-6">

                  {/* CHECKS */}

                  <div>

                    <h3 className="text-xs font-black uppercase text-slate-400 mb-3">
                      Verification Checks
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {Object.entries(
                        verification.verification_checks || {}
                      ).map(([key, value]) => (

                        <div
                          key={key}
                          className={`p-4 rounded-xl border flex items-center justify-between
                          ${
                            value
                              ? 'bg-emerald-50 border-emerald-100'
                              : 'bg-red-50 border-red-100'
                          }`}
                        >

                          <span className="text-xs font-bold uppercase">
                            {key.replace(/_/g, ' ')}
                          </span>

                          {value
                            ? <FiCheckCircle className="text-emerald-500" />
                            : <FiXCircle className="text-red-500" />
                          }

                        </div>

                      ))}

                    </div>

                  </div>

                  {/* SYSTEM CHECKS */}

                  <div>

                    <h3 className="text-xs font-black uppercase text-slate-400 mb-3">
                      ERP System Checks
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      {Object.entries(
                        verification.system_checks || {}
                      ).map(([key, value]) => (

                        <div
                          key={key}
                          className="p-4 rounded-xl border bg-slate-50"
                        >

                          <p className="text-xs font-black uppercase text-slate-500">
                            {key.replace(/_/g, ' ')}
                          </p>

                          <p className="mt-2 text-sm font-semibold">

                            {typeof value === 'boolean'
                              ? value
                                ? 'PASS'
                                : 'FAILED'
                              : String(value)}

                          </p>

                        </div>

                      ))}

                    </div>

                  </div>

                  {/* COMMENTS */}

                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl">

                    <p className="text-sm italic text-slate-700">
                      "{verification.comments || 'No comments'}"
                    </p>

                  </div>

                  {/* META */}

                  <div className="text-xs text-slate-500 space-y-1">

                    <p>
                      Verified By:
                      <span className="font-bold ml-1">
                        {verification.verified_by}
                      </span>
                    </p>

                    <p>
                      Verification Time:
                      <span className="font-bold ml-1">
                        {new Date(
                          verification.timestamp
                        ).toLocaleString()}
                      </span>
                    </p>

                  </div>

                </div>

              )}

            </div>

          );
        })}

        {/* MANAGER DECISION */}

        <div className="bg-slate-900 p-8 rounded-3xl text-white">

          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            Manager Review
          </h3>

          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder="Add remarks..."
            className="w-full rounded-2xl bg-slate-800 border border-slate-700 p-4 mb-6"
          />

          <div className="flex gap-4">

            <button
              onClick={() => handleDecision('APPROVED')}
              disabled={!allPassed}
              className={`flex-1 py-4 rounded-2xl font-black
              ${
                allPassed
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-slate-700 cursor-not-allowed'
              }`}
            >
              <FiTruck className="inline mr-2" />
              APPROVE FOR SHIPPING
            </button>

            <button
              onClick={() => handleDecision('REJECTED')}
              className="flex-1 py-4 rounded-2xl font-black bg-red-600 hover:bg-red-500"
            >
              REJECT ORDER
            </button>

          </div>

          {!allPassed && (

            <p className="text-red-400 text-xs mt-4 font-bold text-center">

              Some products failed verification.
              Order cannot be shipped.

            </p>

          )}

        </div>

      </div>

    </div>
  );
};

export default ManagerOrderReview;