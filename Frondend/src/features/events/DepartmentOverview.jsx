import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutGrid, Users, ClipboardCheck, ArrowUpRight } from 'lucide-react';

function DepartmentOverview ()  {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/accounts/departments/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setDepartments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {departments.map((dept) => (
        <div key={dept.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <LayoutGrid size={24} />
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-wider">
              Active Dept
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-1">{dept.name}</h3>
          <p className="text-sm text-slate-500 mb-6 line-clamp-2">{dept.description}</p>
          
          <div className="flex items-center gap-4 py-4 border-t border-slate-50">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">
                {dept.manager_name || 'No Manager'}
              </span>
            </div>
          </div>

          <button className="w-full mt-2 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
            View Department Tasks <ArrowUpRight size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
export default DepartmentOverview;