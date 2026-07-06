import React, { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';
import { 
  Ticket, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calendar,
  Percent,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/coupons`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (err) {
      console.error('Fetch coupons error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMinOrderAmount('');
    setMaxUses('');
    setIsActive(true);
    setExpiresAt('');
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue.toString());
    setMinOrderAmount(coupon.minOrderAmount ? coupon.minOrderAmount.toString() : '');
    setMaxUses(coupon.maxUses ? coupon.maxUses.toString() : '');
    setIsActive(coupon.isActive);
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon? Active checkouts using this code will fail.')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Coupon deleted successfully.');
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to delete coupon.');
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const res = await fetch(`${API_BASE}/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isActive: !coupon.isActive
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to toggle status.');
      }
    } catch (err) {
      console.error('Toggle coupon status error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code || !discountValue) {
      return alert('Coupon Code and Discount Value are required.');
    }

    const payload = {
      code,
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
      maxUses: maxUses ? parseInt(maxUses) : null,
      isActive,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null
    };

    try {
      const url = editingCoupon 
        ? `${API_BASE}/admin/coupons/${editingCoupon.id}`
        : `${API_BASE}/admin/coupons`;

      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to save coupon.');
      }
    } catch (err) {
      console.error('Save coupon error:', err);
      alert('Error saving coupon.');
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Coupons & Discounts</h1>
          <p className="text-sm text-slate-500 mt-1">Manage marketing campaigns, flat discounts, and percentage codes.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Coupon List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No Coupon Codes Found</p>
          <p className="text-sm mt-1">Get started by clicking the "Create Coupon" button.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold tracking-wider bg-slate-50/50">
                <th className="py-4 px-6">Coupon Info</th>
                <th className="py-4 px-6">Discount Settings</th>
                <th className="py-4 px-6">Usage limits</th>
                <th className="py-4 px-6">Expiration</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                const isExhausted = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
                return (
                  <tr key={coupon.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors text-sm">
                    {/* Code */}
                    <td className="py-5 px-6 font-bold text-slate-900 font-mono">
                      {coupon.code}
                    </td>

                    {/* Settings */}
                    <td className="py-5 px-6 text-slate-700">
                      <div>
                        <span className="font-bold text-emerald-600">
                          {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </span>
                        <span> discount</span>
                      </div>
                      {coupon.minOrderAmount && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Min Order Amount: ₹{coupon.minOrderAmount}
                        </div>
                      )}
                    </td>

                    {/* Limits */}
                    <td className="py-5 px-6 text-slate-500">
                      <span className="font-semibold text-slate-700">{coupon.usedCount}</span>
                      <span> / {coupon.maxUses ? coupon.maxUses : 'Unlimited'} uses</span>
                    </td>

                    {/* Expiry */}
                    <td className="py-5 px-6 text-slate-500">
                      {isExhausted ? (
                        <span className="text-rose-500 font-medium">Exhausted</span>
                      ) : coupon.expiresAt ? (
                        <span className={isExpired ? 'text-rose-500 font-medium' : ''}>
                          {new Date(coupon.expiresAt).toLocaleDateString()}
                          {isExpired && ' (Expired)'}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Never Expires</span>
                      )}
                    </td>

                    {/* Toggle Status */}
                    <td className="py-5 px-6">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                          !coupon.isActive
                            ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            : isExpired
                            ? 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100'
                            : isExhausted
                            ? 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {!coupon.isActive ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-400" /> Inactive
                          </>
                        ) : isExpired ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Expired
                          </>
                        ) : isExhausted ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-amber-500" /> Exhausted
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Active
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                          title="Edit Coupon"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-150 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCoupon ? 'Modify Coupon Settings' : 'Create New Coupon'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'PERCENTAGE' ? '10' : '50'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Min Order Limit (₹)</label>
                  <input
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    placeholder="200"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Max Total Uses</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modalIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="modalIsActive" className="text-xs font-semibold text-slate-600 select-none">
                  Enable coupon immediately (Active status)
                </label>
              </div>

              {/* Modal footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
