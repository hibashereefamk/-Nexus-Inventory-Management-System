import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';
import { useState,useEffect } from 'react';
function AnalyticsView() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('/api/analytics/monthly-performance/').then(res => setData(res.data));
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-6">Operational Performance (Monthly)</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed Tasks" />
            <Bar dataKey="pending" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Pending Tasks" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AnalyticsView;