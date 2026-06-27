import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast, Toaster } from 'react-hot-toast'


const API = "http://localhost:8000";

const OrderReviewPage = () => {
  const { taskId } = useParams();

  const [order, setOrder] = useState(null);

  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipmentNotes, setShipmentNotes] = useState("");

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
  });

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(
        `${API}/api/orders/staff/order-review/${taskId}/`,
        getAuthHeaders()
      );

      setOrder(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load order");
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await axios.patch(
        `${API}/api/orders/staff/update-task/${taskId}/`,
        {
          status,
          courier,
          tracking_number: trackingNumber,
          shipment_notes: shipmentNotes,
        },
        getAuthHeaders()
      );

      toast.success("Shipment dispatched");
      fetchOrder();
    } catch (err) {
      toast.error(
        err?.response?.data?.detail ||
          "Failed to update task"
      );
    }
  };

  if (!order) {
    return (
      <div className="p-10 text-center">
        Loading Order...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h1 className="text-2xl font-bold">
          Order Review
        </h1>

        <p className="mt-2">
          Order Number :
          {order.order_number}
        </p>

        <p>Status : {order.status}</p>

        <p>Priority : {order.priority}</p>
      </div>

      {/* Customer */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-4">
          Customer Details
        </h2>

   <p>
  Name:
  {order.order_details?.customer_details?.name}
</p>

<p>
  Email:
  {order.order_details?.customer_details?.email}
</p>

<p>
  Phone:
  {order.order_details?.customer_details?.phone}
</p>
      </div>

      {/* Address */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-4">
          Shipping Address
        </h2>

        <p>{order.shipping_address}</p>
      </div>

      {/* Products */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-4">
          Products
        </h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Product</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Price</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {order.order_items?.map((item) => (
              <tr key={item.id}>
                <td className="p-2">
                  {item.product_details?.name}
                </td>

                <td className="p-2">
                  {item.quantity}
                </td>

                <td className="p-2">
                  ₹
                  {item.tax_calculation?.unit_price}
                </td>

                <td className="p-2">
                  ₹
                  {item.tax_calculation?.subtotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verification */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-4">
          Verification Report
        </h2>

        <p>
          Verification Status :
          {order.verification_status}
        </p>

        <p>
          Approval Status :
          {order.approval_status}
        </p>

        <p>
          Assigned Staff :
          {order.staff_username}
        </p>
      </div>

      {/* Documents */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-4">
          Documents
        </h2>

        <div className="flex gap-3 flex-wrap">

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Download Invoice
          </button>

          <button className="bg-purple-600 text-white px-4 py-2 rounded">
            Download Packing Slip
          </button>

          <button className="bg-orange-600 text-white px-4 py-2 rounded">
            Print Shipping Label
          </button>

        </div>
      </div>

      {/* Shipment */}
      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="font-bold mb-4">
          Shipment Details
        </h2>

        <select
          value={courier}
          onChange={(e) =>
            setCourier(e.target.value)
          }
          className="border p-2 w-full mb-3"
        >
          <option value="">
            Select Courier
          </option>

          <option>DHL</option>
          <option>FedEx</option>
          <option>BlueDart</option>
          <option>DTDC</option>
        </select>

        <input
          type="text"
          placeholder="Tracking Number"
          value={trackingNumber}
          onChange={(e) =>
            setTrackingNumber(e.target.value)
          }
          className="border p-2 w-full mb-3"
        />

        <textarea
          rows={4}
          placeholder="Shipment Notes"
          value={shipmentNotes}
          onChange={(e) =>
            setShipmentNotes(e.target.value)
          }
          className="border p-2 w-full"
        />
      </div>

      {/* Dispatch */}
      <div>
        <button
          onClick={() =>
            updateStatus(order.id, "SHIPPED")
          }
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold"
        >
          Confirm Dispatch
        </button>
      </div>

    </div>
  );
};

export default OrderReviewPage;