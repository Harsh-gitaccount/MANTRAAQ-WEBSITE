import React, { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  Package, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      } else {
        setError(data.message || 'Failed to fetch dashboard metrics.');
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Connection failure to API server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-screen">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6" /> System Error
          </h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { 
    totalRevenue = 0, 
    totalOrders = 0, 
    activeCustomers = 0, 
    productCount = 0, 
    lowStockVariants = [], 
    recentOrders = [],
    salesTrend = {},
    ordersByStatus = {}
  } = metrics || {};

  const totalPlacedOrders = Object.values(ordersByStatus || {}).reduce((sum, val) => sum + val, 0);
  const cancelledCount = ordersByStatus?.CANCELLED || 0;
  const refundedCount = ordersByStatus?.REFUNDED || 0;
  const activeCount = Math.max(0, totalPlacedOrders - (cancelledCount + refundedCount));

  const kpis = {
    totalRevenue,
    totalOrders,
    activeUsers: activeCustomers,
    productCount,
    lowStockCount: lowStockVariants.length,
  };

  const lowStockAlerts = lowStockVariants;

  // Compile real revenue chart data from actual database orders over time
  const chartData = Object.keys(salesTrend).map(month => ({
    name: month,
    Sales: salesTrend[month]
  }));

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight m-0">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time health metrics of MantraAQ store.</p>
        </div>
        <button 
          onClick={fetchMetrics} 
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales</p>
            <p className="text-2xl font-bold text-slate-900">₹{(kpis?.totalRevenue || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-600">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900">{totalPlacedOrders}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              <span>{activeCount} active</span>
              {cancelledCount > 0 && (
                <span className="text-rose-500 font-semibold ml-1.5">
                  · {cancelledCount} cancelled
                </span>
              )}
              {refundedCount > 0 && (
                <span className="text-amber-500 font-semibold ml-1.5">
                  · {refundedCount} refunded
                </span>
              )}
            </p>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl text-blue-600">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Customers</p>
            <p className="text-2xl font-bold text-slate-900">{kpis?.activeUsers || 0}</p>
          </div>
          <div className="bg-violet-500/10 p-3 rounded-xl text-violet-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Catalog</p>
            <p className="text-2xl font-bold text-slate-900">{kpis?.productCount || 0}</p>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-xl text-amber-600">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock alerts</p>
            <p className={`text-2xl font-bold ${kpis?.lowStockCount > 0 ? 'text-amber-500' : 'text-slate-900'}`}>
              {kpis?.lowStockCount || 0}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${kpis?.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Sales Trend (₹)
            </h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Low Stock Alerts
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-64">
            {lowStockAlerts && lowStockAlerts.length > 0 ? (
              lowStockAlerts.map(variant => (
                <div key={variant.id} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{variant.product.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Variant: {variant.title} | SKU: {variant.sku || 'N/A'}</p>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {variant.stockQuantity} Left
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Package className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">All product stocks are healthy!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-950">Recent Customer Orders</h2>
          <Link to="/orders" className="text-emerald-500 hover:text-emerald-600 text-sm font-medium flex items-center gap-1 transition-colors">
            View All Orders <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                <th className="py-4 px-4">Order ID</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Total</th>
                <th className="py-4 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm">
                    <td className="py-4 px-4 font-mono font-medium text-slate-700">#{order.id.slice(0, 8)}</td>
                    <td className="py-4 px-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-slate-700">{order.user?.email || order.shippingAddress?.email || 'Guest User'}</td>
                    <td className="py-4 px-4 font-semibold text-slate-900">₹{order.totalAmount.toFixed(0)}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'DELIVERED' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status.toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">No paid orders recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
