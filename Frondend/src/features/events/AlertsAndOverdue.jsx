import React, { useState } from 'react';
import { AlertCircle, Clock, Package, CreditCard, ChevronRight, Filter } from 'lucide-react';

const AlertsAndOverdue = () => {
  const [activeTab, setActiveTab] = useState('all');

  // Sample Data - This would typically come from your Django API
  const alerts = [
    { id: 1, type: 'overdue', category: 'Payment', title: 'Invoice #INV-204', detail: 'Overdue by 5 days', amount: '₹12,500', priority: 'high' },
    { id: 2, type: 'alert', category: 'Stock', title: 'MacBook Air M2', detail: 'Below reorder level (2 left)', priority: 'medium' },
    { id: 3, type: 'overdue', category: 'Shipping', title: 'Order #ORD-992', detail: 'Expected delivery was yesterday', priority: 'high' },
    { id: 4, type: 'alert', category: 'Stock', title: 'Sony Headphones', detail: 'Out of stock', priority: 'critical' },
  ];

  const stats = [
    { label: 'Critical', count: 2, color: 'text-red-600', icon: AlertCircle },
    { label: 'Overdue', count: 5, color: 'text-orange-600', icon: Clock },
    { label: 'Low Stock', count: 12, color: 'text-blue-600', icon: Package },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alerts & Overdue</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-100 transition">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          {['all', 'stock', 'payments', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="divide-y divide-gray-100">
          {alerts.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${
                  item.priority === 'critical' ? 'bg-red-500' : 
                  item.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{item.category}</span>
                    {item.priority === 'critical' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">CRITICAL</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.detail}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {item.amount && <span className="font-mono font-bold text-gray-700">{item.amount}</span>}
                <button className="p-2 hover:bg-gray-200 rounded-full transition text-gray-400">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsAndOverdue;