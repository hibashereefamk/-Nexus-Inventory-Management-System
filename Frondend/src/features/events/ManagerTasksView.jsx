
 

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { FiSearch, FiFilter } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'; //
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
  const [activeFilter, setActiveFilter] = useState("ALL")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/orders/manager/assignments/`, getAuthHeaders())
      const data = Array.isArray(res.data) ? res.data : res.data.results || []
      setTasks(data)
    } catch (err) {
      console.error("Error fetching tasks", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API}/api/orders/manager/fulfillment-data/`, getAuthHeaders())
      setStaffList(res.data.staff || [])
    } catch (err) {
      console.error("Error fetching staff", err)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API}/api/orders/manager/update-status/${id}/`,
        { status },
        getAuthHeaders()
      )
      fetchTasks()
    } catch (err) {
      console.error("Update failed", err)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchStaff()
  }, [])

  const filteredTasks = tasks.filter(task => {
  switch (activeFilter) {
    case "ASSIGNED":
      return task.staff

    case "NOT_ASSIGNED":   // ✅ NEW
      return !task.staff

    case "SHIP_REQUEST":
      return task.status === "APPROVAL_REQUESTED"

    case "COMPLETED":
      return task.status === "SHIPPED"

    default:
      return true
  }
})

  const FilterTab = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold ${
        active
          ? "bg-indigo-600 text-white"
          : "bg-white border text-gray-500 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  )

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading tasks...</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">

      {/* FILTERS */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <FilterTab label={`All (${tasks.length})`} active={activeFilter==="ALL"} onClick={()=>setActiveFilter("ALL")} />
        <FilterTab label={`Unassigned (${tasks.filter(t => !t.staff).length})`} active={activeFilter === "NOT_ASSIGNED"} onClick={() => setActiveFilter("NOT_ASSIGNED")} />
        <FilterTab label={`Assigned (${tasks.filter(t=>t.staff).length})`} active={activeFilter==="ASSIGNED"} onClick={()=>setActiveFilter("ASSIGNED")} />
        <FilterTab label={`Ship Requests (${tasks.filter(t=>t.status==="APPROVAL_REQUESTED").length})`} active={activeFilter==="SHIP_REQUEST"} onClick={()=>setActiveFilter("SHIP_REQUEST")} />
        <FilterTab label={`Completed (${tasks.filter(t=>t.status==="SHIPPED").length})`} active={activeFilter==="COMPLETED"} onClick={()=>setActiveFilter("COMPLETED")} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase">
            <tr>
              <th className="p-4 text-left">Order</th>
              <th className="p-4">Dept</th>
              <th className="p-4">Deadline</th>
              <th className="p-4">Items</th>
              <th className="p-4">Staff</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-400">
                  No tasks found
                </td>
              </tr>
            )}

            {filteredTasks.map(task => (
              <React.Fragment key={task.id}>

                <tr
                  onClick={() =>
                    setExpandedOrder(expandedOrder === task.id ? null : task.id)
                  }
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-4 font-mono text-indigo-600">{task.order_number}</td>
                  <td className="p-4">{task.department|| <span className="text-gray-400">Unassigned</span>}</td>
                  <td className="p-4">{task.deadline}</td>
                  <td className="p-4">{task.products?.length}</td>

                  <td className="p-4">
                    {task.staff || <span className="text-gray-400">Unassigned</span>}
                  </td>

                  <td className="p-4">
                    <StatusBadge status={task.status} />
                  </td>

                  <td className="p-4 text-right space-x-2">

                   <td className="p-4 text-right space-x-2">
  {/* 1. CRITICAL PRIORITY: Damage Review */}
  {/* If verification failed, this is the only action that matters */}
  {task.verification_status === "FAILED" ? (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/manager/order-review/${task.id}`);
      }}
      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-sm transition-all"
    >
      REVIEW DAMAGE REPORT
    </button>
  ) : (
    <div className="flex justify-end gap-2">
      {/* 2. LOGISTICS CONTROL: Assignment */}
      {/* Show Assign/Reassign if the order is still in early stages */}
      {(task.status === "PENDING" || task.status === "PACKING") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTask(task);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          {task.staff ? "Reassign" : "Assign Staff"}
        </button>
      )}

      {/* 3. QUALITY GATE: Review & Approve */}
      {/* Show Audit button only if staff has finished packing successfully */}
      {task.status === "PACKED" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/manager/order-review/${task.id}`);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black shadow-md flex items-center gap-1"
        >
          AUDIT & SHIP
        </button>
      )}

      {/* 4. COMPLETED STATE */}
      {task.status === "SHIPPED" && (
        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          ✔ Dispatched
        </span>
      )}
    </div>
  )}
</td>
                    

                  </td>
                </tr>

                {/* EXPAND */}
                {expandedOrder === task.id && (
                  <tr className="bg-gray-50">
                    <td colSpan="6" className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        {task.products?.map((p, i) => (
                          <div key={i} className="flex justify-between bg-white p-2 border rounded">
                            <span>{p.name}</span>
                            <span>x{p.quantity}</span>
                          </div>
                        ))}
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
          onRefresh={fetchTasks}
        />
      )}

    </div>
  )
}

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PACKING: "bg-blue-100 text-blue-700",
    PACKED: "bg-green-100 text-green-700",
    APPROVAL_REQUESTED: "bg-purple-100 text-purple-700",
    SHIPPED: "bg-gray-200 text-gray-700"
  }

  return (
    <span className={`px-2 py-1 text-xs rounded ${styles[status]}`}>
      {status}
    </span>
  )
}

export default ManagerTasksView 





