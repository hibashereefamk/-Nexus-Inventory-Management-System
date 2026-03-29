import React, { useState, useEffect } from 'react'
import axios from 'axios'

function StaffPackingQueue() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    pending: 0,
    packing: 0,
    packed: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
  try {
    const token = localStorage.getItem('access_token'); // Get token inside the function
    const res = await axios.get('http://127.0.0.1:8000/api/orders/staff/tasks/', {
      headers: {
        'Authorization': `Bearer ${token}` // This is the crucial part
      }
    });
    
    const data = Array.isArray(res.data) ? res.data : res.data.tasks || [];
    setTasks(data);
    
    setStats({
      pending: data.filter(t => t.status === 'PENDING').length,
      packing: data.filter(t => t.status === 'PACKING').length,
      packed: data.filter(t => t.status === 'PACKED').length
    });

    setLoading(false);
  } catch (err) {
    console.error("Fetch error:", err.response?.data || err.message);
    setLoading(false);
  }
};
const handleUpdateStatus = async (id, status) => {
  try {
    const token = localStorage.getItem('access_token');
    await axios.patch(
      `http://127.0.0.1:8000/api/orders/staff/update-task/${id}/`, 
      { status: status }, // Body
      {
        headers: {
          'Authorization': `Bearer ${token}` // Headers
        }
      }
    );
    fetchDashboardData(); // Refresh list after update
  } catch (err) {
    console.error("Update error:", err.response?.data || err.message);
  }
};

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* 🔷 HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Staff Operations</p>
      </div>

      {/* 🔷 STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        <StatCard title="Pending Orders" count={stats.pending} icon="📦" color="bg-yellow-500" />
        <StatCard title="Packing" count={stats.packing} icon="📦" color="bg-blue-500" />
        <StatCard title="Packed" count={stats.packed} icon="🚚" color="bg-green-500" />

      </div>

      {/* 🔷 KANBAN */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        <QueueColumn
          title="Pending"
          items={tasks.filter(t => t.status === 'PENDING')}
          action={(id) => handleUpdateStatus(id, 'PACKING')}
          btnText="Start"
          color="border-yellow-400"
        />

        <QueueColumn
          title="Packing"
          items={tasks.filter(t => t.status === 'PACKING')}
          action={(id) => handleUpdateStatus(id, 'PACKED')}
          btnText="Pack"
          color="border-blue-400"
        />

        <QueueColumn
          title="Packed"
          items={tasks.filter(t => t.status === 'PACKED')}
          action={(id) => handleUpdateStatus(id, 'SHIPPED')}
          btnText="Ship"
          color="border-green-400"
        />

        <QueueColumn
          title="Completed"
          items={tasks.filter(t => t.status === 'SHIPPED')}
          isReadOnly
          color="border-gray-400"
        />

      </div>

      {/* 🔷 LIVE TABLE */}
      <div className="mt-8 bg-white rounded-xl shadow p-4">
        <h3 className="font-bold mb-4">Recent Orders</h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="py-2 text-left">Order</th>
              <th>Status</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {tasks.slice(0, 5).map(task => (
              <tr key={task.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-medium">{task.order_number}</td>
                <td>
                  <StatusBadge status={task.status} />
                </td>
                <td>{task.deadline_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default StaffPackingQueue


const StatCard = ({ title, count, icon, color }) => (
  <div className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-3xl font-bold">{count}</h2>
    </div>
    <div className={`${color} text-white p-3 rounded-lg text-xl`}>
      {icon}
    </div>
  </div>
)

const QueueColumn = ({ title, items, action, btnText, isReadOnly, color }) => (
  <div className={`bg-white rounded-xl p-4 shadow border-t-4 ${color}`}>
    <h3 className="font-bold mb-4 flex justify-between">
      {title}
      <span className="bg-gray-200 px-2 rounded text-xs">{items.length}</span>
    </h3>

    <div className="space-y-3">
      {items.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onAction={() => action(task.id)}
          btnText={btnText}
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  </div>
)

const TaskCard = ({ task, onAction, btnText, isReadOnly }) => (
  <div className="bg-gray-50 p-4 rounded-lg border hover:shadow-md transition">
    <h4 className="font-bold">{task.order_number}</h4>

    <p className="text-xs text-gray-500 mt-1">
      Deadline: {task.deadline_date}
    </p>

    <div className="mt-2">
      <StatusBadge status={task.status} />
    </div>

    {!isReadOnly && (
      <button
        onClick={onAction}
        className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded"
      >
        {btnText}
      </button>
    )}
  </div>
)

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PACKING: 'bg-blue-100 text-blue-700',
    PACKED: 'bg-green-100 text-green-700',
    SHIPPED: 'bg-gray-200 text-gray-700'
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status]}`}>
      {status}
    </span>
  )
}