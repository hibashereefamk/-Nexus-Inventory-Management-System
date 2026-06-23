import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  FiCoffee,
  FiTruck,
  FiTv,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiShield,
  FiInfo
} from 'react-icons/fi'

const API = 'http://127.0.0.1:8000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return { headers: { Authorization: `Bearer ${token}` } }
}

const ProductVerification = ({ product, onComplete, onBack }) => {
  const [loading, setLoading] = useState(false)
  const [activeType, setActiveType] = useState('food')
  const [formData, setFormData] = useState({
    is_passed: true,
    comments: '',
    batch_lot: product.batch_number || '',
    temp_chain_ok: false,
    packaging_sealed: false,
    fssai_verified: false,
    structural_ok: false,
    finish_no_scratches: false,
    parts_complete: false,
    unique_serial_number: '',
    boot_test_passed: false,
    ports_physical_ok: false,
    firmware_version: '',
    quantity_reconciled: false,
    ink_lead_test_passed: false,
    paper_not_damaged: false
  })

  const isPastDate = dateString => {
    if (!dateString) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateString) < today
  }

  useEffect(() => {
    setFormData({
      is_passed: true,
      comments: '',
      batch_lot: product.batch_number || '',
      temp_chain_ok: false,
      packaging_sealed: false,
      fssai_verified: false,
      structural_ok: false,
      finish_no_scratches: false,
      parts_complete: false,
      unique_serial_number: '',
      boot_test_passed: false,
      ports_physical_ok: false,
      firmware_version: '',
      quantity_reconciled: false,
      ink_lead_test_passed: false,
      paper_not_damaged: false
    })
  }, [product.product_id, product.id])

  useEffect(() => {
    if (product.department_name) {
      const dept = product.department_name.toLowerCase()
      if (dept.includes('food')) setActiveType('food')
      else if (dept.includes('elect')) setActiveType('electronics')
      else if (dept.includes('furn')) setActiveType('furniture')
      else if (dept.includes('stat')) setActiveType('stationery')
    }
  }, [product.department_name])

  useEffect(() => {
    let passed = true
    if (activeType === 'food') {
      passed =
        formData.temp_chain_ok &&
        formData.packaging_sealed &&
        formData.fssai_verified &&
        !isPastDate(product.expiry_date)
    } else if (activeType === 'electronics') {
      passed =
        formData.boot_test_passed &&
        formData.ports_physical_ok &&
        !isPastDate(product.warranty_expiry)
    } else if (activeType === 'furniture') {
      passed =
        formData.structural_ok &&
        formData.finish_no_scratches &&
        formData.parts_complete
    } else if (activeType === 'stationery') {
      passed =
        formData.quantity_reconciled &&
        formData.ink_lead_test_passed &&
        formData.paper_not_damaged
    }
    setFormData(prev => ({ ...prev, is_passed: passed }))
  }, [
    formData.temp_chain_ok,
    formData.packaging_sealed,
    formData.fssai_verified,
    formData.structural_ok,
    formData.finish_no_scratches,
    formData.parts_complete,
    formData.boot_test_passed,
    formData.ports_physical_ok,
    formData.quantity_reconciled,
    formData.ink_lead_test_passed,
    formData.paper_not_damaged,
    activeType,
    product.expiry_date,
    product.warranty_expiry
  ])

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async () => {
    if (!product) return
    if (loading) return

    setLoading(true)
    try {
      const pId = product.product_id || product.id
      const taskId = product.task_id
      const config = getAuthHeaders()

      if (!taskId) throw new Error('Task ID missing.')

      // 1. Log detailed metrics into history
      await axios.post(
        `${API}/api/inventory/verify-products/`,
        {
          product: pId,
          assignment_id: taskId,
          active_type: activeType,
          ...formData
        },
        config
      )

      // 2. Synchronize with StaffTaskInspectView backend atomic logic rules
      await axios.patch(
        `${API}/api/orders/staff/tasks/${taskId}/inspect/`,
        {
          is_passed: formData.is_passed,
          comments:
            formData.comments ||
            (formData.is_passed
              ? 'Passed verification check.'
              : 'Failed QC specifications.')
        },
        config
      )

     // Inside VerificationMode.jsx -> handleSubmit()
toast.success(`${product.name} ERP Check Complete!`);

if (onComplete) {
  onComplete(); // Syncs layout and resets active status tags
} else {
  onBack();
}
    } catch (err) {
      toast.error(
        err.response?.data?.detail || 'ERP Processing Pipeline Failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-slate-50 p-4 md:p-8 text-slate-700'>
      <div className='max-w-6xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden'>
        {/* Header */}
        <div className='p-6 border-b border-slate-100 flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-slate-900'>
              System Gateway: Quality Gate
            </h1>
            <p className='text-sm text-slate-500 font-mono'>
              Order Ref: #{product.order_number}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-xs text-slate-500 font-mono'>
              SKU: {product.sku}
            </p>
            <p className='text-xs text-slate-500'>
              Warehouse Allocation: {product.total_stock}
            </p>
          </div>
        </div>

        <div className='p-8 space-y-8'>
          {activeType === 'food' && isPastDate(product.expiry_date) && (
            <div className='p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center gap-3'>
              <FiCalendar className='text-2xl' />
              <div>
                <p className='font-bold'>
                  SYSTEM CRITICAL: EXPIRED SPECIFICATION
                </p>
                <p className='text-sm'>
                  Batch lifecycle expired on {product.expiry_date}. Hard
                  rejection enforced.
                </p>
              </div>
            </div>
          )}

          {/* Metadata Section */}
          <section>
            <h2 className='text-lg font-bold mb-4 text-slate-900'>
              Line Item Manifest
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-1'>
                <label className='text-xs font-bold text-slate-500 uppercase'>
                  Product Designation
                </label>
                <input
                  type='text'
                  readOnly
                  value={product.name}
                  className='w-full p-2.5 bg-slate-100 border rounded-md text-sm outline-none font-medium'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-bold text-slate-500 uppercase'>
                  Control Area
                </label>
                <input
                  type='text'
                  readOnly
                  value={product.department_name || 'General'}
                  className='w-full p-2.5 bg-slate-100 border rounded-md text-sm outline-none font-medium'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs font-bold text-slate-500 uppercase'>
                  Batch Assignment *
                </label>
                <input
                  name='batch_lot'
                  value={formData.batch_lot}
                  onChange={handleInputChange}
                  className='w-full p-2.5 border rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none'
                />
              </div>
            </div>
          </section>

          {/* Checklist Form Fields */}
          <section className='bg-slate-50 p-6 rounded-lg border border-slate-200'>
            <h2 className='text-slate-800 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide'>
              <FiInfo /> Parameter Validation Check ({activeType})
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {activeType === 'food' && (
                <>
                  <CheckboxCard
                    label='Temp Chain Compliance'
                    name='temp_chain_ok'
                    checked={formData.temp_chain_ok}
                    onChange={handleInputChange}
                  />
                  <CheckboxCard
                    label='Hermetic Packaging Intact'
                    name='packaging_sealed'
                    checked={formData.packaging_sealed}
                    onChange={handleInputChange}
                  />
                  <CheckboxCard
                    label='FSSAI Code Clear'
                    name='fssai_verified'
                    checked={formData.fssai_verified}
                    onChange={handleInputChange}
                  />
                </>
              )}
              {activeType === 'electronics' && (
                <>
                  <CheckboxCard
                    label='Cold Boot Sequence OK'
                    name='boot_test_passed'
                    checked={formData.boot_test_passed}
                    onChange={handleInputChange}
                  />
                  <CheckboxCard
                    label='I/O Ports Physical Clearance'
                    name='ports_physical_ok'
                    checked={formData.ports_physical_ok}
                    onChange={handleInputChange}
                  />
                  <div className='space-y-1'>
                    <label className='text-[10px] font-bold uppercase text-slate-500'>
                      Firmware Build Revision
                    </label>
                    <input
                      name='firmware_version'
                      value={formData.firmware_version}
                      onChange={handleInputChange}
                      className='w-full p-2 border rounded-md text-xs font-mono'
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Decision Status Box */}
          <section className='pt-6 border-t'>
            <div
              className={`p-4 rounded-lg flex items-center justify-between ${
                formData.is_passed
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-rose-50 border border-rose-200'
              }`}
            >
              <div className='flex items-center gap-3'>
                {formData.is_passed ? (
                  <FiCheckCircle className='text-emerald-600 text-2xl' />
                ) : (
                  <FiXCircle className='text-rose-600 text-2xl' />
                )}
                <div>
                  <p
                    className={`font-bold ${
                      formData.is_passed ? 'text-emerald-800' : 'text-rose-800'
                    }`}
                  >
                    {formData.is_passed
                      ? 'PASSED QUALITY PROFILE'
                      : 'QUARANTINE REQUIRED'}
                  </p>
                  <p className='text-[10px] font-mono text-slate-500 tracking-wider'>
                    ROUTING CODE:{' '}
                    {formData.is_passed ? 'RELEASE' : 'REJECT_DAMAGED'}
                  </p>
                </div>
              </div>
            </div>

            {!formData.is_passed && (
              <div className='mt-4'>
                <label className='text-xs font-bold text-rose-600 uppercase tracking-wider'>
                  NCR System Discrepancy Remarks *
                </label>
                <textarea
                  name='comments'
                  value={formData.comments}
                  onChange={handleInputChange}
                  className='w-full mt-1 p-3 border border-rose-200 rounded-md text-sm h-24 font-mono outline-none focus:ring-2 focus:ring-rose-500'
                  placeholder={
                    isPastDate(product.expiry_date)
                      ? 'CRITICAL EVALUATION: BATCH EXPIRED'
                      : 'Provide granular structural fault data...'
                  }
                />
              </div>
            )}
          </section>

          {/* Action Footer */}
          <div className='flex justify-end gap-3 pt-6 border-t'>
            <button
              onClick={onBack}
              className='px-6 py-2 border rounded-md font-bold text-xs text-slate-500 hover:bg-slate-50 uppercase tracking-wider'
            >
              Abort
            </button>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className={`px-8 py-2 text-white rounded-md font-black text-xs tracking-wider uppercase shadow-md transition-all ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : formData.is_passed
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading ? 'TRANSACTING ERP...' : 'COMMIT AUDIT RECORD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CheckboxCard = ({ label, name, checked, onChange }) => (
  <label
    className={`flex items-center justify-between gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
      checked
        ? 'bg-emerald-50/50 border-emerald-400 shadow-sm'
        : 'bg-white border-slate-200 hover:border-slate-300'
    }`}
  >
    <span
      className={`text-xs font-bold ${
        checked ? 'text-emerald-800' : 'text-slate-600'
      }`}
    >
      {label}
    </span>
    <input
      type='checkbox'
      name={name}
      checked={checked}
      onChange={onChange}
      className='w-4 h-4 accent-emerald-600 rounded'
    />
  </label>
)

export default ProductVerification
