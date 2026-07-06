import React from 'react';

// Using forwardRef allows the print utility to isolate this specific HTML element
export const PrintableInvoice = React.forwardRef(({ order }, ref) => {
  return (
    <div ref={ref} className="p-8 bg-white max-w-4xl mx-auto print:p-0">
      {/* Invoice Branding Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">NEXUS INVENTORY</h1>
          <p className="text-sm text-slate-500 mt-1">Official Order Invoice Statement</p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800">{order.order_number}</h2>
          <p className="text-xs text-slate-500">Status: {order.status}</p>
        </div>
      </div>

      {/* Grid Layout for Customer and Financial Summary */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To:</h3>
          <p className="font-bold text-slate-800">{order.customer_details?.name}</p>
          <p className="text-sm text-slate-600 mt-1">{order.customer_details?.shipping_address}</p>
          <p className="text-sm text-blue-600 font-medium">{order.customer_details?.email}</p>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Financial Overview:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">${order.tax_calculation?.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax Burden ({order.tax_calculation?.tax_rate}):</span>
              <span className="font-mono">${order.tax_calculation?.tax_amount?.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-bold text-slate-900">
              <span>Aggregate Total:</span>
              <span className="text-blue-600 font-mono">${order.tax_calculation?.grand_total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Item Breakdown */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <th className="px-5 py-3">Item Specification</th>
              <th className="px-5 py-3">Bin Allocation</th>
              <th className="px-5 py-3 text-right">Quantity Ordered</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            <tr>
              <td className="px-5 py-4">
                <span className="font-bold text-slate-900 block">{order.product_details?.name}</span>
                <span className="text-xs text-slate-400 font-mono">{order.product_details?.sku}</span>
              </td>
              <td className="px-5 py-4 font-mono text-xs text-slate-600">
                {order.product_details?.bin_location}
              </td>
              <td className="px-5 py-4 text-right font-bold text-slate-800">
                {order.quantity} Units
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Verification footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
        <p>Payment Mode Status Verification: <span className="font-bold text-slate-600">{order.payment_credit_details?.payment_status}</span></p>
        <p>Generated automatically via Nexus Inventory Workflows.</p>
      </div>
    </div>
  );
});