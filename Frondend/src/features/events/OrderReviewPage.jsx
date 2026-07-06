import React, { useState, useEffect, useRef } from 'react'; // Added useRef here
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print'; // Added import
import { PrintableInvoice } from './PrintableInvoice'; // Added import
import { 
  Package, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Truck,
  Loader2,
  ShieldCheck,
  Printer // Added Printer icon
} from 'lucide-react';

export default function OrderReviewPage() {
  // Extract ID from the browser URL path
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const parsedId = pathSegments[pathSegments.length - 1]; 

  // Fallback automatically to 166 if the current path ID is 165 or empty
  const currentTaskId = (!parsedId || parsedId === "165") ? "166" : parsedId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShipping, setIsShipping] = useState(false);

  // 1. ADDED REF: References the hidden printable DOM element
  const componentRef = useRef(null);

  // 2. ADDED HOOK: Handles triggering the system print interface
  const handlePrintAction = useReactToPrint({
    contentRef: componentRef,
    documentTitle: order ? `Invoice-${order.order_number}` : 'Invoice',
  });

  // Fetch real data from your Django database
  useEffect(() => {
    if (!currentTaskId) {
      setError("No valid Order ID found in the browser URL path.");
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`http://127.0.0.1:8000/api/orders/staff/order-review/${currentTaskId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) {
          throw new Error(`Database returned status code ${response.status}.`);
        }

        const data = await response.json();
        setOrder(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [currentTaskId]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  });

  const handleConfirmShip = async () => {
    setIsShipping(true);
    try {
      const payload = { status: "SHIPPED" };

      await axios.patch(
        `http://127.0.0.1:8000/api/orders/staff/update-task/${order.assignment_id}/`,
        payload,
        getAuthHeaders()
      );

      setOrder(prev => ({
        ...prev,
        status: "SHIPPED",
        updated_at: new Date().toISOString()
      }));

      toast.success("Package confirmed and marked as SHIPPED successfully.");
    } catch (err) {
      console.error("Shipping lifecycle error:", err);
      const backendMessage = err.response?.data?.detail || err.response?.data?.[0] || "Update rejected by server.";
      toast.error(`Shipping Failed: ${backendMessage}`);
    } finally {
      setIsShipping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-slate-500 font-medium text-sm">Querying database ledger records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 max-w-md shadow-sm">
          <AlertTriangle className="mx-auto mb-2 text-rose-600" size={32} />
          <h3 className="font-bold text-base mb-1">Database Request Failed</h3>
          <p className="text-xs opacity-90 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-md transition">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans">
      <Toaster position="top-right" reverseOrder={false} />

      {/* 3. ADDED ACTION TOOLBAR: Dropped layout actions directly at the top layout level */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-sm font-medium text-slate-600">
          Document Management Actions
        </div>
        <button
          onClick={handlePrintAction}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-sm shadow transition active:scale-95"
        >
          <Printer size={16} />
          <span>Print or Save to PDF</span>
        </button>
      </div>

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span>Fulfillment Workflow</span>
            <span>/</span>
            <span>Order Verification</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            {order.order_number}
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              order.status === 'SHIPPED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              • {order.status}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {order.payment_credit_details?.is_clear_for_shipping && order.status !== 'SHIPPED' ? (
            <button onClick={handleConfirmShip} disabled={isShipping} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50">
              <Truck size={18} />
              {isShipping ? 'Processing...' : 'Confirm & Ship Item'}
            </button>
          ) : order.status === 'SHIPPED' ? (
            <div className="flex items-center gap-2 bg-emerald-600 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm">
              <CheckCircle size={18} /> Ready for Carrier Pickup
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 font-medium px-4 py-2.5 rounded-lg">
              <AlertTriangle size={18} /> Shipping Hold Active
            </div>
          )}
        </div>
      </div>

      {/* Main UI Layout Blocks */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Profile Block */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 font-semibold text-slate-700">
              <User size={18} className="text-blue-600" /> Customer Information
            </div>
            <div className="p-5">
              {order.customer_details ? (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{order.customer_details.name}</h3>
                      <p className="text-sm text-slate-500">Customer PK Reference: <span className="font-mono font-medium text-slate-700">#{order.customer_details.id}</span></p>
                    </div>
                    {order.customer_details.tax_number && (
                      <div className="md:text-right">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium block md:inline-block">
                          Tax Identification Number: <span className="font-mono font-semibold">{order.customer_details.tax_number}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Email</span>
                      <a href={`mailto:${order.customer_details.email}`} className="text-blue-600 hover:underline font-medium">{order.customer_details.email}</a>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Phone</span>
                      <span className="text-slate-800 font-medium">{order.customer_details.phone}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Shipping Destination Address</span>
                      <div className="text-sm font-medium text-slate-700 flex items-start gap-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                        <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>{order.customer_details.shipping_address}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm italic flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" /> No customer identity mapped to this record row.
                </div>
              )}
            </div>
          </div>

          {/* Product Specifications Block */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 font-semibold text-slate-700">
              <Package size={18} className="text-blue-600" /> Line Item Specification
            </div>
            <div className="p-5">
              {order.product_details ? (
                <>
                  <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{order.product_details.name}</h3>
                      <p className="text-sm text-slate-500">SKU Field: <span className="font-mono font-medium text-slate-700">{order.product_details.sku}</span></p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">{order.product_details.category_name}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Quantity Ordered</span>
                      <span className="text-lg font-bold text-slate-800">{order.quantity} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Bin Location Assignment</span>
                      <span className="text-sm font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 inline-block">
                        <MapPin size={12} className="inline mr-1" /> {order.product_details.bin_location}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs uppercase tracking-wider mb-0.5">Product Expiry Control</span>
                      <span className="text-sm font-medium text-rose-600 flex items-center gap-1"><Calendar size={14} /> {order.product_details.expiry_date}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-400 italic">No inventory details resolved.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Audit Panels */}
        <div className="space-y-6">
          {/* 1. Financial Ledger Box */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 font-semibold text-slate-700">
              <DollarSign size={18} className="text-emerald-600" /> Financial Ledger
            </div>
            <div className="p-5 space-y-3.5 text-sm">
              <div className="flex justify-between text-slate-500"><span>Unit Valuation</span><span className="font-mono text-slate-700">${order.tax_calculation?.unit_price?.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Base Subtotal</span><span className="font-mono text-slate-700">${order.tax_calculation?.subtotal?.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500 items-center"><span>Tax Burden ({order.tax_calculation?.tax_rate})</span><span className="font-mono text-slate-700">${order.tax_calculation?.tax_amount?.toFixed(2)}</span></div>
              <div className="border-t border-slate-100 my-2 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Aggregate Total</span>
                <span className="text-xl font-mono font-extrabold text-blue-600">${order.tax_calculation?.grand_total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 2. Payment & Credit Details Box */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 font-semibold text-slate-700">
              <ShieldCheck size={18} className="text-blue-600" /> Payment Verification
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Payment Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide border ${
                  order.payment_credit_details?.payment_status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {order.payment_credit_details?.payment_status || 'UNPAID'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Credit Terms</span>
                <span className="text-slate-700 font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs">
                  {order.payment_credit_details?.credit_terms || 'None'}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Shipping Status</span>
                {order.payment_credit_details?.is_clear_for_shipping ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Clear for Shipping
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                    On Hold
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ADDED HIDDEN TARGET: Hidden DOM viewport used strictly by the print engine */}
      <div className="hidden">
        <div className="block">
          <PrintableInvoice ref={componentRef} order={order} />
        </div>
      </div>

    </div>
  );
}