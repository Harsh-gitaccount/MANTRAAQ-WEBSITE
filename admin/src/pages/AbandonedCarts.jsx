import { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';
import {
  ShoppingCart,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  CheckCircle,
  Download,
  AlertTriangle
} from 'lucide-react';

const TABS = [
  { key: 'abandoned', label: 'Not ordered' },
  { key: 'recovered', label: 'Ordered later' },
  { key: 'all', label: 'All' },
];

const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const itemLine = (items) => (items || []).map((i) => `${i.name}${i.title ? ` (${i.title})` : ''} x${i.quantity}`).join(', ');

// Ready-to-send WhatsApp follow-up; the admin can edit it in WhatsApp before sending
function whatsappLink(row) {
  const first = (row.name || '').split(' ')[0];
  const items = (row.items || []).map((i) => i.name).join(', ');
  const text = `Hi${first ? ` ${first}` : ''}, this is MantraAQ. We saw you were checking out ${items || 'your cart'} (${money(row.cartValue)}) but the order didn't go through. Can we help you complete it? Reply here and we'll sort it out.`;
  return `https://wa.me/91${row.phone}?text=${encodeURIComponent(text)}`;
}

export default function AbandonedCarts() {
  const [tab, setTab] = useState('abandoned');
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const fetchRows = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/abandoned-checkouts?status=${tab}&page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setRows(data.data || []);
        setCounts(data.counts || {});
      } else {
        setError(data.message || 'Failed to load abandoned carts.');
      }
    } catch (err) {
      console.error('Fetch abandoned carts error:', err);
      setError('Connection failure to API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const toggleContacted = async (row) => {
    const contacted = !row.contactedAt;
    setRows(rows.map((r) => (r.id === row.id ? { ...r, contactedAt: contacted ? new Date().toISOString() : null } : r)));
    try {
      await fetch(`${API_BASE}/admin/abandoned-checkouts/${row.id}/contacted`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ contacted })
      });
    } catch (err) {
      console.error('Mark contacted error:', err);
      fetchRows();
    }
  };

  const exportToCSV = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['Name', 'Phone', 'Email', 'City', 'PIN', 'Items', 'Cart value', 'Last active', 'Contacted', 'Ordered'];
    const lines = rows.map((r) => [
      r.name, r.phone, r.email, r.city, r.postalCode, itemLine(r.items), Math.round(r.cartValue),
      when(r.updatedAt), r.contactedAt ? 'Yes' : 'No', r.orderId ? 'Yes' : 'No'
    ].map(esc).join(','));
    const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mantraaq_abandoned_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil((counts[tab] || 0) / limit) || 1;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 text-slate-800">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Abandoned Carts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Shoppers who typed their phone or email at checkout but did not order. Listed 30 minutes after they stop.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-maroon-700 hover:bg-maroon-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm self-start"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Not ordered</p>
          <p className="text-2xl font-bold text-slate-900">{counts.abandoned || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Value left in carts</p>
          <p className="text-2xl font-bold text-maroon-700">{money(counts.abandonedValue)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ordered later</p>
          <p className="text-2xl font-bold text-leaf-700">{counts.recovered || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-maroon-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.label} ({counts[t.key] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">Nothing here yet</p>
          <p className="text-sm mt-1">Carts appear once a shopper enters their phone or email at checkout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${row.contactedAt ? 'border-leaf-200' : 'border-slate-100'}`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900 m-0">{row.name || 'No name given'}</p>
                    {row.orderId && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-leaf-100 text-leaf-800">
                        Ordered {money(row.orderTotal)}
                      </span>
                    )}
                    {row.contactedAt && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gold-100 text-gold-800">
                        Contacted {when(row.contactedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    {row.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{row.phone}</span>}
                    {row.email && <span className="flex items-center gap-1.5 min-w-0"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{row.email}</span></span>}
                    {(row.city || row.postalCode) && (
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{[row.city, row.postalCode].filter(Boolean).join(' ')}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 m-0">
                    <span className="font-semibold">{money(row.cartValue)}</span>
                    <span className="text-slate-400"> · </span>
                    {itemLine(row.items) || 'Cart items not recorded'}
                  </p>
                  <p className="text-xs text-slate-400 m-0">Last active {when(row.updatedAt)}</p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {row.phone && (
                    <a
                      href={whatsappLink(row)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-leaf-700 hover:bg-leaf-600 text-white"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
                  {row.phone && (
                    <a href={`tel:+91${row.phone}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                  {row.email && (
                    <a
                      href={`mailto:${row.email}?subject=${encodeURIComponent('Your MantraAQ order')}&body=${encodeURIComponent(`Hi ${row.name || ''},\n\nWe noticed your order for ${itemLine(row.items)} didn't go through. Can we help you complete it?\n\nTeam MantraAQ`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Mail className="w-4 h-4" /> Email
                    </a>
                  )}
                  <button
                    onClick={() => toggleContacted(row)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border ${
                      row.contactedAt ? 'bg-leaf-50 border-leaf-200 text-leaf-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> {row.contactedAt ? 'Contacted' : 'Mark contacted'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-semibold px-2">Page {page} of {totalPages}</span>
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
    </div>
  );
}
