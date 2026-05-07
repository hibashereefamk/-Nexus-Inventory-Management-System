import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';

function OrderDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  });

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      // You may need to create a specific detail endpoint in Django for this
      const res = await axios.get(`${API}/api/orders/staff/tasks/${id}/`, getHeaders());
      setOrder(res.data);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    try {
      await axios.patch(`${API}/api/orders/manager/app-shipping/`, {
        id: order.id,
        decision: decision, // 'APPROVED' or 'REJECTED'
        remarks: "Verified by Manager"
      }, getHeaders());
      alert(`Order ${decision}`);
      navigate('/manager/tasks');
    } catch (err) {
      alert("Action failed");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Detailed Info...</div>;

  return (
    <div className="p-8 bg-white max-w-4xl mx-auto my-10 rounded-2xl shadow-lg border">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order: {order.order_number}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-2">
          <p className="text-gray-500 text-sm">Assigned Staff</p>
          <p className="font-semibold">{order.staff_username || 'N/A'}</p>
        </div>
        <div className="space-y-2">
          <p className="text-gray-500 text-sm">Department</p>
          <p className="font-semibold">{order.department_name}</p>
        </div>
      </div>

      {/* CASE 1: SUCCESSFUL PACKING - SHOW SHIPPING APPROVAL */}
      {order.status === 'PACKED' && (
        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <h3 className="text-green-800 font-bold mb-2">Request for Shipment</h3>
          <p className="text-sm text-green-700 mb-4">
            Staff has verified all items. Ready for final manager dispatch.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => handleDecision('APPROVED')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Approve & Send to Shipping
            </button>
            <button 
              onClick={() => handleDecision('REJECTED')}
              className="border border-red-600 text-red-600 px-6 py-2 rounded-lg hover:bg-red-50"
            >
              Reject Verification
            </button>
          </div>
        </div>
      )}

      {/* CASE 2: FAILED PACKING - SHOW DAMAGE REPORT */}
      {order.status === 'FAILED' && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h3 className="text-red-800 font-bold mb-2">Damage / Issue Report</h3>
          <div className="bg-white p-4 rounded border mb-4">
            <p className="text-sm font-bold text-gray-500">Staff Comments:</p>
            <p className="text-gray-800 italic">"{order.comments || "No comments provided"}"</p>
          </div>
          <button 
             onClick={() => alert("Escalated to Admin")}
             className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Escalate to Admin for Resolution
          </button>
        </div>
      )}
    </div>
  );
}
export default OrderDetailView;