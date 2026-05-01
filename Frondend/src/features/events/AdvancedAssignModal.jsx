import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

const AdvancedAssignModal = ({ selectedTask, staffList, onClose, onRefresh }) => {
  const [formData, setFormData] = useState({
    staff: '',
    priority: 'MED',
    deadline_date: '',
    notes: ''
  })

  // 🔥 AUTO SELECT BEST STAFF (least workload)
  useEffect(() => {
    if (staffList.length > 0) {
      const sorted = [...staffList].sort((a, b) => a.current_tasks - b.current_tasks)
      setFormData(prev => ({ ...prev, staff: sorted[0].id }))
    }
  }, [staffList])

  const handleAssign = async () => {
    try {
      const token = localStorage.getItem('access_token')

      await axios.post(
        `${API}/api/orders/manager/assignments/${selectedTask.id}/assign-staff/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      onRefresh()
      onClose()
    } catch (err) {
      alert('Assignment failed')
    }
  }

  if (!selectedTask) return null

  const totalItems = selectedTask.products.reduce((a, b) => a + b.quantity, 0)

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold">
            Fulfill & Assign Order
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-3 gap-6 p-6">

          {/* ================= LEFT: ORDER ================= */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h3 className="font-semibold mb-3 text-blue-600">
              1. Order Context
            </h3>

            <p className="text-sm mb-2">
              <span className="text-gray-500">Order:</span>{' '}
              <span className="font-mono">{selectedTask.order_number}</span>
            </p>

            <p className="text-sm mb-4">
              <span className="text-gray-500">Status:</span>{' '}
              <span className="text-yellow-600">{selectedTask.status}</span>
            </p>

            {/* PRODUCTS */}
            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2">
                Items ({totalItems})
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedTask.products.map((p, i) => (
                  <div key={i} className="flex justify-between bg-white p-2 rounded border">
                    <span>{p.name}</span>
                    <span className="text-gray-500">x{p.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= MIDDLE: STAFF ================= */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h3 className="font-semibold mb-3 text-blue-600">
              2. Staff Optimization
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {staffList.map(s => {
                const isBest = s.current_tasks === Math.min(...staffList.map(x => x.current_tasks))

                return (
                  <div
                    key={s.id}
                    onClick={() => setFormData({ ...formData, staff: s.id })}
                    className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center
                      ${formData.staff === s.id ? 'bg-blue-50 border-blue-500' : 'bg-white'}
                    `}
                  >
                    <div>
                      <p className="font-medium">{s.username}</p>
                      <p className="text-xs text-gray-500">
                        Tasks: {s.current_tasks}
                      </p>
                    </div>

                    {isBest && (
                      <span className="text-green-600 text-xs font-bold">
                        BEST
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ================= RIGHT: SETTINGS ================= */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h3 className="font-semibold mb-3 text-blue-600">
              3. Execution
            </h3>

            <div className="space-y-4">

              <select
                className="w-full border p-2 rounded"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MED">Medium</option>
                <option value="HIGH">High</option>
              </select>

              <input
                type="date"
                className="w-full border p-2 rounded"
                value={formData.deadline_date}
                onChange={e => setFormData({ ...formData, deadline_date: e.target.value })}
              />

              <textarea
                placeholder="Notes..."
                className="w-full border p-2 rounded"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>

          <button
            onClick={handleAssign}
            className="px-6 py-2 bg-blue-600 text-white rounded"
          >
            Confirm & Assign
          </button>
        </div>

      </div>
    </div>
  )
}

export default AdvancedAssignModal