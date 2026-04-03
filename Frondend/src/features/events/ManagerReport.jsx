import React, { useState } from 'react';
import axios from 'axios';
import { Send, AlertTriangle, MessageSquare, ArrowLeft, ShieldAlert } from 'lucide-react';

const ManagerEscalateReport = ({ report, onBack, onEscalated }) => {
  const [managerRemarks, setManagerRemarks] = useState('');
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEscalateToAdmin = async () => {
    // Validation
    if (!reason.trim() || !managerRemarks.trim()) {
      setError("Please provide both a reason and your remarks for the Admin.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Points to your updated IssueReport API
      const response = await axios.patch(`http://127.0.0.1:8000/api/inventory/issue-reports/${report.id}/escalate/`, {
        manager_remarks: managerRemarks,
        reason: reason,
        is_emergency: isEmergency,
        status: 'ESCALATED' // Changes status so Admin sees it in their queue
      });

      if (response.status === 200) {
        onEscalated(report.id);
      }
    } catch (err) {
      setError("System error: Could not reach Admin services. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Admin Escalation Portal</h2>
        </div>
        {isEmergency && (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full animate-pulse">
            <ShieldAlert size={14} /> EMERGENCY
          </span>
        )}
      </div>

      {/* Staff Data Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
        <p className="text-xs font-bold text-blue-600 uppercase mb-2">Original Staff Report</p>
        <h3 className="font-semibold text-gray-800">{report.title || "Inventory Issue"}</h3>
        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
      </div>

      {/* Escalation Form */}
      <div className="space-y-5">
        {/* Reason for Admin */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Primary Reason</label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Select a reason...</option>
            <option value="Budget Approval">Budget Approval Required</option>
            <option value="Critical Damage">Critical Equipment Damage</option>
            <option value="System Overdue">Unresolved Overdue Shipment</option>
            <option value="Policy Violation">Staff Policy Violation</option>
          </select>
        </div>

        {/* Manager Remarks */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <MessageSquare size={16} /> Manager's Detailed Remarks
          </label>
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Provide context for the Admin to make a decision..."
            value={managerRemarks}
            onChange={(e) => setManagerRemarks(e.target.value)}
          />
        </div>

        {/* Emergency Toggle */}
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <input 
            type="checkbox" 
            id="emergency" 
            className="w-5 h-5 accent-red-600" 
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
          />
          <label htmlFor="emergency" className="text-sm font-medium text-amber-900">
            Mark as High-Priority Emergency for Admin
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Final Action Button */}
        <button
          onClick={handleEscalateToAdmin}
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white transition-all shadow-md ${
            isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            "Escalating..."
          ) : (
            <>
              <Send size={20} />
              SEND TO ADMIN FOR REVIEW
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ManagerEscalateReport;