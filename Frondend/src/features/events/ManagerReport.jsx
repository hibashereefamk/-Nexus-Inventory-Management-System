import React, { useState } from 'react';
import axios from 'axios';
import { Send, AlertTriangle, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react';

const ManagerEscalateReport = ({ report, onBack, onEscalated }) => {
  const [managerNotes, setManagerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEscalate = async () => {
    if (!managerNotes.trim()) {
      setError("Please add your remarks before escalating to the Admin.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Endpoint corresponds to your ManagerEscalateIssueView
      const response = await axios.patch(`http://127.0.0.1:8000/api/inventory/issue-reports/${report.id}/escalate/`, {
        manager_notes: managerNotes // Sent to the backend patch method
      });

      if (response.status === 200) {
        onEscalated(report.id);
      }
    } catch (err) {
      setError("Failed to escalate report. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">Escalate Staff Report</h2>
      </div>

      {/* Staff Report Summary (Read Only) */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 mb-8">
        <div className="flex items-center gap-2 text-amber-700 mb-2 font-bold uppercase tracking-wider text-xs">
          <AlertTriangle size={14} /> Original Staff Report
        </div>
        <h3 className="font-bold text-gray-800 mb-1">{report.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{report.description}</p>
        <div className="flex justify-between text-xs text-gray-500 border-t border-amber-200 pt-3">
          <span>Reported by: <span className="font-semibold">{report.reported_by_username}</span></span>
          <span>Date: {new Date(report.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Manager Input Section */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-600" />
          Your Remarks for System Admin
        </label>
        <textarea
          className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-40"
          placeholder="Explain why this issue requires Admin intervention (e.g., Budget approval needed, critical system failure...)"
          value={managerNotes}
          onChange={(e) => setManagerNotes(e.target.value)}
        />
        
        {error && (
          <p className="text-red-500 text-sm font-medium flex items-center gap-1">
            <AlertTriangle size={14} /> {error}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleEscalate}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${
              isSubmitting 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isSubmitting ? "Sending..." : <><Send size={18} /> Send to Admin</>}
          </button>
          
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerEscalateReport;