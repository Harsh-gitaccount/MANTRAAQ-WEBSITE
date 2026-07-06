import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Ticket,
  Users,
  LogOut, 
  User,
  Mail,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Coupons', path: '/coupons', icon: Ticket },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Subscribers', path: '/subscribers', icon: Mail },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 transition-transform duration-200 ease-in-out transform md:sticky md:top-0 md:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
          MantraAQ Admin
        </span>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 md:hidden rounded-lg hover:bg-slate-800"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile & Logout Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-slate-800 p-2 rounded-full text-slate-400">
            <User className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Logged In As</p>
            <p className="text-sm font-medium text-slate-300 truncate" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
