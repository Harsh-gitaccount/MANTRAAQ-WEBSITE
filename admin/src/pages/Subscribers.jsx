import React, { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';
import { 
  Mail, 
  Calendar, 
  Search,
  CheckCircle,
  Download
} from 'lucide-react';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const limit = 15;

  useEffect(() => {
    fetchSubscribers();
  }, [page]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/admin/newsletter-subscribers?page=${page}&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.subscribers || []);
        setTotalSubscribers(data.count || 0);
      }
    } catch (err) {
      console.error('Fetch subscribers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Filter subscribers locally
  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(totalSubscribers / limit) || 1;

  // Export to CSV helper
  const exportToCSV = () => {
    const headers = ['Email', 'Status', 'Subscribed Date'];
    const rows = subscribers.map(sub => [
      sub.email,
      sub.isActive ? 'Active' : 'Inactive',
      new Date(sub.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mantraaq_subscribers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 text-slate-800">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Newsletter Subscribers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and export marketing campaign subscribers.</p>
        </div>
        
        {/* Search & Export */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:items-center">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Filter by email..."
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No Subscribers Found</p>
          <p className="text-sm mt-1">Try refining your search keyword or gather subscriptions first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold tracking-wider bg-slate-50/50">
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Subscribed Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors text-sm">
                    <td className="py-5 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {sub.email}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Active
                      </span>
                    </td>
                    <td className="py-5 px-6 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
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
    </div>
  );
}
