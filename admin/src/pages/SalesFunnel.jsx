import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../context/AuthContext';
import { AlertTriangle, ArrowRight, TrendingDown } from 'lucide-react';

const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

// Funnel steps, top to bottom. "orders" comes from real orders, the rest from the storefront.
const STEPS = [
  { key: 'visit', label: 'Visited the site', hint: 'Shoppers who opened any page', action: 'visit' },
  { key: 'product_view', label: 'Viewed a product page', hint: 'Opened at least one product page', action: 'open a product page' },
  { key: 'add_to_cart', label: 'Added to cart', hint: 'Added at least one item', action: 'add anything to cart' },
  { key: 'checkout_start', label: 'Started checkout', hint: 'Pressed Proceed to Checkout', action: 'start checkout' },
  { key: 'checkout_details', label: 'Entered phone or email', hint: 'Typed contact details at checkout', action: 'enter a phone or email' },
  { key: 'orders', label: 'Placed an order', hint: 'Paid online or placed COD', action: 'place the order' },
];

// Capped at 100: orders from shoppers who visited before tracking began can outnumber visits
const pct = (part, whole) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);
const fmtDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function SalesFunnel() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFunnel = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/funnel?days=${days}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Failed to load the funnel.');
      }
    } catch (err) {
      console.error('Fetch funnel error:', err);
      setError('Connection failure to API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunnel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const totals = data?.totals || {};
  const top = totals.visit || 0;

  // Biggest drop between two neighbouring steps: where shoppers are lost most
  let worst = null;
  STEPS.slice(1).forEach((step, i) => {
    const prev = totals[STEPS[i].key] || 0;
    const lost = prev - (totals[step.key] || 0);
    if (prev > 0 && (!worst || lost / prev > worst.rate)) {
      worst = { from: STEPS[i], to: step, rate: lost / prev, lost };
    }
  });

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 text-slate-800">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Sales Funnel</h1>
          <p className="text-sm text-slate-500 mt-1">How many shoppers reach each step, and where they drop off.</p>
        </div>
        <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm self-start">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                days === r.days ? 'bg-maroon-700 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-maroon-700 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Funnel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
              <h2 className="text-lg font-bold text-slate-950 m-0">Shoppers at each step</h2>
              <p className="text-sm text-slate-500 m-0">
                Conversion: <b className="text-slate-900">{pct(totals.orders || 0, top)}%</b> of visitors ordered ·
                Revenue <b className="text-slate-900">₹{Math.round(totals.revenue || 0).toLocaleString('en-IN')}</b>
              </p>
            </div>

            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const value = totals[step.key] || 0;
                const prev = i > 0 ? (totals[STEPS[i - 1].key] || 0) : null;
                const width = top > 0 ? Math.min(100, Math.max(2, (value / top) * 100)) : 0;
                return (
                  <div key={step.key}>
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <div>
                        <span className="text-sm font-semibold text-slate-900">{step.label}</span>
                        <span className="text-xs text-slate-400 ml-2 hidden sm:inline">{step.hint}</span>
                      </div>
                      <div className="text-sm whitespace-nowrap">
                        <b className="text-slate-900">{value.toLocaleString('en-IN')}</b>
                        {prev !== null && (
                          <span className={`ml-2 text-xs font-semibold ${prev > 0 && value / prev < 0.3 ? 'text-rose-600' : 'text-slate-400'}`}>
                            {pct(value, prev)}% of previous
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${step.key === 'orders' ? 'bg-leaf-600' : 'bg-maroon-700'}`}
                        style={{ width: `${width}%`, opacity: 1 - i * 0.1 }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {worst && worst.lost > 0 && (
              <div className="mt-6 flex items-start gap-3 bg-gold-50 border border-gold-200 rounded-xl p-4 text-sm text-slate-700">
                <TrendingDown className="w-5 h-5 text-maroon-700 shrink-0 mt-0.5" />
                <p className="m-0">
                  Biggest drop: <b>{Math.round(worst.rate * 100)}%</b> of shoppers at “{worst.from.label}” did not {worst.to.action}.
                  {worst.to.key === 'orders' && (
                    <> Follow them up from <Link to="/abandoned" className="text-maroon-700 font-semibold">Abandoned Carts</Link>.</>
                  )}
                </p>
              </div>
            )}
            {top === 0 && (
              <p className="mt-6 text-sm text-slate-500">No visits recorded in this period yet. Numbers start counting from the day this feature went live.</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Products */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 mb-1">Products: viewed vs added to cart</h2>
              <p className="text-xs text-slate-400 mb-4">A product people view a lot but rarely add may need a better price, photos or description.</p>
              {(data?.products || []).length === 0 ? (
                <p className="text-sm text-slate-500">No product activity yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-semibold">Product</th>
                      <th className="py-2 font-semibold text-right">Views</th>
                      <th className="py-2 font-semibold text-right">Added</th>
                      <th className="py-2 font-semibold text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((p) => (
                      <tr key={p.handle} className="border-b border-slate-50">
                        <td className="py-2.5 font-medium text-slate-800 capitalize">{p.handle.replace(/-/g, ' ')}</td>
                        <td className="py-2.5 text-right">{p.views}</td>
                        <td className="py-2.5 text-right">{p.addedToCart}</td>
                        <td className="py-2.5 text-right text-slate-500">{p.views ? `${pct(p.addedToCart, p.views)}%` : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Day by day */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 mb-4">Day by day</h2>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-2 font-semibold">Day</th>
                      <th className="py-2 font-semibold text-right">Visits</th>
                      <th className="py-2 font-semibold text-right">Cart</th>
                      <th className="py-2 font-semibold text-right">Checkout</th>
                      <th className="py-2 font-semibold text-right">Orders</th>
                      <th className="py-2 font-semibold text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(data?.daily || [])].reverse().map((d) => (
                      <tr key={d.date} className="border-b border-slate-50">
                        <td className="py-2.5 text-slate-700 whitespace-nowrap">{fmtDate(d.date)}</td>
                        <td className="py-2.5 text-right">{d.visit}</td>
                        <td className="py-2.5 text-right">{d.add_to_cart}</td>
                        <td className="py-2.5 text-right">{d.checkout_start}</td>
                        <td className="py-2.5 text-right font-semibold text-leaf-700">{d.orders}</td>
                        <td className="py-2.5 text-right">₹{Math.round(d.revenue).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            Each step counts a shopper once per day per browser. Orders and revenue come from real orders.
            <Link to="/abandoned" className="text-maroon-700 font-semibold inline-flex items-center gap-1">
              See abandoned carts <ArrowRight className="w-3 h-3" />
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
