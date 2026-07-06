import React, { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Truck, 
  CheckCircle, 
  Eye, 
  XCircle,
  Clock,
  X,
  CreditCard
} from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Edit Address Modal State
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressOrderId, setEditAddressOrderId] = useState(null);
  const [editAddressData, setEditAddressData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const handleEditAddressClick = (orderId, address) => {
    setEditAddressOrderId(orderId);
    setEditAddressData({
      name: address?.name || '',
      email: address?.email || '',
      phone: address?.phone || '',
      street: address?.street || '',
      city: address?.city || '',
      state: address?.state || '',
      postalCode: address?.postalCode || '',
    });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${editAddressOrderId}/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editAddressData)
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === editAddressOrderId ? { ...o, shippingAddress: data.data.shippingAddress } : o));
        setIsEditingAddress(false);
        alert('Delivery location updated successfully!');
      } else {
        alert(data.message || 'Failed to update address.');
      }
    } catch (err) {
      console.error('Update address error:', err);
      alert('Failed to connect to server.');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'ALL' 
        ? `${API_BASE}/admin/orders`
        : `${API_BASE}/admin/orders?status=${activeTab}`;
        
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(id);
      fetchOrderDetails(id);
    }
  };

  const fetchOrderDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === id ? data.data : o));
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  const handleDispatch = async (id) => {
    const trackingNumber = trackingInputs[id];
    if (!trackingNumber) return alert('Please input a tracking number.');

    setActionLoading({ ...actionLoading, [id]: true });
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/dispatch`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ trackingNumber }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Order marked as dispatched. Customer tracking email has been sent.');
        fetchOrders();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error dispatching order:', err);
    } finally {
      setActionLoading({ ...actionLoading, [id]: false });
    }
  };

  const handleDeliver = async (id) => {
    if (!window.confirm('Mark this order as delivered?')) return;

    setActionLoading({ ...actionLoading, [id]: true });
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/deliver`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      const data = await res.json();
      if (data.success) {
        alert('Order status updated to Delivered.');
        fetchOrders();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error delivering order:', err);
    } finally {
      setActionLoading({ ...actionLoading, [id]: false });
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and refund this order? This will restore stock inventory and initiate payment refund (if online payment).')) return;

    setActionLoading({ ...actionLoading, [id]: true });
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/cancel`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Order cancelled successfully.');
        fetchOrders();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
    } finally {
      setActionLoading({ ...actionLoading, [id]: false });
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-8 text-slate-800">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 m-0">Orders Fulfillments</h1>
        <p className="text-sm text-slate-500 mt-1">Track payments, shipping updates, and customer shipments.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        {['ALL', 'PENDING', 'PAID', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setExpandedOrderId(null); }}
            className={`py-3 px-4 text-sm font-semibold transition-all border-b-2 ${
              activeTab === tab 
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders Grid/Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No Orders Found</p>
          <p className="text-sm mt-1">Orders with status "{activeTab.toLowerCase()}" are empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                {/* Collapsed Header Summary */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm font-bold text-slate-900">
                      #{order.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className="text-sm">
                      <span className="text-slate-400">Buyer:</span>{' '}
                      <span className="font-semibold text-slate-700">
                        {order.shippingAddress?.name || order.user?.email || 'Guest User'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-950">
                      ₹{order.totalAmount.toFixed(0)}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'DELIVERED' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {(order.status === 'PAID' || order.status === 'PENDING') && <Clock className="w-3 h-3" />}
                        {order.status === 'DISPATCHED' && <Truck className="w-3 h-3" />}
                        {order.status === 'DELIVERED' && <CheckCircle className="w-3 h-3" />}
                        {order.status.toLowerCase()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                        (order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD')
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {(order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD') ? 'COD' : 'ONLINE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/30 p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Items column */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm col-span-2">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                        Items Purchased
                      </h3>
                      {order.orderLineItems ? (
                        <div className="space-y-3">
                          {order.orderLineItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-sm">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {item.variant?.product?.name || 'Loading Product...'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Variant: {item.variant?.title || 'N/A'} | SKU: {item.variant?.sku || 'N/A'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">₹{item.priceAtPurchase.toFixed(0)}</p>
                                <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="animate-pulse space-y-2 py-4">
                          <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                        </div>
                      )}
                    </div>

                    {/* Shipping Address and Dispatch Form */}
                    <div className="space-y-6">
                      {/* Shipping Address Box */}
                      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-sm space-y-3">
                        <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400" /> Delivery Address
                          </span>
                          {(order.status === 'PAID' || order.status === 'PENDING') && (
                            <button
                              type="button"
                              onClick={() => handleEditAddressClick(order.id, order.shippingAddress)}
                              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                            >
                              Edit Location
                            </button>
                          )}
                        </h3>
                        <div>
                          <p className="font-semibold text-slate-800">{order.shippingAddress?.name}</p>
                          <p className="text-slate-600 mt-1">
                            {order.shippingAddress?.street}, {order.shippingAddress?.city}
                          </p>
                          <p className="text-slate-600">
                            {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-50 space-y-1.5">
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{order.shippingAddress?.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="truncate">{order.shippingAddress?.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-xs pt-1.5 border-t border-slate-50">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">Payment:</span>
                            <span>
                              {(order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD') 
                                ? 'Cash on Delivery (COD)' 
                                : `Online (${order.paymentId || 'PayU'})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dispatch Actions Box */}
                      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                          Fulfillment Action
                        </h3>

                        {(order.status === 'PAID' || (order.status === 'PENDING' && (order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD'))) && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Carrier Tracking Number (e.g. Delhivery, DTDC)
                              </label>
                              <input
                                type="text"
                                value={trackingInputs[order.id] || ''}
                                onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })}
                                placeholder="DELHIVERY1234567"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm"
                              />
                            </div>
                            <button
                              onClick={() => handleDispatch(order.id)}
                              disabled={actionLoading[order.id]}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-1"
                            >
                              <Truck className="w-4 h-4" />
                              {actionLoading[order.id] ? 'Dispatching...' : 'Dispatch Shipment'}
                            </button>
                          </div>
                        )}

                        {order.status === 'DISPATCHED' && (
                          <div className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                              <p><strong>Status:</strong> Shipped</p>
                              <p><strong>Tracking:</strong> {order.trackingNumber}</p>
                            </div>
                            <button
                              onClick={() => handleDeliver(order.id)}
                              disabled={actionLoading[order.id]}
                              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {actionLoading[order.id] ? 'Updating...' : 'Mark Delivered'}
                            </button>
                          </div>
                        )}

                        {order.status === 'DELIVERED' && (
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-sm">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-semibold">Fulfillment Completed</span>
                          </div>
                        )}

                        {order.status === 'CANCELLED' && (
                          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg text-sm">
                            <XCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-semibold">Order Cancelled</span>
                          </div>
                        )}

                        {(['PAID', 'DISPATCHED', 'DELIVERED'].includes(order.status) || (order.status === 'PENDING' && order.paymentId?.toLowerCase().startsWith('cod'))) && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleCancel(order.id)}
                              disabled={actionLoading[order.id]}
                              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 font-semibold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {actionLoading[order.id] ? 'Cancelling...' : 'Cancel & Refund Order'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Address Modal */}
      {isEditingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-150 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Delivery Address</h2>
              <button 
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Recipient Name</label>
                  <input
                    type="text"
                    value={editAddressData.name}
                    onChange={(e) => setEditAddressData({ ...editAddressData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="text"
                    value={editAddressData.phone}
                    onChange={(e) => setEditAddressData({ ...editAddressData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={editAddressData.email}
                  onChange={(e) => setEditAddressData({ ...editAddressData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Street Address</label>
                <input
                  type="text"
                  value={editAddressData.street}
                  onChange={(e) => setEditAddressData({ ...editAddressData, street: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    value={editAddressData.city}
                    onChange={(e) => setEditAddressData({ ...editAddressData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">State</label>
                  <input
                    type="text"
                    value={editAddressData.state}
                    onChange={(e) => setEditAddressData({ ...editAddressData, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">PIN Code</label>
                  <input
                    type="text"
                    value={editAddressData.postalCode}
                    onChange={(e) => setEditAddressData({ ...editAddressData, postalCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
