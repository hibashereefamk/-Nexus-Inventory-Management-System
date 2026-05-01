import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { 
  FiLayout, FiBox, FiClipboard, FiGlobe, FiSettings, 
  FiSearch, FiFilter, FiBell, FiUser 
} from 'react-icons/fi'
import AdvancedAssignModal from './AdvancedAssignModal'

const API = 'http://127.0.0.1:8000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return { headers: { Authorization: `Bearer ${token}` } }
}



function ManagerTasksView() {
  const [tasks, setTasks] = useState([])
  const [staffList, setStaffList] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/api/orders/manager/assignments/`, getAuthHeaders())
      setTasks(res.data)
    } catch (err) {
      console.error("Error fetching tasks", err)
    }
  }

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API}/api/orders/manager/fulfillment-data/`, getAuthHeaders())
      setStaffList(res.data.staff)
    } catch (err) {
      console.error("Error fetching staff", err)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchStaff()
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen p-6">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-6 border-b pb-3">
    <h1 className="text-2xl font-bold text-gray-800">
      Manager Assignment Terminal
    </h1>
  </div>

  {/* STATS */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <StatCard title="Total Orders" value={tasks.length} />
    <StatCard title="Pending" value={tasks.filter(t => t.status === 'PENDING').length} />
    <StatCard title="In Progress" value={tasks.filter(t => t.status === 'PACKING').length} />
    <StatCard title="Completed" value={tasks.filter(t => t.status === 'PACKED').length} />
  </div>

  {/* TABLE */}
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

    {/* HEADER */}
    <div className="flex justify-between items-center p-4 border-b bg-gray-50">
      <h2 className="text-lg font-semibold text-gray-700">
        Task Registry
      </h2>
      <div className="flex gap-3 text-gray-400">
        <FiFilter className="cursor-pointer hover:text-gray-600" />
        <FiSearch className="cursor-pointer hover:text-gray-600" />
      </div>
    </div>

    <table className="w-full text-sm">
      <thead className="bg-gray-100 text-gray-500 uppercase text-xs">
        <tr>
          <th className="p-4 text-left">Order</th>
          <th className="p-4 text-left">Department</th>
          <th className="p-4 text-left">Priority</th>
          <th className="p-4 text-left">Staff</th>
          <th className="p-4 text-left">Status</th>
          <th className="p-4 text-right">Action</th>
        </tr>
      </thead>

      <tbody className="divide-y">
  {tasks.map(task => (
    <React.Fragment key={task.order_number}>

      {/* MAIN ROW */}
      <tr
        onClick={() =>
          setExpandedOrder(
            expandedOrder === task.order_number ? null : task.order_number
          )
        }
        className="hover:bg-gray-50 transition cursor-pointer"
      >
        {/* ORDER */}
        <td className="p-4 font-mono text-indigo-600 font-semibold">
          {task.order_number}
        </td>

        {/* DEPARTMENT */}
        <td className="p-4 text-gray-700">
          {task.department}
        </td>

        {/* PRODUCTS SUMMARY */}
        <td className="p-4 text-gray-500 text-sm">
          {task.products?.length} items
        </td>

        {/* STAFF */}
        <td className="p-4">
          {task.staff ? (
            <span className="font-medium text-gray-800">
              {task.staff}
            </span>
          ) : (
            <span className="text-gray-400 italic">
              Unassigned
            </span>
          )}
        </td>

        {/* STATUS */}
        <td className="p-4">
          <StatusBadge status={task.status} />
        </td>

        {/* ACTION */}
        <td className="p-4 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation() // prevent row click
              setSelectedTask(task)
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-xs font-semibold"
          >
            Assign
          </button>
        </td>
      </tr>

      {/* EXPANDED ROW */}
      {expandedOrder === task.order_number && (
        <tr className="bg-gray-50">
          <td colSpan="6" className="p-4">

            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">
                Products
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {task.products.map((p, i) => (
                  <div
                    key={i}
                    className="flex justify-between bg-gray-100 px-3 py-2 rounded"
                  >
                    <span className="text-gray-700">{p.name}</span>
                    <span className="text-gray-500 text-sm">
                      x{p.quantity}
                    </span>
                  </div>
                ))}
              </div>

            </div>

          </td>
        </tr>
      )}

    </React.Fragment>
  ))}
</tbody>
</table>
  </div>

  {/* MODAL */}
  {selectedTask && (
    <AdvancedAssignModal
      selectedTask={selectedTask}
      staffList={staffList}
      onClose={() => setSelectedTask(null)}
      onRefresh={() => {
        fetchTasks()
        fetchStaff()
      }}
    />
  )}
</div>
)
}
const StatCard = ({ title, value }) => (
  <div className="bg-white p-5 rounded-xl border shadow-sm">
    <p className="text-xs font-semibold text-gray-500 uppercase">
      {title}
    </p>
    <p className="text-2xl font-bold text-gray-800 mt-1">
      {value}
    </p>
  </div>
)
const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PACKING: "bg-blue-100 text-blue-700",
    PACKED: "bg-green-100 text-green-700",
    SHIPPED: "bg-gray-200 text-gray-700"
  }

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status]}`}>
      {status}
    </span>
  )
}

export default ManagerTasksView;