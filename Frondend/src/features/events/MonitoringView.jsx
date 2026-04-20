import { useNotifications } from "../../hooks/useTaskNotifications";

const MonitoringView = () => {
  const { notifications } = useNotifications();

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Live Inventory Alerts</h2>
      <div className="space-y-4">
        {notifications.map((note, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 ${
            note.type === 'EXPIRY' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
          }`}>
            <p className="text-sm font-semibold">{note.type}</p>
            <p className="text-xs text-slate-600">{note.msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
};