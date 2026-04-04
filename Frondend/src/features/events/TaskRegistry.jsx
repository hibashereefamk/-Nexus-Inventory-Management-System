import React from 'react';
import { 
  MoreVertical, 
  Clock, 
  PackageCheck, 
  User, 
  Layers, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const TaskRegistry = ({ tasks }) => {
  // Professional color mapping for ERP statuses
  const getStatusConfig = (status) => {
    const configs = {
      'SHIPPED': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
      'PACKED': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', dot: 'bg-blue-500' },
      'PACKING': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500' },
      'PENDING': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
    };
    return configs[status] || configs['PENDING'];
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Order Identifier</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ownership</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Progress Metrics</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Timeline</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Workflow Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const config = getStatusConfig(task.status);
              const inspectedItems = task.items?.filter(i => i.is_inspected).length || 0;
              const totalItems = task.items?.length || 0;
              const progressPercentage = totalItems > 0 ? (inspectedItems / totalItems) * 100 : 0;

              return (
                <tr key={task.id} className="hover:bg-slate-50/40 transition-all group">
                  {/* 1. Order ID & Ref */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {task.order_number}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase mt-1">
                        REF-{task.id.toString().slice(0, 8)}
                      </span>
                    </div>
                  </td>

                  {/* 2. Staff & Department */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                        <User size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">
                          {task.staff_username || 'Unassigned'}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Layers size={10} /> {task.department_name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 3. Progress Bar & Item Count */}
                  <td className="px-6 py-5">
                    <div className="w-40">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500">
                          {inspectedItems}/{totalItems} Items
                        </span>
                        <span className="text-[10px] font-bold text-blue-600">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* 4. Deadline with Urgency Logic */}
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 text-sm font-medium ${
                      task.status !== 'SHIPPED' && new Date(task.deadline_date) < new Date() 
                      ? 'text-red-500' 
                      : 'text-slate-500'
                    }`}>
                      <Clock size={14} />
                      {task.deadline_date || 'No Deadline'}
                    </div>
                  </td>

                  {/* 5. Status Badge */}
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${config.bg} ${config.text} ${config.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                      {task.status}
                    </span>
                  </td>

                  {/* 6. Actions */}
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Pagination Placeholder */}
      <div className="bg-slate-50/50 border-t border-slate-200 px-6 py-3 flex justify-between items-center">
        <span className="text-xs text-slate-400 font-medium">
          Showing {tasks.length} active warehouse assignments
        </span>
      </div>
    </div>
  );
};

export default TaskRegistry;