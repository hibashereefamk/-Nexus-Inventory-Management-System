import { MoreHorizontal, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

function TaskRegistry ({ tasks })  {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'SHIPPED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'PACKING': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-200">
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Order Details</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Assigned Staff</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Deadline</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
            <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-slate-50/30 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-800">{task.order_number}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">Ref: {task.id.slice(0,8)}</div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-600">
                {task.department_name}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                    {task.staff_username?.[0].toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{task.staff_username || 'Unassigned'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock size={14} />
                  {task.deadline_date}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(task.status)}`}>
                  {task.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                  <MoreHorizontal size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default TaskRegistry;