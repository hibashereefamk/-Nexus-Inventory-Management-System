import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiAlertCircle, FiCheckCircle, FiBell, FiTrash2 } from 'react-icons/fi';

const NotificationPanel = ({ apiBase, headers }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, UNREAD, ISSUE
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Django URL കറക്റ്റ് ചെയ്തത്
      const res = await axios.get(`${apiBase}/api/inventory/notifications/`, headers);
      if (res.data && Array.isArray(res.data)) {
        setNotifications(res.data);
      } else if (res.data && Array.isArray(res.data.results)) {
        setNotifications(res.data.results);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Real-time updates ആവശ്യമുണ്ടെങ്കിൽ 30 സെക്കൻഡിൽ പോൾ ചെയ്യാം
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter Logic
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'UNREAD') return !notif.is_read;
    if (activeTab === 'ISSUE') return notif.notification_type === 'ISSUE' || notif.notification_type === 'DAMAGE';
    return true; // For 'ALL'
  });
const handleMarkAsRead = async (id) => {
  try {

    await axios.patch(
      `${apiBase}/api/inventory/notifications/${id}/`,
      {},
      headers
    );

    // update local state
    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, is_read: true }
          : n
      )
    );

  } catch (err) {
    console.error(
      "Mark read failed",
      err.response?.data || err
    );
  }
};
  return (
    <div className="min-h-screen bg-slate-50 p-6 w-full">
      <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FiBell className="text-blue-600" /> System Notifications
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage logs, critical alerts, and stock updates for your department.
            </p>
          </div>
          
          <button 
            onClick={() => setNotifications([])} // Clear local notifications for representation
            className="text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1.5"
          >
            <FiTrash2 size={14} /> Clear All
          </button>
        </div>

        {/* ERP Tabs Wrapper */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4">
          {['ALL', 'UNREAD', 'ISSUE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-bold transition-all border-b-2 relative -mb-[2px] ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
              {tab === 'UNREAD' && notifications.filter(n => !n.is_read).length > 0 && (
                <span className="ml-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications Body List */}
        <div className="divide-y divide-slate-100 min-h-[300px]">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-medium">Loading system logs...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No notifications found for this category.
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 transition flex items-start justify-between gap-4 ${
                  notif.is_read ? 'bg-white opacity-75' : 'bg-blue-50/20 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {/* Icon Selection based on Urgency/Type */}
                  {notif.notification_type === 'ISSUE' || notif.is_emergency ? (
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                      <FiAlertCircle size={16} />
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                      <FiBell size={16} />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-800">{notif.title}</h4>
                      {!notif.is_read && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">NEW</span>
                      )}
                      {notif.is_emergency && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded">CRITICAL</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
                      {notif.message}
                    </p>
                    <div className="flex gap-3 mt-2 items-center flex-wrap">

  {/* Created Time */}
  <span className="text-[10px] text-slate-500">
    {new Date(notif.created_at).toLocaleString()}
  </span>

  {/* Relative Time */}
  <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600">
    {notif.time_ago}
  </span>

  {/* Type */}
  {notif.notification_type && (
    <span className="text-[10px] px-2 py-1 rounded bg-blue-100 text-blue-700">
      {notif.notification_type}
    </span>
  )}

</div><div className="mt-2 flex gap-2 flex-wrap">

  {notif.department && (
    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded">
      Dept: {notif.department_name}
    </span>
  )}
  {notif.product && (
    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded">
      created by  {notif.username}
    </span>
  )}

  {notif.product && (
    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded">
      Product #{notif.Product_name}
    </span>
  )}

</div>
                  </div>
                </div>

                {/* Mark read checkmark button */}
                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-lg transition shrink-0"
                  >
                    <FiCheckCircle size={18} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationPanel;