import React, { useEffect, useState } from 'react'

import { useParams, useNavigate } from 'react-router-dom'

import axios from 'axios'

import { toast } from 'react-hot-toast'

import {
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiAlertTriangle
} from 'react-icons/fi'

const API = 'http://127.0.0.1:8000'

const ManagerOrderReview = () => {
  const { taskId } = useParams()

  const navigate = useNavigate()

  const [task, setTask] = useState(null)

  const [verification, setVerification] = useState(null)

  const [remarks, setRemarks] = useState('')

  const [loading, setLoading] = useState(true)

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
  })

  useEffect(() => {
    // 1. Guard clause: Don't fetch if taskId is missing

    if (!taskId || taskId === 'undefined') {
      console.error('Task ID is missing from URL')

      return
    }

    // Safer extraction in ManagerOrderReview
const loadData = async () => {
  try {
    setLoading(true);
    const taskRes = await axios.get(`${API}/api/orders/manager/approve-order/${taskId}/`, getAuthHeaders());
    setTask(taskRes.data);

    // Look for product ID in the nested order object
    const pId = taskRes.data.order?.product || taskRes.data.product_id;
    
    if (pId) {
      const historyRes = await axios.get(`${API}/api/inventory/verify-products/history/${pId}/`, getAuthHeaders());
      setVerification(historyRes.data[0]); 
    }
  } catch (err) {
    // If it's a 404, this toast will trigger
    toast.error("Order Assignment not found in database.");
  }
 finally {
        setLoading(false)
      }
    }

    loadData()
  }, [taskId])

  const handleDecision = async decision => {
    try {
      await axios.patch(
        `${API}/api/orders/manager/approve-order/${taskId}/`,
        {
          decision: decision, // 'APPROVED' or 'REJECTED'

          remarks: remarks
        },
        getAuthHeaders()
      )

      toast.success(`Order ${decision.toLowerCase()} successfully`)

      navigate('/manager/tasks') // Go back to list
    } catch (err) {
      toast.error('Error submitting decision')
    }
  }

  if (loading)
    return <div className='p-10 text-center'>Loading Audit Data...</div>

  return (
    <div className='p-8 max-w-4xl mx-auto space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold'>
          Audit Review: #{task.order_number}
        </h1>

        <span
          className={`px-4 py-1 rounded-full text-sm font-bold ${
            verification?.is_passed
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {verification?.is_passed
            ? 'VERIFICATION PASSED'
            : 'VERIFICATION FAILED'}
        </span>
      </div>

      {/* 1. Checklist Audit */}

      <div className='bg-white p-6 rounded-xl border shadow-sm'>
        <h2 className='text-sm font-black text-gray-400 uppercase mb-4'>
          QC Checklist Results
        </h2>

        <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
          {verification &&
            Object.entries(verification).map(([key, value]) => {
              if (typeof value === 'boolean' && key !== 'is_passed') {
                return (
                  <div
                    key={key}
                    className='flex items-center gap-2 p-2 border rounded'
                  >
                    {value ? (
                      <FiCheckCircle className='text-green-500' />
                    ) : (
                      <FiXCircle className='text-red-500' />
                    )}

                    <span className='text-xs font-bold text-gray-700'>
                      {key.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                )
              }

              return null
            })}
        </div>
      </div>

      {/* 2. Staff Comments / Issue Report */}

      {!verification?.is_passed && (
        <div className='bg-red-50 p-6 rounded-xl border border-red-200'>
          <h2 className='text-red-800 font-bold flex items-center gap-2 mb-2'>
            <FiAlertTriangle /> Damage Report Details
          </h2>

          <p className='text-sm text-red-900 bg-white p-3 rounded border border-red-100 italic'>
            "{verification?.comments || 'No comments provided by staff.'}"
          </p>
        </div>
      )}

      {/* 3. Decision Controls */}

      <div className='bg-slate-900 p-6 rounded-xl text-white'>
        <label className='block text-xs font-bold mb-2 uppercase text-slate-400'>
          Manager's Decision Remarks
        </label>

        <textarea
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          className='w-full bg-slate-800 border border-slate-700 rounded p-3 text-sm mb-4 outline-none focus:ring-1 focus:ring-indigo-500'
          placeholder='Add instructions for staff or admin...'
        />

        <div className='flex gap-3'>
          {verification?.is_passed ? (
            <button
              onClick={() => handleDecision('APPROVED')}
              className='flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2'
            >
              <FiTruck /> APPROVE & SHIP PRODUCT
            </button>
          ) : (
            <>
              <button
                onClick={() => handleDecision('REJECTED')}
                className='flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold'
              >
                REJECT & REQUIRE REWORK
              </button>

              <button
                className='flex-1 bg-amber-600 hover:bg-amber-700 py-3 rounded-lg font-bold'
                onClick={() => toast('Escalated to Admin (Logic needed)')}
              >
                ESCALATE TO ADMIN
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManagerOrderReview
