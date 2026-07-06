import NotificationPanel from './NotificationPanel'
import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from "react-router-dom";

import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiSearch,
  FiXCircle,
  FiRefreshCw
} from 'react-icons/fi'
import { toast, Toaster } from 'react-hot-toast'
import ProductVerification from './VerificationMode'

const API = 'http://127.0.0.1:8000'

const StaffTaskTerminal = () => {
  const [tasks, setTasks] = useState([])
  const [filteredTasks, setFilteredTasks] = useState([])
  const [stats, setStats] = useState({ pending: 0, packing: 0, packed: 0 })
  const [activeVerificationTask, setActiveVerificationTask] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate();
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString())
  const [inspectionItems, setInspectionItems] = useState([])
  const [isSelectingProduct, setIsSelectingProduct] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [Show, setShow] = useState(false)

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  })

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/orders/staff/tasks/`, getAuthHeaders()),
        axios.get(`${API}/api/orders/staff/stats/`, getAuthHeaders())
      ])
      const taskData = Array.isArray(tasksRes.data)
        ? tasksRes.data
        : tasksRes.data.results || []
      setTasks(taskData)
      setFilteredTasks(taskData || [])
      setStats(statsRes.data || { pending: 0, packing: 0, packed: 0 })
      setLastSynced(new Date().toLocaleTimeString())
    } catch (err) {
      toast.error('Failed to sync with ERP server.')
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshInspectionList = async taskId => {
    try {
      const res = await axios.get(
        `${API}/api/orders/staff/tasks/${taskId}/`,
        getAuthHeaders()
      )
      const fullTask = res.data
      const products = fullTask?.products || []

      const productsWithHistory = await Promise.all(
        products.map(async p => {
          const productId = p.product_id || p.product

          const historyRes = await axios.get(
            `${API}/api/inventory/verify-products/history/${productId}/`,
            getAuthHeaders()
          )

          const currentVerification = Array.isArray(historyRes.data)
            ? historyRes.data.find(record => {
                const recordAssignmentId = record.assignment_id || record.assignment
                return Number(recordAssignmentId) === Number(fullTask.id)
              })
            : null

          return {
            ...p,
            last_verification: currentVerification || null,
            is_inspected: !!currentVerification
          }
        })
      )
      setInspectionItems(productsWithHistory)
    } catch (err) {
      console.error('Refresh Error:', err)
    }
  }

  const handleOpenVerification = async taskItem => {
    try {
      setLoading(true)
      const res = await axios.get(
        `${API}/api/orders/staff/tasks/${taskItem.id}/`,
        getAuthHeaders()
      )
      const fullTask = res.data
      const products = fullTask?.products || []

      const productsWithHistory = await Promise.all(
        products.map(async p => {
          const productId = p.product_id || p.product
          const historyRes = await axios.get(
            `${API}/api/inventory/verify-products/history/${productId}/`,
            getAuthHeaders()
          )

          const currentVerification = Array.isArray(historyRes.data)
            ? historyRes.data.find(record => {
                const recordAssignmentId = record.assignment_id || record.assignment
                return Number(recordAssignmentId) === Number(fullTask.id)
              })
            : null

          return {
            ...p,
            last_verification: currentVerification || null,
            is_inspected: !!currentVerification
          }
        })
      )

      setInspectionItems(productsWithHistory)
      setActiveVerificationTask(fullTask)
      setIsSelectingProduct(true)
    } catch (err) {
      toast.error('ERP History Sync Error.')
    } finally {
      setLoading(false)
    }
  }
  
  const RequestRestock = async item => {
    if (!reason.trim()) {
      toast.error('Please enter a reason for restock')
      return
    }

    const taskId = activeVerificationTask?.id
    if (!taskId) {
      toast.error('No active task found context.')
      return
    }

    try {
      setLoading(true)
      const res = await axios.get(
        `${API}/api/orders/staff/tasks/${taskId}/`,
        getAuthHeaders()
      )
      const fullTask = res.data

      await axios.post(
        `${API}/api/orders/staff/tasks/request-restock/`,
        {
          text: reason,
          product_id: item.product_id || item.id,
          assignment_id: taskId
        },
        getAuthHeaders()
      )

      toast.success('Restock request submitted successfully!')
      setReason('')

      await refreshInspectionList(taskId)
    } catch (err) {
      toast.error(
        err.response?.data?.error || 'Cannot submit the re-stock request'
      )
    } finally {
      setShow(false)
    }
  }

  const finalizeOrder = async () => {
    try {
      setLoading(true)
      const taskId = activeVerificationTask.id
      const allPassed = inspectionItems.every(
        i => i.last_verification?.is_passed === true
      )

      await axios.patch(
        `${API}/api/orders/staff/tasks/${taskId}/inspect/`,
        {
          is_passed: allPassed,
          status: 'PACKED'
        },
        getAuthHeaders()
      )

      toast.success('Order Manifest Synchronized!')
      setIsSelectingProduct(false)
      setActiveVerificationTask(null)
      fetchData()
    } catch (err) {
      toast.error('Finalization failed')
    } finally {
      setLoading(false)
    }
  }

  // ✅ HANDLES STATUS MUTATION TO 'SHIPPED' ACCORDING TO StaffUpdateTaskStatusView CRITERIA
  const updateStatus = async (assignmentId, status) => {
    try {
      await axios.patch(
        `${API}/api/orders/staff/update-task/${assignmentId}/`,
        { status }, 
        getAuthHeaders()
      )
      toast.success(`Task updated to ${status}`)
      fetchData()
    } catch (err) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.[0] || 'Failed to update task status.'
      toast.error(errMsg)
    }
  }

  const allItemsVerified =
    inspectionItems.length > 0 &&
    inspectionItems.every(item => item.is_inspected)

  // View 1: Order Manifest details view
  if (isSelectingProduct && activeVerificationTask) {
    const task = activeVerificationTask
    return (
      <div className='min-h-screen bg-slate-50 p-4 md:p-8 font-sans'>
        <Toaster position='top-right' />
        <div className='max-w-6xl mx-auto mb-6 flex justify-between items-center'>
          <button
            onClick={() => {
              setIsSelectingProduct(false)
              setActiveVerificationTask(null)
            }}
            className='flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors'
          >
            &larr; BACK TO TERMINAL
          </button>
          <div className='px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase'>
            {task.status} | {task.approval_status}
          </div>
        </div>

        <div className='max-w-6xl mx-auto space-y-6'>
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
            <div className='p-6 border-b border-slate-100 bg-slate-50/50'>
              <h2 className='text-xl font-black text-slate-900'>
                Order Manifest: #{task.order_number}
              </h2>
            </div>
            <div className='p-6 grid grid-cols-2 md:grid-cols-4 gap-6'>
              <div>
                <p className='text-[10px] font-bold text-slate-400 uppercase'>Department</p>
                <p className='text-sm font-bold text-slate-800'>{task.department_name}</p>
              </div>
              <div>
                <p className='text-[10px] font-bold text-slate-400 uppercase'>Assigned Staff</p>
                <p className='text-sm font-bold text-slate-800'>{task.staff_username}</p>
              </div>
              <div>
                <p className='text-[10px] font-bold text-slate-400 uppercase'>Deadline</p>
                <p className='text-sm font-bold text-slate-800'>{task.deadline_date}</p>
              </div>
              <div>
                <p className='text-[10px] font-bold text-slate-400 uppercase'>Assignment Date</p>
                <p className='text-sm font-bold text-slate-800'>
                  {new Date(task.assigned_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-slate-50 border-b border-slate-200'>
                  <th className='p-4 text-[10px] font-black text-slate-400 uppercase'>Product Details</th>
                  <th className='p-4 text-[10px] font-black text-slate-400 uppercase text-center'>Category</th>
                  <th className='p-4 text-[10px] font-black text-slate-400 uppercase text-center'>Qty</th>
                  <th className='p-4 text-[10px] font-black text-slate-400 uppercase text-center'>Status</th>
                  <th className='p-4 text-[10px] font-black text-slate-400 uppercase text-right'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(inspectionItems || []).map(item => {
                  const hasLogRecord = !!item.last_verification
                  const isPassedRecord = item.last_verification?.is_passed === true

                  return (
                    <React.Fragment key={item.id}>
                      <tr className='border-b border-slate-100'>
                        <td className='p-4'>
                          <p className='font-bold text-slate-900'>{item.name}</p>
                          <p className='text-[10px] font-mono text-slate-400'>{item.sku}</p>
                        </td>
                        <td className='p-4 text-center'>
                          <span className='px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase'>
                            {item.category_name}
                          </span>
                        </td>
                        <td className='p-4 text-center font-mono font-bold text-slate-700'>
                          {item.quantity}
                        </td>
                        <td className='p-4 text-center'>
                          {!hasLogRecord ? (
                            <span className='text-amber-500 text-[10px] font-black uppercase tracking-wider'>○ Awaiting</span>
                          ) : isPassedRecord ? (
                            <span className='flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-black uppercase'>
                              <FiCheckCircle size={12} /> Passed
                            </span>
                          ) : (
                            <span className='flex items-center justify-center gap-1 text-red-600 text-[10px] font-black uppercase'>
                              <FiXCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                        <td className='p-4 text-right'>
                          {hasLogRecord ? (
                            <button
                              onClick={() => {
                                const selectedProduct = {
                                  product_id: item.product_id || item.id,
                                  name: item.name,
                                  sku: item.sku,
                                  batch_number: item.batch_number,
                                  category_name: item.category_name,
                                  department_name: item.department,
                                  order_number: task.order_number,
                                  staff_username: task.staff_username,
                                  expiry_date: item.expiry_date,
                                  warranty_expiry: item.warranty_expiry,
                                  total_stock: item.total_stock,
                                  order_item_id: item.id,
                                  task_id: task.id,
                                  quantity: item.quantity
                                }
                                setActiveVerificationTask({
                                  ...task,
                                  current_product: selectedProduct
                                })
                                setIsSelectingProduct(false)
                              }}
                              className='px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm flex inline-flex items-center gap-1 ml-auto'
                            >
                              <FiRefreshCw size={10} /> Re-Evaluate Item
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const selectedProduct = {
                                  product_id: item.product_id || item.id,
                                  name: item.name,
                                  sku: item.sku,
                                  batch_number: item.batch_number,
                                  category_name: item.category_name,
                                  order_item_id: item.id,
                                  task_id: task.id,
                                  department_name: task.department,
                                  order_number: task.order_number,
                                  staff_username: task.staff_username,
                                  quantity: item.quantity
                                }
                                setActiveVerificationTask({
                                  ...task,
                                  current_product: selectedProduct
                                })
                                setIsSelectingProduct(false)
                              }}
                              className='px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm'
                            >
                              Execute QC Audit
                            </button>
                          )}
                        </td>
                      </tr>

                      {hasLogRecord && (
                        <tr>
                          <td colSpan='5' className='p-0'>
                            <div className={`m-2 p-4 rounded-lg shadow-inner border-x-4 ${
                              isPassedRecord ? 'bg-emerald-50/60 border-emerald-500' : 'bg-red-50 border-red-500'
                            }`}>
                              <div className='flex justify-between items-start mb-3'>
                                <h4 className={`text-xs font-black uppercase flex items-center gap-2 ${
                                  isPassedRecord ? 'text-emerald-800' : 'text-red-800'
                                }`}>
                                  {isPassedRecord ? <FiCheckCircle /> : <FiXCircle />} Audit Verification Details Report
                                </h4>
                                <span className={`text-[10px] font-mono ${isPassedRecord ? 'text-emerald-500' : 'text-red-400'}`}>
                                  Log ID: {item.last_verification.id} | {new Date(item.last_verification.timestamp).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-3'>
                                {Object.entries(item.last_verification).map(([key, value]) => {
                                  if (typeof value === 'boolean' && key !== 'is_passed') {
                                    return (
                                      <div key={key} className='flex items-center gap-2'>
                                        {value ? <FiCheckCircle className='text-emerald-500' /> : <FiXCircle className='text-red-500' />}
                                        <span className={`text-[10px] font-bold ${value ? 'text-slate-600' : 'text-red-700 underline'}`}>
                                          {key.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                      </div>
                                    )
                                  }
                                  return null
                                })}
                              </div>

                              <div className='bg-white/70 p-2 rounded border border-slate-200/60'>
                                <p className='text-[10px] font-black text-slate-400 uppercase'>Staff Comments:</p>
                                <p className='text-sm italic text-slate-700'>
                                  {item.last_verification.comments ? `"${item.last_verification.comments}"` : "No remarks provided."}
                                </p>
                              </div>

                              {!isPassedRecord && (
                                <div className='flex items-center gap-2 mt-3 pt-2 border-t border-red-100'>
                                  <input
                                    type='text'
                                    value={reason}
                                    className='border p-1 rounded text-black text-xs w-full bg-white'
                                    placeholder='Reason for restock...'
                                    onChange={e => setReason(e.target.value)}
                                  />
                                  <button
                                    disabled={loading}
                                    className='text-[10px] font-black bg-white p-2 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 whitespace-nowrap'
                                    onClick={() => RequestRestock(item)}
                                  >
                                    {loading ? 'Submitting...' : 'Request for restock'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>

            {allItemsVerified && (
              <div className='p-6 bg-slate-900 border-t flex justify-between items-center'>
                <div>
                  <p className='text-white text-sm font-bold'>All products verified successfully</p>
                  <p className='text-slate-400 text-xs'>Ready for manager approval workflow</p>
                </div>
                <button
                  onClick={finalizeOrder}
                  disabled={loading}
                  className='bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg'
                >
                  {loading ? 'Submitting...' : 'Finalize & Submit'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // View 2: Individual item assessment interface view
  if (!isSelectingProduct && activeVerificationTask?.current_product) {
    return (
      <ProductVerification
        key={activeVerificationTask.current_product.product_id}
        product={activeVerificationTask.current_product}
        onBack={async () => {
          await refreshInspectionList(activeVerificationTask.id)
          setActiveVerificationTask(prev => ({
            ...prev,
            current_product: null
          }))
          setIsSelectingProduct(true)
          fetchData()
        }}
        onComplete={async () => {
          await refreshInspectionList(activeVerificationTask.id)
          setActiveVerificationTask(prev => ({
            ...prev,
            current_product: null
          }))
          setIsSelectingProduct(true)
          fetchData()
        }}
      />
    )
  }

  // View 3: Fulfillment Dashboard layout
  return (
    <div className='min-h-screen bg-[#f4f7f6] text-slate-800 p-6 font-sans'>
      <Toaster position='top-right' />
      <div className='flex justify-between items-end mb-8 border-b pb-4'>
        <div>
          <h1 className='text-3xl font-black text-slate-900 tracking-tight'>Staff Fulfillment Terminal</h1>
          <div className='text-xs text-slate-500 mt-1 flex items-center gap-2'>
            <FiClock size={12} /> Last Synced: {lastSynced}
          </div>
        </div>
        <div className='flex gap-4 items-center'>
          <input
            type='text'
            placeholder='Search Order...'
            className='px-4 py-2 rounded-lg border text-sm w-64'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <StatCard icon={<FiClock />} color='text-yellow-600 bg-yellow-50' label='Pending' value={stats.pending} />
        <StatCard icon={<FiPackage />} color='text-blue-600 bg-blue-50' label='Packing' value={stats.packing} />
        <StatCard icon={<FiCheckCircle />} color='text-emerald-600 bg-emerald-50' label='Packed' value={stats.packed} />
      </div>

      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-50 border-b'>
            <tr>
              <th className='p-4 text-left text-xs font-bold text-slate-500'>Order</th>
              <th className='p-4 text-left text-xs font-bold text-slate-500'>Deadline Date</th>
              <th className='p-4 text-center text-xs font-bold text-slate-500'>Priority</th>
              <th className='p-4 text-center text-xs font-bold text-slate-500'>Status</th>
              <th className='p-4 text-center text-xs font-bold text-slate-500'>Progress</th>
              <th className='p-4 text-right text-xs font-bold text-slate-500'>Action</th>
            </tr>
          </thead>
          <tbody>
            {(filteredTasks || []).map(task => (
              <tr key={task.id} className='border-b hover:bg-slate-50 transition'
  onClick={() => navigate(`/staff/order-review/${task.id}`)}>
                <td className='p-4'>
                  <p className='font-mono font-bold text-blue-700'>#{task.order_number}</p>
                  <p className='text-xs text-slate-400'>
                    {task.assigned_at?.split('T')[0]} {task.assigned_at?.split('T')[1]?.split('.')[0]}
                  </p>
                </td>
                <td className='p-4 font-semibold text-slate-700'>{task.deadline_date}</td>
                <td className='p-4 text-center'>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    task.priority === 'HIGH' ? 'bg-red-100 text-red-600' :
                    task.priority === 'MED' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className='p-4 text-center'>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    task.status === 'PENDING' ? 'bg-gray-100 text-gray-600' :
                    task.status === 'PACKING' ? 'bg-blue-100 text-blue-600' :
                    task.status === 'PACKED' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {task.status}
                  </span>
                  {task.status === 'PACKED' && task.approval_status === 'PENDING' && (
                    <p className='text-[10px] text-yellow-500 mt-1'>Waiting Approval</p>
                  )}
                </td>
                <td className='p-4'>
                  <div className='w-full bg-slate-200 h-2 rounded-full'>
                    <div className={`h-2 rounded-full ${
                      task.status === 'PENDING' ? 'w-[25%] bg-gray-400' :
                      task.status === 'PACKING' ? 'w-[50%] bg-blue-500' :
                      task.status === 'PACKED' ? 'w-[75%] bg-purple-500' : 'w-full bg-green-500'
                    }`} />
                  </div>
                </td>
                <td className='p-4 text-right'>
                  <div className='flex justify-end gap-2 flex-wrap'>
                    {task.verification_status === 'FAILED' && (
                      <button
                        onClick={(e) => {e.stopPropagation(); handleOpenVerification(task)}}
                        className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-black uppercase tracking-wide rounded-xl shadow-sm'
                      >
                        Resolve QC Failure
                      </button>
                    )}
                    {task.status === 'PENDING' && (
                      <button
                        onClick={(e) =>{e.stopPropagation(); updateStatus(task.id, 'PACKING')}}
                        className='px-4 py-2 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-wide rounded-xl shadow-sm'
                      >
                        Start Fulfillment
                      </button>
                    )}
                    {task.status === 'PACKING' && task.verification_status !== 'FAILED' && (
                      <button
                      
                        onClick={(e) => {e.stopPropagation(); handleOpenVerification(task)}}
                        className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wide rounded-xl shadow-sm'
                      >
                        Run QC Check
                      </button>
                    )}
                    {task.status === 'PACKED' && task.approval_status === 'PENDING' && (
                      <span className='inline-flex items-center px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest rounded-full'>
                        Awaiting Manager Approval
                      </span>
                    )}
                    
                    {/* ✅ ROUTING BUTTON TRIPPED BY EXACT ORDERASSIGNMENT PRIMARY KEY */}
                    {task.status === 'PACKED' && task.approval_status === 'APPROVED' && (
                      <button
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wide rounded-xl shadow-lg transition duration-200"
                      >
                        Review Order
                      </button>
                    )}

                    {task.status === 'PACKED' && task.approval_status === 'REJECTED' && (
                      <span className='px-4 py-2 bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-widest rounded-full'>
                        Rejected By Manager
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const StatCard = ({ icon, color, label, value }) => (
  <div className='bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5'>
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${color}`}>{icon}</div>
    <div>
      <p className='text-2xl font-black text-slate-900 leading-none'>{value}</p>
      <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>{label}</p>
    </div>
  </div>
)

export default StaffTaskTerminal