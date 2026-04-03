import { useState } from "react";
function MonitoringView() {
  const [alerts, setAlerts] = useState([]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">System Health & Alerts</h2>
        <span className="flex items-center gap-2 text-green-500 text-sm font-medium">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span> System Live
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-start gap-4 p-4 bg-white border rounded-lg shadow-sm">
            <div className={`mt-1 h-2 w-2 rounded-full ${alert.level === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-bold text-gray-800">{alert.event_type}</p>
                <span className="text-xs text-gray-400">{alert.timestamp}</span>
              </div>
              <p className="text-sm text-gray-600">{alert.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default MonitoringView;