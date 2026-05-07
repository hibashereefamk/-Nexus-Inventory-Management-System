import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {toast,Toaster} from 'react-hot-toast'
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
  const [approve,setapprove]=useState(null)
  const[reject,setreject]=useState(null)

  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const [newOrder, setNewOrder] = useState({
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

  // FETCH DATA
  const fetchOrders = async () => {
    const res = await axios.get(
      `${API}/api/orders/admin/orders/`,
      getAuthHeaders()
    )
    setOrders(res.data.results || res.data)
  }

  const fetchDropdownData = async () => {
    const [p, d] = await Promise.all([
      axios.get(`${API}/api/orders/products-short/`, getAuthHeaders()),
      axios.get(`${API}/api/orders/departments/`, getAuthHeaders())
    ])
    setProducts(p.data.results || p.data)
    setDepartments(d.data.results || d.data)
  }

  useEffect(() => {
    fetchOrders()
    if (isAdmin) fetchDropdownData()
  }, [])

  
  const handleReject = async () => {
    // 1. Local Validation
    if (!rejectReason.trim()) {
        toast('Please provide a rejection reason.');
        return;
    }

    try {
        // 2. Assign the response to 'res' so we can use res.data
        const res = await axios.post(
            `${API}/api/orders/admin/orders/${rejectModal}/reject/`,
            {
                rejection_reason: rejectReason
            },
            getAuthHeaders()
        );

        // 3. UI Cleanup
        setRejectModal(null);
        setRejectReason('');
        
        // 4. Refresh the list to show the new status
        fetchOrders();

        // 5. Use the message directly from the backend JSON (shown in your screenshot)
        // res.data.message will be "Order ORD-0D... has been rejected..."
        toast.success(res.data.message);

    } catch (err) {
        // Handle backend errors (e.g., trying to reject a Shipped order)
        const errMsg = err.response?.data?.error || 'Rejection failed';
        toast.error(`Error: ${errMsg}`);
    }
};
  // Inside your OperationsView component

  // 1. Updated handleCreateOrder with error handling
  const handleCreateOrder = async e => {
    e.preventDefault()

    try {
      const res = await axios.post(
        `${API}/api/orders/admin/orders/`,
        newOrder,
        getAuthHeaders()
      )

      setNewOrder({
        items: [{ product: '', quantity: 1 }],
        target_department: ''
      })
      setActiveTab('all-orders')
      fetchOrders()
      toast.success('Order drafted successfully!')
    } catch (err) {
      // This catches the validation error from your Django model/serializer
      const errMsg =
        err.response?.data?.error || 'Check stock levels before submitting.'
      toast.error(`Order Error: ${errMsg}`)
    }
  }

const updateStatus = async (order_number, action) => {
  try {
    const res = await axios.post(
      `${API}/api/orders/admin/orders/${order_number}/${action}/`,
      {},
      getAuthHeaders()
    );
    fetchOrders();
    alert(res.data.message);
  } catch (err) {
    // 1. Log the full object for one last check
    console.log("Full Error Response Data:", err.response?.data);
    toast.error(err.response.data.error)


  }
};
  const getStatusStyle = status => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600'
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-600'
      case 'REJECTED':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100'
    }
  }
  const getStockInfo = (productId) => {
  const product = products.find(p => p.id === parseInt(productId));
  return product ? product.available_stock : 0;
};

  return (
    <div className='bg-slate-100 min-h-screen p-6'>
      <Toaster position="top-right" />
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold text-slate-800'>
          Warehouse Operations
        </h1>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('create')}
            className='bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg shadow'
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
            className={`pb-2 font-medium ${
              activeTab === tab
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-400'
            }`}
          >
            {tab === 'all-orders' ? 'All Orders' : 'Pending'}
          </button>
        ))}
      </div>

{activeTab === 'create' && (
  <div className='bg-white p-6 rounded-xl shadow-md max-w-xl'>
    <h2 className='font-bold mb-4 text-lg'>Create Order</h2>

    <form onSubmit={handleCreateOrder} className='space-y-4'>
      {newOrder.items.map((item, index) => (
        /* --- UPDATED ITEM ROW --- */
        <div key={index} className='flex flex-col gap-1 mb-4 p-2 border-l-4 border-indigo-200'>
          <div className='flex gap-2'>
            {/* Product Dropdown - Now shows Available Stock */}
            <select
              className='flex-1 border p-2 rounded text-sm'
              value={item.product}
              onChange={e => updateItem(index, 'product', e.target.value)}
            >
              <option value=''>Select Product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Available: {p.available_stock})
                </option>
              ))}
            </select>

            {/* Quantity Input - Now validates against Stock */}
            <div className="relative">
              <input
                type='number'
                min='1'
                className={`w-24 border p-2 rounded text-sm ${
                  item.product && item.quantity > getStockInfo(item.product) 
                    ? 'border-red-500 bg-red-50 animate-pulse' 
                    : ''
                }`}
                value={item.quantity}
                onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
              />
              {/* Visual warning if requested quantity > stock */}
              {item.product && item.quantity > getStockInfo(item.product) && (
                <span className="text-[10px] text-red-600 font-bold absolute -bottom-4 left-0 whitespace-nowrap">
                  ⚠️ Max Available: {getStockInfo(item.product)}
                </span>
              )}
            </div>

            {/* Remove Button */}
            <button
              type='button'
              onClick={() => removeItem(index)}
              className='bg-red-500 hover:bg-red-600 text-white px-3 rounded transition-colors'
            >
              ✕
            </button>
          </div>
        </div>
        /* --- END UPDATED ITEM ROW --- */
      ))}

      <button
        type='button'
        onClick={addItem}
        className='bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-sm mb-4'
      >
        + Add Product
      </button>

      <select
        className='w-full border p-2 rounded text-sm'
        value={newOrder.target_department}
        onChange={e =>
          setNewOrder({ ...newOrder, target_department: e.target.value })
        }
      >
        <option value=''>Select Target Department</option>
        {departments.map(d => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {/* Disable Submit if any item is over-stocked */}
      <button 
        disabled={newOrder.items.some(item => item.product && item.quantity > getStockInfo(item.product))}
        className={`w-full py-2 rounded font-bold transition-all ${
          newOrder.items.some(item => item.product && item.quantity > getStockInfo(item.product))
          ? 'bg-gray-300 cursor-not-allowed text-gray-500'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
        }`}
      >
        Submit Order Request
      </button>
    </form>
  </div>
)}

      {/* TABLE */}
      {activeTab !== 'create' && (
        <div className='bg-white rounded-xl shadow overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-slate-50 text-xs text-gray-500 uppercase'>
              <tr>
                <th className='p-4'>Order</th>
                <th className='p-4'>Product</th>
                <th className='p-4'>Qty</th>
                <th className='p-4'>Status</th>
                <th className='p-4 text-right'>Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders
                .filter(o =>
                  activeTab === 'pending' ? o.status === 'DRAFT' : true
                )
                .map(order => (
                  <tr
                    key={order.order_number}
                    className='border-t hover:bg-slate-50'
                  >
                    <td className='p-4 font-mono'>{order.order_number}</td>
                    <td className='p-4'>
                      <div className='space-y-1'>
                        {order.products?.map((p, i) => (
                          <div key={i} className='text-sm text-gray-700'>
                            • {p.name}{' '}
                            <span className='text-gray-500'>
                              (x{p.quantity})
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className='p-4'>
                      {order.products?.reduce(
                        (total, p) => total + p.quantity,
                        0
                      )}
                    </td>

                    <td className='p-4'>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className='p-4 text-right'>
                      {order.status === 'DRAFT' && isAdmin && (
                        <div className='flex justify-end gap-2'>
                          <button
                            onClick={() =>
                              updateStatus(order.order_number, 'confirm')
                            }
                            className='bg-green-500 text-white px-3 py-1 rounded text-xs'
                          >
                            Confirm
                          </button>

                          <button
                            onClick={() => setRejectModal(order.order_number)}
                            className='bg-red-500 text-white px-3 py-1 rounded text-xs'
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className='p-10 text-center text-gray-400'>
              No orders found
            </div>
          )}
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-xl shadow-lg w-[400px]'>
            <h3 className='font-bold mb-3'>Reject Order</h3>

            <textarea
              placeholder='Enter rejection reason...'
              className='w-full border p-2 rounded mb-4'
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />

            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setRejectModal(null)}
                className='px-4 py-1 bg-gray-300 rounded'
              >
                Cancel
              </button>

              <button
                onClick={handleReject}
                className='px-4 py-1 bg-red-600 text-white rounded'
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OperationsView
