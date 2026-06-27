import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  X, ShieldCheck, Package, Truck, AlertTriangle, Calendar,
  MapPin, Tag, User, ClipboardList, Info, Filter, Edit, History, Plus
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

const API = 'http://127.0.0.1:8000'

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return { headers: { Authorization: `Bearer ${token}` } }
}

const OperationsView = ({ userRole }) => {
  const storedRole = localStorage.getItem('role') || ''
  const currentRole = (userRole || storedRole).toLowerCase()
  const isAdmin = currentRole === 'admin'

  const [activeTab, setActiveTab] = useState('all-orders')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [departments, setDepartments] = useState([])
  const [customers, setCustomers] = useState([]) // ⭐ പുതിയ കസ്റ്റമർ സ്റ്റേറ്റ്

  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false) // ⭐ കസ്റ്റമർ ഫോം മോഡൽ കൺട്രോൾ

  // ⭐ റിയൽ ERP കസ്റ്റമർ ഫോം ഡാറ്റാ ഘടന
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    shipping_address: '',
    tax_number: ''
  })

  const [newOrder, setNewOrder] = useState({
    customer: '', // ⭐ കസ്റ്റമർ ലിങ്ക് ചെയ്യാൻ പുതിയ ഫീൽഡ്
    items: [{ product: '', quantity: 1 }],
    target_department: ''
  })

  const addItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product: '', quantity: 1 }]
    })
  }

  const removeItem = index => {
    const updated = newOrder.items.filter((_, i) => i !== index)
    setNewOrder({ ...newOrder, items: updated })
  }

  const updateItem = (index, field, value) => {
    const updated = [...newOrder.items]
    updated[index][field] = value
    setNewOrder({ ...newOrder, items: updated })
  }

  // FETCH DATA FROM BACKEND
  const fetchOrders = async () => {
    const res = await axios.get(`${API}/api/orders/admin/orders/`, getAuthHeaders())
    setOrders(res.data.results || res.data)
  }

  const fetchDropdownData = async () => {
    const [p, d, c] = await Promise.all([
      axios.get(`${API}/api/orders/products-short/`, getAuthHeaders()),
      axios.get(`${API}/api/orders/departments/`, getAuthHeaders()),
      axios.get(`${API}/api/orders/customers/`, getAuthHeaders()) // ⭐ കസ്റ്റമർമാരെ ഫെച്ച് ചെയ്യുന്നു
    ])
    setProducts(p.data.results || p.data)
    setDepartments(d.data.results || d.data)
    setCustomers(c.data.results || c.data)
  }

  useEffect(() => {
    fetchOrders()
    if (isAdmin) fetchDropdownData()
  }, [])

  const handleCreateCustomer = async e => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API}/api/orders/customers/`, customerForm, getAuthHeaders())
      toast.success('Customer registered successfully in ERP system!')
      
      const c = await axios.get(`${API}/api/orders/customers/`, getAuthHeaders())
      setCustomers(c.data.results || c.data)
      setNewOrder({ ...newOrder, customer: res.data.id })
      
      setShowCustomerModal(false)
      setCustomerForm({ name: '', email: '', phone: '', shipping_address: '', tax_number: '' })
    } catch (err) {
      toast.error('Failed to create customer. Verify details.')
    }
  }

  const handleCreateOrder = async e => {
    e.preventDefault()
    if (!newOrder.customer) {
      toast.error('Please select a Customer before submitting.')
      return
    }

    try {
      const res = await axios.post(`${API}/api/orders/admin/orders/`, newOrder, getAuthHeaders())
      setNewOrder({
        customer: '',
        items: [{ product: '', quantity: 1 }],
        target_department: ''
      })
      setActiveTab('all-orders')
      fetchOrders()
      toast.success('Order drafted successfully!')
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Check stock levels before submitting.'
      toast.error(`Order Error: ${errMsg}`)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast('Please provide a rejection reason.')
      return
    }
    try {
      const res = await axios.post(`${API}/api/orders/admin/orders/${rejectModal}/reject/`, { rejection_reason: rejectReason }, getAuthHeaders())
      setRejectModal(null)
      setRejectReason('')
      fetchOrders()
      toast.success(res.data.message)
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Rejection failed'
      toast.error(`Error: ${errMsg}`)
    }
  }

  const updateStatus = async (order_number, action) => {
    try {
      const res = await axios.post(`${API}/api/orders/admin/orders/${order_number}/${action}/`, {}, getAuthHeaders())
      fetchOrders()
      alert(res.data.message)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed')
    }
  }

  const getStatusStyle = status => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-600'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-600'
      case 'REJECTED': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100'
    }
  }

  const getStockInfo = (productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    return product ? product.total_stock - product.committed_stock : 0
  }

  return (
    <div className='bg-slate-100 min-h-screen p-6 font-sans'>
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-slate-800'>Warehouse Operations</h1>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('create')}
            className='bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow font-medium transition-all text-sm'
          >
            + New Order
          </button>
        )}
      </div>

      {/* TABS */}
      <div className='flex gap-6 border-b mb-6'>
        {['all-orders', 'pending'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold text-sm transition-all ${
              activeTab === tab ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-400'
            }`}
          >
            {tab === 'all-orders' ? 'All Orders' : 'Pending'}
          </button>
        ))}
      </div>

      {/* CREATE ORDER TAB */}
      {activeTab === 'create' && (
        <div className='bg-white p-6 rounded-xl shadow-md max-w-xl border border-slate-200'>
          <h2 className='font-bold mb-4 text-lg text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100'>
            <ClipboardList size={18} className="text-indigo-600" /> Create System Order
          </h2>

          <form onSubmit={handleCreateOrder} className='space-y-5'>
            {/* ⭐ CUSTOMER CONFIGURATION SECTION */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Account Client / Customer</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border p-2.5 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={newOrder.customer}
                  onChange={e => setNewOrder({ ...newOrder, customer: e.target.value })}
                >
                  <option value="">Select Existing Customer Profile</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.tax_number || 'No Tax Card'})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(true)}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold px-3 py-2 rounded-md text-xs flex items-center gap-1 transition-all"
                >
                  <Plus size={14} /> New Client
                </button>
              </div>
            </div>

            {/* PRODUCT ITEMS ROWS */}
            {newOrder.items.map((item, index) => (
              <div key={index} className='flex flex-col gap-1 mb-4 p-3 bg-indigo-50/40 rounded-lg border-l-4 border-indigo-500'>
                <div className='flex gap-2 items-center'>
                  <select
                    className='flex-1 border p-2.5 rounded-md text-sm bg-white'
                    value={item.product}
                    onChange={e => updateItem(index, 'product', e.target.value)}
                  >
                    <option value=''>Select Inventory Stock Item</option>
                    {products.map(p => {
                      const available = p.total_stock - p.committed_stock
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} | Available Pool: {available}
                        </option>
                      )
                    })}
                  </select>

                  <div className="relative">
                    <input
                      type='number'
                      min='1'
                      className={`w-24 border p-2.5 rounded-md text-sm bg-white ${
                        item.product && item.quantity > getStockInfo(item.product) ? 'border-red-500 bg-red-50 animate-pulse' : ''
                      }`}
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                    {item.product && item.quantity > getStockInfo(item.product) && (
                      <span className="text-[10px] text-red-600 font-bold absolute -bottom-4 left-0 whitespace-nowrap">
                        ⚠️ Max Allocated: {getStockInfo(item.product)}
                      </span>
                    )}
                  </div>

                  <button
                    type='button'
                    onClick={() => removeItem(index)}
                    className='bg-red-500 hover:bg-red-600 text-white px-3 py-2.5 rounded-md text-sm transition-colors'
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            <button
              type='button'
              onClick={addItem}
              className='bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md font-medium text-xs transition-colors'
            >
              + Add Another Line Item
            </button>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Distribution Department</label>
              <select
                className='w-full border p-2.5 rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500'
                value={newOrder.target_department}
                onChange={e => setNewOrder({ ...newOrder, target_department: e.target.value })}
              >
                <option value=''>Select Target Logistics Department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <button 
              disabled={newOrder.items.some(item => item.product && item.quantity > getStockInfo(item.product))}
              className={`w-full py-2.5 rounded-md font-bold transition-all text-sm tracking-wide ${
                newOrder.items.some(item => item.product && item.quantity > getStockInfo(item.product))
                ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              }`}
            >
              Submit Order Request Pipeline
            </button>
          </form>
        </div>
      )}

      {/* ORDERS LIST DATA TABLE */}
      {activeTab !== 'create' && (
        <div className='bg-white rounded-xl shadow overflow-hidden border border-slate-200'>
          <table className='w-full text-left border-collapse'>
            <thead className='bg-slate-50 text-xs font-bold text-gray-500 uppercase border-b border-slate-100'>
              <tr>
                <th className='p-4'>Order Context</th>
                <th className='p-4'>Client Profile</th> {/* ⭐ പുതിയ കോളം */}
                <th className='p-4'>Products Spec Pool</th>
                <th className='p-4'>Total Volume</th>
                <th className='p-4'>Workflow State</th>
                <th className='p-4 text-right'>Action Layer</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter(o => activeTab === 'pending' ? o.status === 'DRAFT' : true)
                .map(order => (
                  <tr key={order.order_number} className='border-t border-slate-100 hover:bg-slate-50/80 transition-colors'>
                    <td className='p-4 font-mono text-sm font-bold text-slate-700'>{order.order_number}</td>
                    <td className='p-4 text-sm text-slate-600 font-medium'>
                      {order.customer_details?.name || 'Walk-in Client / None'}
                    </td>
                    <td className='p-4'>
                      <div className='space-y-1'>
                        {order.products?.map((p, i) => (
                          <div key={i} className='text-xs text-gray-700 font-medium'>
                            • {p.name} <span className='text-indigo-600 font-bold'>(x{p.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className='p-4 text-sm font-bold text-slate-600'>
                      {order.products?.reduce((total, p) => total + p.quantity, 0)} Units
                    </td>
                    <td className='p-4'>
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className='p-4 text-right'>
                      {order.status === 'DRAFT' && isAdmin && (
                        <div className='flex justify-end gap-2'>
                          <button
                            onClick={() => updateStatus(order.order_number, 'confirm')}
                            className='bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors'
                          >
                            Confirm Dispatch
                          </button>
                          <button
                            onClick={() => setRejectModal(order.order_number)}
                            className='bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors'
                          >
                            Reject System
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className='p-10 text-center text-gray-400 font-medium italic text-sm'>No live distribution invoices managed.</div>}
        </div>
      )}

      {/* ⭐ REAL ERP CUSTOMER REGISTRATION MODAL */}
      {showCustomerModal && (
        <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4'>
          <div className='bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden'>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className='font-extrabold text-slate-800 flex items-center gap-2 text-md'>
                <User size={18} className="text-indigo-600" /> Client Profile KYC Registry
              </h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Company / Full Name</label>
                <input
                  type="text" required className="w-full border p-2 text-sm rounded bg-slate-50 focus:bg-white" placeholder="Client Enterprise Corp"
                  value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Corporate Email</label>
                  <input
                    type="email" required className="w-full border p-2 text-sm rounded bg-slate-50 focus:bg-white" placeholder="billing@client.com"
                    value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Commercial Hotline</label>
                  <input
                    type="text" required className="w-full border p-2 text-sm rounded bg-slate-50 focus:bg-white" placeholder="+91 9845012345"
                    value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Tax Registration Identification Card (GSTIN/TIN)</label>
                <input
                  type="text" className="w-full border p-2 text-sm rounded font-mono uppercase bg-slate-50 focus:bg-white" placeholder="32AAAAA0000A1Z5"
                  value={customerForm.tax_number} onChange={e => setCustomerForm({ ...customerForm, tax_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Legal Shipping / Delivery Headquarters Address</label>
                <textarea
                  required rows="3" className="w-full border p-2 text-sm rounded bg-slate-50 focus:bg-white" placeholder="Plot No. 45, Cyber Park Area, Calicut, Kerala, 673016"
                  value={customerForm.shipping_address} onChange={e => setCustomerForm({ ...customerForm, shipping_address: e.target.value })}
                />
              </div>
              <div className='flex justify-end gap-2 pt-2 border-b border-slate-100'>
                <button type='button' onClick={() => setShowCustomerModal(false)} className='px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md transition-all'>Cancel</button>
                <button type='submit' className='px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow rounded-md transition-all'>Commit Ledger Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[300]'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-[400px]'>
            <h3 className='font-bold mb-3 text-slate-800 text-sm'>Reject Warehouse Order Invoice</h3>
            <textarea
              placeholder='Enter formal verification rejection notes...' rows="3" className='w-full border p-2 text-sm rounded mb-4 focus:ring-1 focus:ring-rose-500'
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            />
            <div className='flex justify-end gap-2'>
              <button onClick={() => setRejectModal(null)} className='px-4 py-1.5 text-xs bg-slate-100 text-slate-600 rounded font-medium'>Cancel</button>
              <button onClick={handleReject} className='px-4 py-1.5 text-xs bg-rose-600 text-white rounded font-bold shadow-sm'>Submit Rejection Ledger</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperationsView