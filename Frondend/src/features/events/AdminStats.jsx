import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Clock 
} from 'lucide-react';

function AdminStats() {
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const response = await axios.get('/api/reports/admin-stats/');
                setAdminData(response.data);
            } catch (error) {
                console.error("Error fetching admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminStats();
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Dashboard Metrics...</div>;

    const statsConfig = [
        {
            title: "Monthly Orders",
            value: adminData?.total_orders_month || 0,
            icon: <Package className="text-blue-600" size={24} />,
            trend: "+12.5%",
            color: "border-blue-500",
            bg: "bg-blue-50"
        },
        {
            title: "Total Overdue",
            value: adminData?.total_overdue || 0,
            icon: <Clock className="text-red-600" size={24} />,
            trend: "Critical",
            color: "border-red-500",
            bg: "bg-red-50"
        },
        {
            title: "Active Staff",
            value: adminData?.active_staff_count || 0,
            icon: <Users className="text-green-600" size={24} />,
            trend: "Stable",
            color: "border-green-500",
            bg: "bg-green-50"
        }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">System Overview</h1>
                <p className="text-sm text-gray-500">Real-time inventory and performance metrics across all departments.</p>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statsConfig.map((stat, index) => (
                    <div 
                        key={index} 
                        className={`p-6 bg-white shadow-sm rounded-xl border-l-4 ${stat.color} transition-transform hover:scale-[1.02]`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-semibold">
                            <span className={stat.title === "Total Overdue" ? "text-red-600" : "text-green-600"}>
                                {stat.trend}
                            </span>
                            <span className="text-gray-400 ml-2 font-normal">vs. last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Secondary Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent System Alerts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            Critical System Alerts
                        </h3>
                        <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {adminData?.recent_alerts?.length > 0 ? (
                            adminData.recent_alerts.map((alert, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-700 font-medium">{alert.message}</span>
                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold uppercase">High</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">No critical alerts currently flagged.</p>
                        )}
                    </div>
                </div>

                {/* Quick Performance Chart Placeholder */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp size={18} className="text-blue-500" />
                            Revenue Trend
                        </h3>
                    </div>
                    <div className="h-32 w-full bg-gray-50 rounded-lg flex items-end justify-around p-4 gap-1">
                        {[40, 65, 50, 85, 90, 75, 95].map((h, i) => (
                            <div 
                                key={i} 
                                className="bg-blue-500 w-full rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" 
                                style={{ height: `${h}%` }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminStats;