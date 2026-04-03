import { useState } from "react";
function ApprovalsView() {
  const [requests, setRequests] = useState([]);

  const handleDecision = async (id, decision) => {
    await axios.post(`http://127.0.0.1:8000/api/requests/approvals/${id}/decide/`, { decision });
    setRequests(requests.filter(r => r.id !== id)); // Remove from list once decided
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h2 className="text-xl font-bold mb-6">Pending Approvals</h2>
      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="border rounded-lg p-4 flex justify-between items-center shadow-sm">
            <div>
              <h4 className="font-bold text-gray-800">{req.title}</h4>
              <p className="text-sm text-gray-500 font-medium">Submitted by: {req.submitted_by_name}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => handleDecision(req.id, 'rejected')}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={() => handleDecision(req.id, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>


  );
}
export default ApprovalsView ;