import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, AlertTriangle, PackageCheck, BarChart3 } from 'lucide-react';

const ManagerPerformance = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/reports/manager-stats/');
        setReportData(response.data);
      } catch (error) {
        console.error("Error fetching performance data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Analytics...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Department Performance: {reportData?.department_name}</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <BarChart3 size={18} /> Export PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Efficiency Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex text-blue-600 mb-2"><TrendingUp /></div>
          <h3 className="text-gray-500 text-sm font-medium">Avg. Packing Time</h3>
          <p className="text-3xl font-bold">{reportData?.performance.avg_packing_hours.toFixed(1)} hrs</p>
        </div>

        {/* Damage/Issues Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-orange-500">
          <div className="flex text-orange-600 mb-2"><AlertTriangle /></div>
          <h3 className="text-gray-500 text-sm font-medium">Pending Issues</h3>
          <p className="text-3xl font-bold">{reportData?.performance.pending_issues}</p>
        </div>

        {/* Stock Health Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex text-green-600 mb-2"><PackageCheck /></div>
          <h3 className="text-gray-500 text-sm font-medium">Inventory Health</h3>
          <p className="text-3xl font-bold">{reportData?.inventory_summary.low_stock_alerts} <span className="text-sm font-normal text-gray-400">Low Items</span></p>
        </div>
      </div>

      {/* Progress Chart Placeholder */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex flex-col items-center justify-center text-gray-400">
        <p>Performance Trend (Last 7 Days)</p>
        <div className="w-full mt-4 flex items-end justify-around h-32 px-10">
          {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
            <div key={i} className="bg-blue-100 w-8 rounded-t-md hover:bg-blue-500 transition-all cursor-pointer" style={{ height: `${h}%` }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerPerformance;