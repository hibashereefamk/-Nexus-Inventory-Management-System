import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  X,
  ShieldCheck,
  Package,
  Truck,
  AlertTriangle,
  Calendar,
  MapPin,
  Tag,
  User,
  ClipboardList,
  Info,
  Filter,
  Edit,
  History
} from 'lucide-react'

import { toast, Toaster } from 'react-hot-toast'

const ProductFormModal = ({
  isOpen,
  onClose,
  existingProduct,
  onSave,
  staffMembers,
  currentUser,
  categories,
  departments
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    category: '',
    department: '',
    status: 'IN_STOCK',
    priority: 'MEDIUM',
    total_stock: 0,
    min_stock_level: 10,
    reorder_level: 20,
    bin_location: '',
    assigned_staff: '',
    damage_notes: '',
    is_damaged: false,
    is_urgent: false,
    quantity_to_ship: 0,
    tracking_number: '',
    batch_number: '',
    expiry_date: '',
    warranty_expiry: '',
    assigned_at: '',
    shipped_date: ''
  })

  useEffect(() => {
    if (isOpen && existingProduct) {
      setFormData({
        ...existingProduct,

        expiry_date: existingProduct.expiry_date
          ? existingProduct.expiry_date.split('T')[0]
          : '',

        warranty_expiry: existingProduct.warranty_expiry
          ? existingProduct.warranty_expiry.split('T')[0]
          : ''
      })
    }
  }, [isOpen, existingProduct])

  if (!isOpen) return null

  const inputClass =
    'w-full border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5 border transition-all bg-white'
  const labelClass =
    'block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight flex items-center gap-1'
  const sectionTitle =
    'text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100'
  const handleSubmit = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      }

      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0.0
      }

      // FOOD department
      if (selectedDepartment?.slug === 'food') {
        payload.warranty_expiry = null

        // empty => null
        if (!payload.expiry_date) {
          payload.expiry_date = null
        }
      }

      // ELECTRONICS department
      else if (selectedDepartment?.slug === 'electronics') {
        payload.expiry_date = null

        // empty => null
        if (!payload.warranty_expiry) {
          payload.warranty_expiry = null
        }
      }

      // OTHER departments
      else {
        payload.expiry_date = null
        payload.warranty_expiry = null
      }

      console.log(payload)

      if (!existingProduct) {
        await axios.post(
          'http://127.0.0.1:8000/api/inventory/products/',
          payload,
          config
        )

        toast.success('Product created successfully')
      } else {
        await axios.patch(
          `http://127.0.0.1:8000/api/inventory/products/${existingProduct.id}/`,
          payload,
          config
        )

        toast.success('Product updated successfully')
      }

      onSave()
      onClose()
    } catch (err) {
      console.log(err.response?.data)

      const errors = err.response?.data

      Object.keys(errors || {}).forEach(field => {
        const message = errors[field][0]

        if (typeof message === 'string') {
          toast.error(message)
        }
      })
    }
  }
  const selectedDepartment = departments?.find(d => d.id == formData.department)
  return (
    <div className='fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[250] flex justify-center items-center p-4'>
      <div className='bg-[#f8fafc] rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh] overflow-hidden border border-white/20'>
        {/* Modern Header */}
        <div className='bg-white p-5 flex justify-between items-center border-b border-slate-200'>
          <div className='flex items-center gap-4'>
            <div className='bg-blue-600 p-2.5 rounded-lg text-white shadow-lg shadow-blue-200'>
              <Package size={22} />
            </div>
            <div>
              <h2 className='text-xl font-extrabold text-slate-900 leading-none'>
                {existingProduct ? 'Manage Asset' : 'Register New Asset'}
              </h2>
              <p className='text-xs text-slate-500 mt-1 font-medium italic'>
                Internal Database Record System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors'
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Form Body */}
        <div className='overflow-y-auto p-8 space-y-8'>
          {/* Row 1: Core Info & Status */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            <div className='lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
              <h4 className={sectionTitle}>
                <Info size={16} className='text-blue-500' /> Core Identification
              </h4>
              <div className='grid grid-cols-2 gap-4'>
                <div className='col-span-2'>
                  <label className={labelClass}>Product Display Name</label>
                  <input
                    className={inputClass}
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder='Enter asset name...'
                  />
                </div>
                <div>
                  <label className={labelClass}>Global SKU</label>
                  <input
                    className={`${inputClass} font-mono uppercase`}
                    value={formData.sku}
                    onChange={e =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder='SKU-000'
                  />
                </div>
                <div>
                  <label className={labelClass}>Price</label>
                  <input
                    type='number'
                    step='0.01'
                    className={`${inputClass} font-mono`}
                    value={formData.price}
                    onChange={e =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder='300.00'
                  />
                </div>
                <div>
                  <label className={labelClass}>Priority Level</label>
                  <select
                    className={inputClass}
                    value={formData.priority}
                    onChange={e =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value='LOW'>Low Priority</option>
                    <option value='MEDIUM'>Medium Priority</option>
                    <option value='HIGH'>High Priority</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Department</label>
                  <select
                    className={inputClass}
                    value={formData.department}
                    onChange={e =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                  >
                    {' '}
                    <option value=''>Select Department</option>
                    {departments?.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    className={inputClass}
                    value={formData.category}
                    onChange={e =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    {' '}
                    <option value=''>Select Category</option>
                    {categories?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4'>
              <h4 className={sectionTitle}>
                <Tag size={16} className='text-indigo-500' /> Asset Status
              </h4>
              <div>
                <label className={labelClass}>Current Status</label>
                <select
                  className={`${inputClass} appearance-none bg-white font-bold ${
                    formData.status === 'IN_STOCK'
                      ? 'text-green-600'
                      : formData.status === 'RESERVED'
                      ? 'text-blue-600'
                      : formData.status === 'DAMAGED'
                      ? 'text-red-600'
                      : formData.status === 'OUT_OF_STOCK'
                      ? 'text-orange-600'
                      : formData.status === 'LOW_STOCK'
                      ? 'text-yellow-600'
                      : 'text-slate-600'
                  }`}
                  value={formData.status}
                  onChange={e =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value='IN_STOCK'>In Stock</option>
                  <option value='RESERVED'>Reserved</option>
                  <option value='LOW_STOCK'>Low Stock</option>
                  <option value='DAMAGED'>Damaged / Repair</option>
                  <option value='DISCONTINUED'>Discontinued</option>
                </select>
              </div>
              <div className='pt-2 space-y-3'>
                <label className='flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors'>
                  <input
                    type='checkbox'
                    checked={formData.is_urgent}
                    onChange={e =>
                      setFormData({ ...formData, is_urgent: e.target.checked })
                    }
                    className='w-4 h-4 text-red-600 rounded focus:ring-red-500'
                  />
                  <span className='text-xs font-bold text-red-700 uppercase tracking-wider'>
                    Mark as Urgent
                  </span>
                </label>
                <label className='flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors'>
                  <input
                    type='checkbox'
                    checked={formData.is_damaged}
                    onChange={e =>
                      setFormData({ ...formData, is_damaged: e.target.checked })
                    }
                    className='w-4 h-4 text-amber-600 rounded focus:ring-amber-500'
                  />
                  <span className='text-xs font-bold text-amber-700 uppercase tracking-wider'>
                    Report Damage
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Row 2: Inventory & Logistics */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
              <h4 className={sectionTitle}>
                <ClipboardList size={16} className='text-emerald-500' /> Stock
                Control
              </h4>
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <label className={labelClass}>Total Stock</label>
                  <input
                    type='number'
                    className={inputClass}
                    value={formData.total_stock}
                    onChange={e =>
                      setFormData({ ...formData, total_stock: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Min Level</label>
                  <input
                    type='number'
                    className={inputClass}
                    value={formData.min_stock_level}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        min_stock_level: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Reorder Level</label>
                  <input
                    type='number'
                    className={inputClass}
                    value={formData.reorder_level}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        reorder_level: e.target.value
                      })
                    }
                  />
                </div>
              </div>
              <div className='mt-4'>
                <label className={labelClass}>Damage Report Notes</label>
                <textarea
                  className={`${inputClass} h-24 resize-none`}
                  placeholder='Describe issues if marked as damaged...'
                  value={formData.damage_notes}
                  onChange={e =>
                    setFormData({ ...formData, damage_notes: e.target.value })
                  }
                />
              </div>
            </div>

            <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
              <h4 className={sectionTitle}>
                <MapPin size={16} className='text-orange-500' /> Logistics &
                Location
              </h4>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className={labelClass}>Warehouse Bin</label>
                  <input
                    className={inputClass}
                    value={formData.bin_location}
                    onChange={e =>
                      setFormData({ ...formData, bin_location: e.target.value })
                    }
                    placeholder='e.g. AISLE-2-B'
                  />
                </div>
                <div>
                  <label className={labelClass}>Batch Number</label>
                  <input
                    className={inputClass}
                    value={formData.batch_number}
                    onChange={e =>
                      setFormData({ ...formData, batch_number: e.target.value })
                    }
                  />
                </div>
                <div className='col-span-2'>
                  <label className={labelClass}>Assigned Staff Custodian</label>
                  <select
                    className={inputClass}
                    value={formData.assigned_staff}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        assigned_staff: e.target.value
                      })
                    }
                  >
                    <option value=''>No Staff Assigned</option>
                    {staffMembers?.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
            <h4 className={sectionTitle}>
              <Calendar size={16} className='text-purple-500' />
              Timeline & Deadlines
            </h4>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {selectedDepartment?.slug === 'food' && (
                <div>
                  <label className={labelClass}>Expiry Date</label>

                  <input
                    type='date'
                    className={inputClass}
                    value={formData.expiry_date || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        expiry_date: e.target.value
                      })
                    }
                  />
                </div>
              )}

              {selectedDepartment?.slug === 'electronics' && (
                <div>
                  <label className={labelClass}>Warranty Expiry</label>

                  <input
                    type='date'
                    className={inputClass}
                    value={formData.warranty_expiry || ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        warranty_expiry: e.target.value
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className='p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center'>
          <div className='text-xs text-slate-400 flex items-center gap-2'>
            <ShieldCheck size={14} />
            Session Active: {currentUser?.username || 'System Admin'}
          </div>
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all uppercase tracking-wider'
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              className='px-10 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2 transform active:scale-95 transition-all uppercase tracking-wider'
            >
              <ShieldCheck size={18} /> Commit Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
const ProductList = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])

  const fetchData = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      }

      const [userRes, prodRes, catRes, deptRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/profile/', config),

        axios.get('http://127.0.0.1:8000/api/inventory/products/', config),

        axios.get('http://127.0.0.1:8000/api/orders/categories/', config),

        axios.get('http://127.0.0.1:8000/api/orders/departments/', config)
      ])

      setUser(userRes.data)

      setProducts(prodRes.data)

      setCategories(catRes.data)

      setDepartments(deptRes.data)
    } catch (err) {
      console.error('Sync Failed', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading)
    return (
      <div className='h-screen flex items-center justify-center font-mono text-[#417690] animate-pulse'>
        SYSTEM_INITIALIZING...
      </div>
    )

  return (
    <div className='bg-[#f4f7f9] min-h-screen font-sans text-slate-900'>
      <Toaster position='top-right' />
      <div className='bg-[#2c3e50] text-white p-2 flex justify-between items-center text-xs px-6'>
        <div className='flex gap-4'>
          <span className='opacity-70'>NEXUS ENTERPRISE v2.1</span>
          <span className='border-l border-white/20 pl-4'>
            Branch: Main Warehouse
          </span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
          System Online: {user?.username}
        </div>
      </div>

      <div className='p-6'>
        <header className='mb-6 flex justify-between items-center'>
          <div>
            <h1 className='text-2xl font-bold text-slate-800'>
              Inventory Master Records
            </h1>
            <p className='text-sm text-slate-500'>
              Manage stock levels, valuations, and warehouse movements.
            </p>
          </div>
          <div className='flex gap-2'>
            <button
              onClick={() => {
                setSelectedProduct(null)
                setIsFormOpen(true)
              }}
              className='flex items-center gap-2 bg-[#417690] text-white px-4 py-2 rounded text-sm font-semibold hover:bg-[#345e73] shadow-sm'
            >
              <Package size={16} /> Add New SKU
            </button>
          </div>
        </header>

        {/* Main Data Grid */}
        <div className='bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden'>
          <table className='w-full text-left border-collapse'>
            <thead>
              <tr className='bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-600'>
                <th className='p-4 font-bold'>Primary Data (SKU/Name)</th>
                <th className='p-4 font-bold'>Logistics</th>
                <th className='p-4 font-bold'>Stock Status</th>
                <th className='p-4 font-bold text-right'>Financials (USD)</th>
                <th className='p-4 font-bold'>Audit/Deadline</th>
                <th className='p-4 font-bold text-center'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {products.map(product => (
                <tr
                  key={product.id}
                  className='hover:bg-blue-50/50 transition-colors group'
                >
                  {/* Primary Data */}
                  <td className='p-4'>
                    <div className='font-mono text-[11px] text-indigo-600 font-bold'>
                      {product.sku || 'NO-SKU'}
                    </div>
                    <div className='font-bold text-slate-800'>
                      {product.name}
                    </div>
                    <div className='text-[10px] text-slate-400 uppercase'>
                      {product.category_name}
                    </div>
                  </td>

                  {/* Logistics */}
                  <td className='p-4'>
                    <div className='flex items-center gap-1.5 text-sm text-slate-600'>
                      <MapPin size={14} className='text-slate-400' />
                      {product.bin_location || 'Aisle 1-A'}
                    </div>
                    <div className='text-[10px] mt-1 flex gap-2'>
                      <span className='bg-slate-100 px-1 rounded text-slate-500'>
                        Batch: {product.batch_number || 'N/A'}
                      </span>
                    </div>
                  </td>

                  {/* Stock Status */}
                  <td className='p-4'>
                    <div className='flex items-center gap-4'>
                      <div>
                        <div className='text-lg font-mono font-bold leading-none'>
                          {product.total_stock}
                        </div>
                        <div className='text-[10px] text-slate-400 uppercase'>
                          On Hand
                        </div>
                      </div>
                      {product.total_stock <= product.min_stock_level && (
                        <div className='bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1'>
                          <AlertTriangle size={10} /> REORDER
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Financials */}
                  <td className='p-4 text-right'>
                    <div className='text-sm font-bold text-slate-700'>
                      ${product.price * product.total_stock}
                    </div>
                    <div className='text-[10px] text-slate-400 uppercase underline decoration-dotted'>
                      Total Valuation
                    </div>
                  </td>

                  {/* Audit/Deadline */}
                  <td className='p-4 text-sm'>
                    <div
                      className={`font-mono ${
                        product.is_overdue
                          ? 'text-red-600 font-bold'
                          : 'text-slate-600'
                      }`}
                    >
                      {product.manager_deadline || '---'}
                    </div>
                    <div className='text-[10px] text-slate-400 uppercase'>
                      Stock Review Date
                    </div>
                  </td>

                  {/* Actions */}
                  <td className='p-4 text-center'>
                    <div className='flex justify-center gap-1'>
                      <button
                        title='View Ledger'
                        className='p-1.5 hover:bg-white border border-transparent hover:border-slate-200 rounded text-slate-400 hover:text-indigo-600'
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setIsFormOpen(true)
                        }}
                        className='p-1.5 hover:bg-white border border-transparent hover:border-slate-200 rounded text-slate-400 hover:text-blue-600'
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Footer / Pagination */}
          <div className='bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center text-[11px] font-bold text-slate-500'>
            <div>SHOWING {products.length} ENTRIES</div>
            <div className='flex gap-4 uppercase'>
              <span>
                Total Inventory Value:{' '}
                <span className='text-slate-800 ml-1'>$142,500.00</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        existingProduct={selectedProduct}
        onSave={fetchData}
        categories={categories}
        departments={departments}
        currentUser={user}
      />
    </div>
  )
}

export default ProductList
