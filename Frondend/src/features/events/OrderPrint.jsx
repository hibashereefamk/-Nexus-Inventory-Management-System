import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PrintableInvoice } from './PrintableInvoice';// Import the card layout above
import { Printer, ArrowDownToLine } from 'lucide-react'; // Elegant modern iconography

export default function OrderReview({ order }) {
  const componentRef = useRef(null);

  // Hook config that targets our target node component reference automatically
  const handlePrintAction = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Invoice-${order.order_number}`,
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-800 font-sans">
      
      {/* Top Controls Action Toolbar */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-sm font-medium text-slate-600">
          Document Management Actions
        </div>
        
        {/* Dual Utility Print Button */}
        <button
          onClick={handlePrintAction}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-sm shadow transition active:scale-95"
        >
          <Printer size={16} />
          <span>Print or Save to PDF</span>
        </button>
      </div>

      {/* Main Visible Interactive View Dashboard */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Your current column views (Customer details, ledger card modules go here) */}
      </div>

      {/* HIDDEN PRINT TARGET ENGINE OVERLAY CONTAINER */}
      <div className="hidden">
        <div className="block">
          <PrintableInvoice ref={componentRef} order={order} />
        </div>
      </div>
      
    </div>
  );
}