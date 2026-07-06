import React, { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  MapPin, 
  ChevronRight, 
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Detail Modal / Row Expansion State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/admin/customers?page=${page}&limit=15&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset page to 1 on new search query
  };

  const handleViewDetails = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${API_BASE}/admin/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer(data.data);
      } else {
        alert(data.message || 'Failed to fetch details.');
      }
    } catch (err) {
      console.error('Fetch customer details error:', err);
      alert('Error fetching details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 text-slate-800">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Customers Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor buyer acquisition, customer total spend, and purchase frequencies.</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name or email..."
            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No Customers Found</p>
          <p className="text-sm mt-1">Try refining your search keyword.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold tracking-wider bg-slate-50/50">
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6">Orders Count</th>
                  <th className="py-4 px-6">Total Spend</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors text-sm">
                    {/* Name & Contact */}
                    <td className="py-5 px-6">
                      <div>
                        <p className="font-bold text-slate-900">{c.name || 'Anonymous User'}</p>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                          </span>
                          {c.phone && (
                            <span className="text-xs text-slate-500 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-5 px-6 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Orders count */}
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {c.orderCount} orders
                      </span>
                    </td>

                    {/* Total spent */}
                    <td className="py-5 px-6 font-bold text-slate-900">
                      ₹{c.totalSpend.toFixed(0)}
                    </td>

                    {/* Inspect details */}
                    <td className="py-5 px-6 text-right">
                      <button
                        onClick={() => handleViewDetails(c.id)}
                        className="text-emerald-500 hover:text-emerald-600 font-semibold text-sm inline-flex items-center gap-1"
                      >
                        Inspect profile <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-semibold px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Overlay Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Customer Profile Summary
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">ID: {selectedCustomer.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              {/* Profile Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Buyer Name</p>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedCustomer.name || 'Anonymous User'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="font-bold text-slate-700 mt-0.5 truncate" title={selectedCustomer.email}>{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="font-bold text-slate-700 mt-0.5">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Acquired Date</p>
                  <p className="font-bold text-slate-700 mt-0.5">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column 1: Addresses */}
                <div className="md:col-span-1 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" /> Shipping Addresses
                  </h3>
                  {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCustomer.addresses.map((addr) => (
                        <div key={addr.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                          <p className="font-bold text-slate-800">{addr.name} ({addr.label})</p>
                          <p className="text-slate-600">{addr.street}</p>
                          <p className="text-slate-600">{addr.city}, {addr.state} - {addr.postalCode}</p>
                          <p className="text-slate-500 font-semibold pt-1">Tel: {addr.phone}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No addresses saved.</p>
                  )}
                </div>

                {/* Column 2 & 3: Orders List */}
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-slate-400" /> Orders History
                  </h3>
                  {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {selectedCustomer.orders.map((order) => (
                        <div key={order.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex justify-between items-center gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">#{order.id.slice(0, 8)}</span>
                              <span className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-slate-500 mt-1 truncate max-w-xs font-medium">
                              {order.orderLineItems ? order.orderLineItems.map(item => `${item.productName || 'Product'} x${item.quantity}`).join(', ') : 'Details loading...'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-slate-950">₹{order.totalAmount.toFixed(0)}</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 uppercase ${
                              order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'DELIVERED' ? 'bg-purple-100 text-purple-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {order.status.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No completed orders found for this customer.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-150 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-lg text-xs"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
